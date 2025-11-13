// routes/auth.js

const express = require('express');
const router = express.Router();
const passport = require('passport');

// Start Google OAuth flow
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Callback URL
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/auth/failure' }), (req, res) => {
  // Successful authentication - redirect or return JSON
  res.redirect('/');
});

router.get('/failure', (req, res) => {
  res.status(401).json({ success: false, message: 'Authentication failed' });
});

// Logout
router.get('/logout', (req, res) => {
  req.logout(() => {
    res.json({ success: true, message: 'Logged out' });
  });
});

module.exports = router;
