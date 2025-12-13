// routes/claims.js

const express = require('express');
const router = express.Router();
const multer = require('multer'); 

// Configure Multer
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } 
});

// Import Middleware
const { isAuthenticated } = require('../middleware/auth'); 

// Import Controllers
// 🟢 FIX: Added 'resubmitClaim' to this list
const { 
    submitClaim, 
    getFacultyClaims, 
    updateClaimStatus, 
    sendDemoEmail, 
    uploadClaimDocument, 
    getClaimDocuments,
    getAllClaims,
    resubmitClaim 
} = require('../controllers/claimsController');

// ==========================================
// 1. FACULTY ROUTES
// ==========================================

/**
 * POST /api/faculty/claims
 * Submit a new expense claim
 */
router.post('/faculty/claims', isAuthenticated, upload.single('receipt'), submitClaim);

/**
 * GET /api/faculty/claims
 * Get all claims submitted by the logged-in faculty member
 */
router.get('/faculty/claims', isAuthenticated, getFacultyClaims);

/**
 * GET /api/claims/my-claims
 * Alias route redirects to getFacultyClaims
 */
router.get('/claims/my-claims', isAuthenticated, getFacultyClaims);

/**
 * POST /api/faculty/claims/:id/documents
 * Upload a document/receipt to a claim (Standalone)
 */
router.post('/faculty/claims/:id/documents', isAuthenticated, upload.single('receipt'), uploadClaimDocument);

/**
 * GET /api/faculty/claims/:id/documents
 * List all documents for a claim
 */
router.get('/faculty/claims/:id/documents', isAuthenticated, getClaimDocuments);

/**
 * PUT /api/faculty/claims/:id
 * Edit & Resubmit a Referred Back Claim
 * 🟢 FIX: Uses 'resubmitClaim' directly (removed 'claimsController.' prefix)
 */
router.put('/faculty/claims/:id', isAuthenticated, upload.single('receipt'), resubmitClaim);


// ==========================================
// 2. FINANCE / ADMIN ROUTES
// ==========================================

/**
 * PUT /api/finance/claims/:id/status
 * Update claim status and send notification email
 */
router.put('/finance/claims/:id/status', isAuthenticated, updateClaimStatus);

/**
 * GET /api/finance/claims
 * Get ALL claims for Accounts Dashboard
 */
router.get('/finance/claims', isAuthenticated, getAllClaims);


// ==========================================
// 3. UTILITY ROUTES
// ==========================================

/**
 * POST /api/demo/send-email
 * Send a demo email to test notifications (development only)
 */
router.post('/demo/send-email', sendDemoEmail);

module.exports = router;