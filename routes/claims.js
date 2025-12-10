// routes/claims.js

const express = require('express');
const router = express.Router();
const { 
    submitClaim, 
    getFacultyClaims, 
    updateClaimStatus, 
    sendDemoEmail, 
    uploadClaimDocument, 
    getClaimDocuments 
} = require('../controllers/claimsController');
const upload = require('../middleware/upload');

// ==========================================
// 1. FACULTY ROUTES
// ==========================================

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
 * 👇 NEW ALIAS ROUTE (Fixes 404 Error) 👇
 * GET /api/claims/my-claims
 * Simply redirects to the same controller as above
 */
router.get('/claims/my-claims', getFacultyClaims);

/**
 * POST /api/faculty/claims/:id/documents
 * Upload a document/receipt to a claim
 */
router.post('/faculty/claims/:id/documents', upload.single('document'), uploadClaimDocument);

/**
 * GET /api/faculty/claims/:id/documents
 * List all documents for a claim
 */
router.get('/faculty/claims/:id/documents', getClaimDocuments);


// ==========================================
// 2. FINANCE / ADMIN ROUTES
// ==========================================

/**
 * PUT /api/finance/claims/:id/status
 * Update claim status and send notification email
 */
router.put('/finance/claims/:id/status', updateClaimStatus);


// ==========================================
// 3. UTILITY ROUTES
// ==========================================

/**
 * POST /api/demo/send-email
 * Send a demo email to test notifications (development only)
 */
router.post('/demo/send-email', sendDemoEmail);

module.exports = router;