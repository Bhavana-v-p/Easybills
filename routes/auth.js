// routes/auth.js
const express = require('express');
const passport = require('passport');
const router = express.Router();

// 1. Trigger Google Login
// Matches: http://localhost:3000/auth/google
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
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
        res.redirect('/login.html');
    });
});

module.exports = router;