// routes/claims.js

const express = require('express');
const router = express.Router();
const { submitClaim, getFacultyClaims, updateClaimStatus, sendDemoEmail } = require('../controllers/claimsController');

// Faculty routes
/**
 * POST /api/faculty/claims
 * Submit a new expense claim
 */
router.post('/faculty/claims', submitClaim);

/**
 * GET /api/faculty/claims
 * Get all claims submitted by the logged-in faculty member
 */
router.get('/faculty/claims', getFacultyClaims);

/**
 * PUT /api/finance/claims/:id/status
 * Update claim status and send notification email
 */
router.put('/finance/claims/:id/status', updateClaimStatus);

/**
 * POST /api/demo/send-email
 * Send a demo email to test notifications (development only)
 */
router.post('/demo/send-email', sendDemoEmail);

module.exports = router;
