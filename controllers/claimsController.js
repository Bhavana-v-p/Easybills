// controllers/claimsController.js

const ExpenseClaim = require('../models/Claim');
const User = require('../models/User');
const emailService = require('../services/emailService');
const fileService = require('../services/fileService');
const realtime = require('../services/realtime');

/**
 * @desc    Submit a new expense claim
 * @route   POST /api/faculty/claims
 * @access  Private (Faculty)
 */
exports.submitClaim = async (req, res) => {
    try {
        const facultyId = req.user.id;
        const { category, amount, description, dateIncurred, documents, status } = req.body;
        
        // Default status to 'submitted' unless 'draft' is explicitly requested
        const initialStatus = status === 'draft' ? 'draft' : 'submitted';

        const claim = await ExpenseClaim.create({
            facultyId,
            category,
            amount,
            description,
            dateIncurred,
            status: initialStatus,
            documents: documents || [],
            // Initial audit trail entry
            auditTrail: [{
                timestamp: new Date(),
                status: initialStatus,
                changedBy: 'Faculty',
                notes: initialStatus === 'draft' ? 'Draft created' : 'Claim submitted for processing.'
            }]
        });

        // Send Email: Submission Confirmation (Only if submitted, not draft)
        if (initialStatus === 'submitted') {
            const user = await User.findByPk(facultyId);
            if (user && user.email) {
                // We don't await this so the UI response isn't delayed
                emailService.sendSubmissionConfirmation({
                    email: user.email,
                    claimId: claim.id,
                    amount: claim.amount
                }).catch(err => console.error('Email sending failed:', err));
            }
        }

        res.status(201).json({
            success: true,
            data: claim,
            message: 'Expense claim submitted successfully.'
        });

    } catch (error) {
        console.error('Error submitting claim:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

/**
 * @desc    Get all claims submitted by the logged-in faculty member
 * @route   GET /api/faculty/claims
 * @access  Private (Faculty)
 */
exports.getFacultyClaims = async (req, res) => {
    try {
        // Find claims linked to the authenticated faculty member
        const claims = await ExpenseClaim.findAll({
            where: { facultyId: req.user.id },
            order: [['createdAt', 'DESC']] // Show newest claims first
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
 * @desc    Update claim status and send notification email
 * @route   PUT /api/finance/claims/:id/status
 * @access  Private (Finance/Admin)
 */
exports.updateClaimStatus = async (req, res) => {
    const { id } = req.params;
    let { status, notes } = req.body; 

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
        // This ensures frontend actions map to correct database statuses
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

        // Ensure auditTrail is an array before pushing
        let currentTrail = claim.auditTrail || [];
        if (typeof currentTrail === 'string') currentTrail = JSON.parse(currentTrail);

        claim.auditTrail = [...currentTrail, auditEntry];

        await claim.save();

        // 👇 SEND EMAIL: Status Change Notification
        if (faculty.email) {
            const emailOptions = {
                email: faculty.email,
                claimId: claim.id,
                status: status,
                notes: notes,
                // Pass specific params required by different templates
                approvalNotes: notes, 
                rejectionReason: notes,
                clarificationNotes: notes,
                amountPaid: claim.amount
            };

            let emailPromise;

            switch (status.toLowerCase()) {
                case 'pending_payment': // Mapped from 'approved'
                    emailPromise = emailService.sendApprovalEmail(emailOptions);
                    break;
                case 'rejected':
                    emailPromise = emailService.sendRejectionEmail(emailOptions);
                    break;
                case 'referred_back': // Mapped from 'more_info'
                    emailPromise = emailService.sendClarificationRequest(emailOptions);
                    break;
                case 'disbursed': // Mapped from 'paid'
                    emailPromise = emailService.sendPaymentEmail(emailOptions);
                    break;
                default:
                    emailPromise = emailService.sendStatusNotification(emailOptions);
                    break;
            }

            // Log if email fails, but don't crash the request
            if (emailPromise) {
                emailPromise.catch(err => console.error(`Failed to send ${status} email:`, err.message));
            }
        }

        // Emit realtime event to the faculty user
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
            message: `Claim status updated to ${status} and notification sent.`
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

    if (!email) {
        return res.status(400).json({ success: false, error: 'Email address required' });
    }

    try {
        let emailResult;

        if (status === 'clarification needed') {
            emailResult = await emailService.sendClarificationRequest({
                email,
                claimId: claimId || 'DEMO-001',
                clarificationNotes: notes || 'Please provide additional documentation.'
            });
        } else {
            emailResult = await emailService.sendStatusNotification({
                email,
                claimId: claimId || 'DEMO-001',
                status: status || 'approved',
                notes: notes || 'Your claim has been reviewed.'
            });
        }

        if (emailResult.success) {
            res.status(200).json({
                success: true,
                message: `Demo email sent successfully to ${email}`
            });
        } else {
            res.status(500).json({ success: false, error: 'Failed to send email' });
        }
    } catch (error) {
        console.error('Error sending demo email:', error);
        res.status(500).json({ success: false, error: 'Server Error', details: error.message });
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
        if (!claim) {
            return res.status(404).json({ success: false, error: 'Claim not found' });
        }

        if (claim.facultyId !== facultyId) {
            return res.status(403).json({ success: false, error: 'Unauthorized: You can only upload to your own claims' });
        }

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

        // Append to audit trail
        const newAuditTrail = [...(claim.auditTrail || []), {
            timestamp: new Date(),
            status: claim.status,
            changedBy: 'Faculty',
            notes: `Document uploaded: ${uploadResult.fileName}`
        }];

        claim.documents = documents;
        claim.auditTrail = newAuditTrail;

        await claim.save();

        res.status(200).json({
            success: true,
            data: {
                fileName: uploadResult.fileName,
                fileUrl: uploadResult.fileUrl,
                uploadedAt: uploadResult.uploadedAt,
                size: req.file.size
            },
            message: 'Document uploaded successfully'
        });

    } catch (error) {
        console.error('Error uploading document:', error);
        res.status(500).json({ success: false, error: 'Server Error', details: error.message });
    }
};

/**
 * @desc    List all documents for a claim
 * @route   GET /api/faculty/claims/:id/documents
 * @access  Private (Faculty)
 */
exports.getClaimDocuments = async (req, res) => {
    const facultyId = req.user.id;
    const { id: claimId } = req.params;

    try {
        const claim = await ExpenseClaim.findByPk(claimId);
        if (!claim) {
            return res.status(404).json({ success: false, error: 'Claim not found' });
        }

        if (claim.facultyId !== facultyId) {
            return res.status(403).json({ success: false, error: 'Unauthorized: You can only view your own claims' });
        }

        const documents = claim.documents || [];

        res.status(200).json({
            success: true,
            data: documents,
            count: documents.length,
            message: 'Documents retrieved successfully'
        });

    } catch (error) {
        console.error('Error retrieving documents:', error);
        res.status(500).json({ success: false, error: 'Server Error', details: error.message });
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
                attributes: ['name', 'email', 'id'] // 👈 This fetches the Name!
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