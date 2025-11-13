// controllers/claimsController.js

const ExpenseClaim = require('../models/Claim');

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
