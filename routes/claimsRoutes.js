const express = require('express');
const router = express.Router();
const { multerUpload, uploadToFirebase } = require('../middleware/uploadMiddleware');
const { submitClaim } = require('../controllers/claimsController');

// Assume 'protect' is an authentication middleware you have elsewhere.
// If you don't have it, you can remove it for now.
// const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/claims
// @desc    Create a new expense claim
// @access  Private (once 'protect' is added)
router.post('/', multerUpload, uploadToFirebase, submitClaim);
// router.post('/', protect, multerUpload, uploadToFirebase, submitClaim); // With auth

module.exports = router;
