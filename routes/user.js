// routes/user.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');

/**
 * @desc    Get current authenticated user
 * @route   GET /api/user/me
 * @access  Private
 */
router.get('/me', async (req, res) => {
    try {
        // req.user is set by Passport session middleware
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, error: 'Not authenticated' });
        }

        // Optionally fetch fresh user data from database
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] } // Don't return password if any
        });

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

/**
 * @desc    Logout user
 * @route   GET /auth/logout
 * @access  Private
 */
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ success: false, error: 'Logout failed' });
        }
        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    });
});

module.exports = router;
