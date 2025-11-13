// routes/claims.js

const express = require('express');
const router = express.Router();
const { submitClaim, getFacultyClaims } = require('../controllers/claimsController');

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

module.exports = router;
