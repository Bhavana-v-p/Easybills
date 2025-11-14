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
    // Assuming req.user.id is available from authentication middleware
    const facultyId = req.user.id || 1; // Placeholder ID for example
    const { category, amount, description, dateIncurred, documents } = req.body;

    try {
        const claim = await ExpenseClaim.create({
            facultyId,
            category,
            amount,
            description,
            dateIncurred,
            documents: documents || [],
            // Initial audit trail entry
            auditTrail: [{
                timestamp: new Date(),
                status: 'submitted',
                changedBy: 'Faculty',
                notes: 'Claim submitted for processing.'
            }]
        });

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
    const facultyId = req.user.id || 1; // Placeholder ID for example

    try {
        // Find claims linked to the authenticated faculty member
        const claims = await ExpenseClaim.findAll({
            where: { facultyId },
            order: [['createdAt', 'DESC']] // Show newest claims first
        });

        // Provides visibility and real-time updates for faculty
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
    const { status, notes } = req.body;

    try {
        const claim = await ExpenseClaim.findByPk(id);
        if (!claim) {
            return res.status(404).json({ success: false, error: 'Claim not found' });
        }

        // Get faculty user to retrieve email
        const faculty = await User.findByPk(claim.facultyId);
        if (!faculty) {
            return res.status(404).json({ success: false, error: 'Faculty not found' });
        }

        // Update claim status
        claim.status = status;
        
        // Add audit trail entry
        const auditEntry = {
            timestamp: new Date(),
            status: status,
            changedBy: req.user.role || 'Finance',
            notes: notes || `Status changed to ${status}`
        };
        claim.auditTrail = claim.auditTrail || [];
        claim.auditTrail.push(auditEntry);

        await claim.save();

        // Send email notification
        if (faculty.email) {
            let emailResult;
            if (status === 'clarification needed') {
                emailResult = await emailService.sendClarificationRequest({
                    email: faculty.email,
                    claimId: id,
                    clarificationNotes: notes
                });
            } else {
                emailResult = await emailService.sendStatusNotification({
                    email: faculty.email,
                    claimId: id,
                    status: status,
                    notes: notes
                });
            }

            if (!emailResult.success) {
                console.warn(`Email notification failed but claim updated for claim #${id}`);
            }
        }

        // Emit realtime event to the faculty user
        try {
            const io = realtime.getIO();
            const payload = { claimId: claim.id, status: claim.status, auditEntry };
            io.to(`user_${claim.facultyId}`).emit('claimStatusUpdated', payload);
            io.emit('claimUpdated', { claimId: claim.id, status: claim.status });
        } catch (err) {
            // Realtime not initialized or emit failed - log and continue
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

    // Validate input
    if (!email) {
        return res.status(400).json({ success: false, error: 'Email address required' });
    }

    try {
        let emailResult;

        if (status === 'clarification needed') {
            emailResult = await emailService.sendClarificationRequest({
                email,
                claimId: claimId || 'DEMO-001',
                clarificationNotes: notes || 'Please provide additional documentation for your travel expenses.'
            });
        } else {
            emailResult = await emailService.sendStatusNotification({
                email,
                claimId: claimId || 'DEMO-001',
                status: status || 'approved',
                notes: notes || 'Your claim has been reviewed and processed.'
            });
        }

        if (emailResult.success) {
            res.status(200).json({
                success: true,
                message: `Demo email sent successfully to ${email}`,
                emailDetails: {
                    to: email,
                    status: status || 'approved',
                    claimId: claimId || 'DEMO-001'
                }
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to send email',
                details: emailResult.error
            });
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
    const facultyId = req.user.id || 1; // Placeholder ID for example
    const { id: claimId } = req.params;

    // Validate file exists
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file provided' });
    }

    try {
        // Verify that the claim belongs to the faculty member
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
        const documents = claim.documents || [];
        documents.push({
            fileName: uploadResult.fileName,
            fileUrl: uploadResult.fileUrl,
            storagePath: uploadResult.storagePath,
            uploadedAt: uploadResult.uploadedAt,
            size: req.file.size,
            mimeType: req.file.mimetype
        });

        // Update claim with new document and append audit trail entry
        await claim.update({
            documents: documents,
            auditTrail: [...(claim.auditTrail || []), {
                timestamp: new Date(),
                status: claim.status,
                changedBy: 'Faculty',
                notes: `Document uploaded: ${uploadResult.fileName}`
            }]
        });

        // Emit realtime event about new document
        try {
            const io = realtime.getIO();
            io.to(`user_${claim.facultyId}`).emit('documentUploaded', {
                claimId,
                fileName: uploadResult.fileName,
                fileUrl: uploadResult.fileUrl,
                uploadedAt: uploadResult.uploadedAt
            });
        } catch (err) {
            console.warn('Realtime emit failed (document):', err.message);
        }
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
    const facultyId = req.user.id || 1; // Placeholder ID for example
    const { id: claimId } = req.params;

    try {
        // Verify that the claim belongs to the faculty member
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
