// controllers/claimsController.js
const { validationResult } = require('express-validator');
const ExpenseClaim = require('../models/Claim');
const User = require('../models/User');
const emailService = require('../services/emailService');
const fileService = require('../services/fileService');
const realtime = require('../services/realtime');
const admin = require('firebase-admin'); // 👈 Added for direct upload
const { v4: uuidv4 } = require('uuid');  // 👈 Added for unique filenames

/**
 * @desc    Submit a new expense claim (Fixes File Upload)
 * @route   POST /api/faculty/claims
 * @access  Private (Faculty)
 */
exports.submitClaim = async (req, res) => {
    console.log("🚀 Submit Claim Request Received");

    // Optional: Check for validation errors if you use express-validator routes
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const facultyId = req.user.id;
        // Parse body fields (they come as strings in multipart/form-data)
        const { category, amount, description, dateIncurred, status } = req.body;
        
        const initialStatus = status === 'draft' ? 'draft' : 'submitted';
        let documentUrl = null;

        // 🟢 FIX: Handle File Upload Directly Here
        if (req.file) {
            console.log(`📂 Processing file: ${req.file.originalname}`);
            
            const bucket = admin.storage().bucket();
            const filename = `receipts/${uuidv4()}_${req.file.originalname}`;
            const file = bucket.file(filename);

            const stream = file.createWriteStream({
                metadata: { contentType: req.file.mimetype },
            });

            // Wrap stream in a promise to await completion
            await new Promise((resolve, reject) => {
                stream.on('error', (err) => {
                    console.error("❌ Firebase Upload Error:", err);
                    reject(err);
                });
                stream.on('finish', () => {
                    console.log("✅ File uploaded to Firebase");
                    resolve();
                });
                stream.end(req.file.buffer);
            });

            // Make public and get URL
            await file.makePublic();
            documentUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
        }

        // Create Claim Record
        const claim = await ExpenseClaim.create({
            facultyId,
            category,
            amount,
            description,
            dateIncurred,
            status: initialStatus,
            // 🟢 Save the URL we just generated
            documents: documentUrl ? [{ fileUrl: documentUrl, fileName: 'Receipt' }] : [], 
            auditTrail: [{
                timestamp: new Date(),
                status: initialStatus,
                changedBy: 'Faculty',
                notes: initialStatus === 'draft' ? 'Draft created' : 'Claim submitted for processing.'
            }]
        });

        // Send Email: Submission Confirmation (Non-blocking)
        if (initialStatus === 'submitted') {
            User.findByPk(facultyId).then(user => {
                if (user && user.email) {
                    emailService.sendSubmissionConfirmation({
                        email: user.email,
                        claimId: claim.id,
                        amount: claim.amount
                    }).catch(err => console.error('Email sending failed:', err.message));
                }
            });
        }

        res.status(201).json({
            success: true,
            data: claim,
            message: 'Expense claim submitted successfully.'
        });

    } catch (error) {
        console.error('Error submitting claim:', error);
        res.status(500).json({ success: false, error: 'Server Error during submission' });
    }
};

/**
 * @desc    Get all claims submitted by the logged-in faculty member
 * @route   GET /api/faculty/claims
 * @access  Private (Faculty)
 */
exports.getFacultyClaims = async (req, res) => {
    try {
        const claims = await ExpenseClaim.findAll({
            where: { facultyId: req.user.id },
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            count: claims.length,
            data: claims
        });

    } catch (error) {
        console.error('Error fetching claims:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

/**
 * @desc    Update claim status and send notification email (Fixes "Refer Back" Error)
 * @route   PUT /api/finance/claims/:id/status
 * @access  Private (Finance/Admin)
 */
exports.updateClaimStatus = async (req, res) => {
    const { id } = req.params;
    let { status, notes } = req.body; 

    console.log(`🔄 Update Status Request: ID ${id} -> ${status}`);

    try {
        const claim = await ExpenseClaim.findByPk(id);
        if (!claim) {
            return res.status(404).json({ success: false, error: 'Claim not found' });
        }

        const faculty = await User.findByPk(claim.facultyId);
        if (!faculty) {
            return res.status(404).json({ success: false, error: 'Faculty not found' });
        }

        // 🧠 LOGIC MAPPING FOR STATUS
        if (status === 'approved') status = 'pending_payment';
        if (status === 'more_info') status = 'referred_back';
        if (status === 'paid') status = 'disbursed';

        // Update claim status
        claim.status = status;

        // Add audit trail entry
        const auditEntry = {
            timestamp: new Date(),
            status: status,
            changedBy: req.user.role || 'Accounts', 
            notes: notes || `Status changed to ${status}`
        };

        let currentTrail = claim.auditTrail || [];
        // Handle potential string format from legacy data
        if (typeof currentTrail === 'string') {
             try { currentTrail = JSON.parse(currentTrail); } catch(e) { currentTrail = []; }
        }

        // Use spread to force Sequelize to see the change
        claim.auditTrail = [...currentTrail, auditEntry];
        claim.changed('auditTrail', true);

        // 🟢 SAVE TO DB FIRST (Critical for reliability)
        await claim.save();
        console.log("✅ Database updated successfully");

        // 👇 SEND EMAIL SAFELY
        // Wrapped in try/catch so if Email fails, the response is still SUCCESS
        if (faculty.email) {
            try {
                const emailOptions = {
                    email: faculty.email,
                    claimId: claim.id,
                    status: status,
                    notes: notes,
                    approvalNotes: notes, 
                    rejectionReason: notes,
                    clarificationNotes: notes,
                    amountPaid: claim.amount
                };

                let emailPromise;
                switch (status.toLowerCase()) {
                    case 'pending_payment': 
                        emailPromise = emailService.sendApprovalEmail(emailOptions);
                        break;
                    case 'rejected':
                        emailPromise = emailService.sendRejectionEmail(emailOptions);
                        break;
                    case 'referred_back':
                        emailPromise = emailService.sendClarificationRequest(emailOptions);
                        break;
                    case 'disbursed':
                        emailPromise = emailService.sendPaymentEmail(emailOptions);
                        break;
                    default:
                        emailPromise = emailService.sendStatusNotification(emailOptions);
                        break;
                }

                if (emailPromise) {
                    // Await here to log success, but catch error so it doesn't throw
                    await emailPromise;
                    console.log("📧 Email sent successfully");
                }
            } catch (emailErr) {
                console.error(`⚠️ Status saved, but Email FAILED:`, emailErr.message);
                // We do NOT throw here, allowing the function to return success
            }
        }

        // Emit realtime event
        try {
            const io = realtime.getIO();
            const payload = { claimId: claim.id, status: claim.status, auditEntry };
            io.to(`user_${claim.facultyId}`).emit('claimStatusUpdated', payload);
            io.emit('claimUpdated', { claimId: claim.id, status: claim.status });
        } catch (err) {
            console.warn('Realtime emit failed:', err.message);
        }

        res.status(200).json({
            success: true,
            data: claim,
            message: `Claim status updated to ${status}.`
        });

    } catch (error) {
        console.error('Error updating claim status:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

/**
 * @desc    Send a demo email to test email notifications (development only)
 * @route   POST /api/demo/send-email
 * @access  Private
 */
exports.sendDemoEmail = async (req, res) => {
    const { email, claimId, status, notes } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email address required' });

    try {
        let emailResult;
        if (status === 'clarification needed') {
            emailResult = await emailService.sendClarificationRequest({
                email, claimId: claimId || 'DEMO-001', clarificationNotes: notes || 'Demo note'
            });
        } else {
            emailResult = await emailService.sendStatusNotification({
                email, claimId: claimId || 'DEMO-001', status: status || 'approved', notes: notes || 'Demo note'
            });
        }
        res.status(200).json({ success: true, message: `Demo email sent to ${email}` });
    } catch (error) {
        console.error('Error sending demo email:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

/**
 * @desc    Upload a document/receipt to an existing claim
 * @route   POST /api/faculty/claims/:id/documents
 * @access  Private (Faculty)
 */
exports.uploadClaimDocument = async (req, res) => {
    const facultyId = req.user.id;
    const { id: claimId } = req.params;

    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file provided' });
    }

    try {
        const claim = await ExpenseClaim.findByPk(claimId);
        if (!claim) return res.status(404).json({ success: false, error: 'Claim not found' });
        if (claim.facultyId !== facultyId) return res.status(403).json({ success: false, error: 'Unauthorized' });

        // Upload file to Firebase
        const uploadResult = await fileService.uploadFile(req.file, claimId);

        if (!uploadResult.success) {
            return res.status(500).json({ success: false, error: 'File upload failed', details: uploadResult.error });
        }

        // Add document to claim's documents array
        const documents = [...(claim.documents || [])];
        documents.push({
            fileName: uploadResult.fileName,
            fileUrl: uploadResult.fileUrl,
            storagePath: uploadResult.storagePath,
            uploadedAt: uploadResult.uploadedAt,
            size: req.file.size,
            mimeType: req.file.mimetype
        });

        claim.documents = documents;
        claim.changed('documents', true); // Ensure JSON update is detected
        await claim.save();

        res.status(200).json({
            success: true,
            data: {
                fileName: uploadResult.fileName,
                fileUrl: uploadResult.fileUrl
            },
            message: 'Document uploaded successfully'
        });

    } catch (error) {
        console.error('Error uploading document:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

/**
 * @desc    List all documents for a claim
 * @route   GET /api/faculty/claims/:id/documents
 * @access  Private (Faculty)
 */
exports.getClaimDocuments = async (req, res) => {
    // (Kept as is from your provided code)
    const facultyId = req.user.id;
    const { id: claimId } = req.params;
    try {
        const claim = await ExpenseClaim.findByPk(claimId);
        if (!claim) return res.status(404).json({ success: false, error: 'Claim not found' });
        if (claim.facultyId !== facultyId) return res.status(403).json({ success: false, error: 'Unauthorized' });

        res.status(200).json({ success: true, data: claim.documents || [] });
    } catch (error) {
        console.error('Error retrieving documents:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};
/**
 * @desc    Resubmit a Referred Back / Draft Claim
 * @route   PUT /api/faculty/claims/:id
 * @access  Private (Faculty)
 */
exports.resubmitClaim = async (req, res) => {
    const { id } = req.params;
    const facultyId = req.user.id;
    // Extract text fields
    const { category, amount, description, dateIncurred } = req.body;

    try {
        // 1. Find Claim & Verify Ownership
        const claim = await ExpenseClaim.findOne({ 
            where: { id, facultyId } 
        });

        if (!claim) {
            return res.status(404).json({ success: false, error: 'Claim not found' });
        }

        // 2. Validate Status (Only allow editing if Referred Back or Draft)
        const allowedStatuses = ['referred_back', 'draft'];
        if (!allowedStatuses.includes(claim.status)) {
            return res.status(400).json({ 
                success: false, 
                error: `Cannot edit claim with status: ${claim.status}` 
            });
        }

        // 3. Handle New File Upload (Optional replacement)
        if (req.file) {
            console.log(`📂 Processing replacement file: ${req.file.originalname}`);
            const bucket = admin.storage().bucket();
            const filename = `receipts/${uuidv4()}_${req.file.originalname}`;
            const file = bucket.file(filename);

            await file.save(req.file.buffer, { contentType: req.file.mimetype });
            await file.makePublic();
            const documentUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
            
            // Append new doc to existing list
            const currentDocs = claim.documents || [];
            const newDoc = { 
                fileUrl: documentUrl, 
                fileName: req.file.originalname,
                uploadedAt: new Date()
            };
            claim.documents = [...currentDocs, newDoc];
            claim.changed('documents', true); // Notify Sequelize of JSON change
        }

        // 4. Update Fields
        if (category) claim.category = category;
        if (amount) claim.amount = amount;
        if (description) claim.description = description;
        if (dateIncurred) claim.dateIncurred = dateIncurred;
        
        // 5. Reset Status & Update Audit Trail
        claim.status = 'submitted';

        const newAuditEntry = {
            timestamp: new Date(),
            status: 'submitted',
            changedBy: 'Faculty',
            notes: 'Claim edited and resubmitted.'
        };

        const currentTrail = claim.auditTrail || [];
        claim.auditTrail = [...currentTrail, newAuditEntry];
        claim.changed('auditTrail', true);

        await claim.save();

        res.json({ 
            success: true, 
            message: 'Claim resubmitted successfully', 
            data: claim 
        });

    } catch (error) {
        console.error('Resubmit Error:', error);
        res.status(500).json({ success: false, error: 'Server Error during resubmission' });
    }
};
/**
 * @desc    Get ALL claims for Accounts Dashboard (Includes User Name)
 * @route   GET /api/finance/claims
 * @access  Private (Finance/Accounts)
 */
exports.getAllClaims = async (req, res) => {
    try {
        const claims = await ExpenseClaim.findAll({
            order: [['createdAt', 'DESC']],
            include: [{
                model: User,
                attributes: ['name', 'email', 'id', 'picture'] // Added picture just in case
            }]
        });

        res.status(200).json({
            success: true,
            data: claims
        });

    } catch (error) {
        console.error('Error fetching all claims:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};