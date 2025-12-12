// controllers/claimsController.js
const ExpenseClaim = require('../models/Claim');
const User = require('../models/User');
const emailService = require('../services/emailService');
const fileService = require('../services/fileService');
const realtime = require('../services/realtime');

// ... (Keep existing submitClaim and getFacultyClaims as is) ...
exports.submitClaim = async (req, res) => {
    // ... (Keep your existing code for submitClaim here) ...
    // JUST ENSURE initialStatus defaults to 'submitted'
    // ...
    // START COPYING FROM HERE FOR THE UPDATE LOGIC
    try {
        const facultyId = req.user.id;
        const { category, amount, description, dateIncurred, documents, status } = req.body;
        const initialStatus = status === 'draft' ? 'draft' : 'submitted';

        const claim = await ExpenseClaim.create({
            facultyId, category, amount, description, dateIncurred,
            status: initialStatus, documents: documents || [],
            auditTrail: [{ timestamp: new Date(), status: initialStatus, changedBy: 'Faculty', notes: 'Claim created.' }]
        });

        if (initialStatus === 'submitted') {
            const user = await User.findByPk(facultyId);
            if (user && user.email) emailService.sendSubmissionConfirmation({ email: user.email, claimId: claim.id, amount: claim.amount });
        }
        res.status(201).json({ success: true, data: claim });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.getFacultyClaims = async (req, res) => {
    try {
        const claims = await ExpenseClaim.findAll({ where: { facultyId: req.user.id }, order: [['createdAt', 'DESC']] });
        res.json({ success: true, data: claims });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

/** * @desc Update Status (Approve/Reject/Refer/Pay)
 */
exports.updateClaimStatus = async (req, res) => {
    const { id } = req.params;
    let { status, notes } = req.body; // 'approved', 'rejected', 'more_info', 'paid'

    try {
        const claim = await ExpenseClaim.findByPk(id);
        if (!claim) return res.status(404).json({ success: false, error: 'Claim not found' });

        const faculty = await User.findByPk(claim.facultyId);

        // 🧠 LOGIC MAPPING FOR STATUS
        if (status === 'approved') status = 'pending_payment';
        if (status === 'more_info') status = 'referred_back';
        if (status === 'paid') status = 'disbursed';

        // Update DB
        claim.status = status;
        
        // Audit Trail
        let currentTrail = claim.auditTrail || [];
        if (typeof currentTrail === 'string') currentTrail = JSON.parse(currentTrail);
        
        claim.auditTrail = [...currentTrail, {
            timestamp: new Date(),
            status: status,
            changedBy: req.user.role || 'Accounts',
            notes: notes
        }];

        await claim.save();

        // 👇 SEND EMAIL
        if (faculty && faculty.email) {
            const emailOptions = {
                email: faculty.email,
                claimId: claim.id,
                status: status,
                notes: notes,
                clarificationNotes: notes,
                rejectionReason: notes,
                amountPaid: claim.amount
            };

            switch (status) {
                case 'pending_payment': 
                    await emailService.sendApprovalEmail(emailOptions); break;
                case 'rejected': 
                    await emailService.sendRejectionEmail(emailOptions); break;
                case 'referred_back': 
                    await emailService.sendClarificationRequest(emailOptions); break;
                case 'disbursed': 
                    await emailService.sendPaymentEmail(emailOptions); break;
            }
        }

        // Realtime
        try {
            const io = realtime.getIO();
            io.to(`user_${claim.facultyId}`).emit('claimUpdated', { claimId: claim.id, status });
        } catch (e) {}

        res.status(200).json({ success: true, data: claim });

    } catch (error) {
        console.error('Update Error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// ... (Keep uploadClaimDocument and getClaimDocuments as is) ...
exports.uploadClaimDocument = async (req, res) => { /* existing code */ };
exports.getClaimDocuments = async (req, res) => { /* existing code */ };
exports.sendDemoEmail = async (req, res) => { /* existing code */ };