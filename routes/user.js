// routes/user.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const multer = require('multer');
const { uploadFile } = require('../services/fileService');
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // Limit to 5MB
});
/**
 * @desc    Get current authenticated user
 * @route   GET /api/user/me
 * @access  Private
 */
router.get('/me', isAuthenticated, async (req, res) => {
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
router.post('/picture', isAuthenticated, upload.single('picture'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No image file provided' });
        }
 
        const userId = req.user.id;
        const file = req.file;
 
        // 1. Define a path for profile pictures in Firebase
        // We use the userID in the filename to overwrite previous pictures easily
        const destination = `profile_pictures/${userId}_${Date.now()}_${file.originalname}`;
 
        // 2. Upload to Firebase using existing service
        // Note: uploadFile expects { originalname, buffer, mimetype }
        const publicUrl = await uploadFile(file, destination);
 
        // 3. Update User record in Database
        const user = await User.findByPk(userId);
        if (!user) {
             return res.status(404).json({ success: false, error: 'User not found' });
        }
 
        user.picture = publicUrl;
        await user.save();
 
        res.json({
            success: true,
            message: 'Profile picture updated successfully',
            data: { pictureUrl: publicUrl }
        });
 
    } catch (error) {
        console.error('Profile picture upload error:', error);
        res.status(500).json({ success: false, error: 'Failed to update profile picture' });
    }
});
 
module.exports = router;
 
 
