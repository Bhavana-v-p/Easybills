// routes/auth.js
const express = require('express');
const passport = require('passport');
const router = express.Router();

// 1. Trigger Google Login
// Matches: http://localhost:3000/auth/google
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'login' // Forces a full password re-entry
}));

// 2. Google Callback
// Matches: http://localhost:3000/auth/google/callback
router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login.html' }),
    (req, res) => {
        // Successful authentication
        console.log('User logged in:', req.user.email);
        
        // Redirect to your frontend dashboard (or demo page)
        // Since you are using Vue locally on port 5173, redirect there:
        res.redirect('http://localhost:5173/dashboard'); 
        
        // OR if testing with the static index.html you uploaded:
        // res.redirect('/index.html');
    }
);

// 3. Logout Route
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        
        // Destroy the session
        req.session.destroy((err) => {
            if (err) console.log('Session destruction error:', err);
            
            // Clear the cookie
            res.clearCookie('connect.sid');
            
            // Send JSON success so frontend can handle the redirect
            res.status(200).json({ success: true, message: 'Logged out successfully' });
        });
    });
});

module.exports = router;