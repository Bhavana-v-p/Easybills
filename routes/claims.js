// routes/claims.js

const express = require('express');
const router = express.Router();

// 1. IMPORT MIDDLEWARE
const upload = require('../middleware/upload');
// Ensure this path matches your project structure (usually ../middleware/auth)
const { isAuthenticated } = require('../middleware/auth'); 

// 2. IMPORT CONTROLLERS
const { 
    submitClaim, 
    getFacultyClaims, 
    updateClaimStatus, 
    sendDemoEmail, 
    uploadClaimDocument, 
    getClaimDocuments,
    getAllClaims // 👈 Added this to the main import list
} = require('../controllers/claimsController');

// ==========================================
// 1. FACULTY ROUTES
// ==========================================

/**
 * POST /api/faculty/claims
 * Submit a new expense claim
 */
router.post('/faculty/claims', isAuthenticated, submitClaim);

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
 * Upload a document/receipt to a claim
 */
router.post('/faculty/claims/:id/documents', isAuthenticated, upload.single('document'), uploadClaimDocument);

/**
 * GET /api/faculty/claims/:id/documents
 * List all documents for a claim
 */
router.get('/faculty/claims/:id/documents', isAuthenticated, getClaimDocuments);


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
 * Get ALL claims for Accounts Dashboard (Includes User Names)
 * This is the new route for the Admin Dashboard
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