const express = require('express');
const router = express.Router();
const User = require('../models/User');
// Ensure this path matches where your auth middleware is located
const { isAuthenticated } = require('../middleware/auth'); 
const multer = require('multer');
const { uploadFile } = require('../services/fileService');

// Multer setup for temporary memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // Limit to 5MB
});

// ==================================================================
// 1. GET CURRENT USER (Loads Name, Role, Picture on Login)
// ==================================================================
router.get('/me', isAuthenticated, async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, error: 'Not authenticated' });
        }

        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] } 
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

// ==================================================================
// 2. UPDATE USER NAME (Fixes the "Failed to Update Name" error)
// ==================================================================
router.put('/me', isAuthenticated, async (req, res) => {
    try {
        const { name } = req.body;

        // Validation
        if (!name || name.trim() === '') {
            return res.status(400).json({ success: false, error: 'Name cannot be empty' });
        }

        const user = await User.findByPk(req.user.id);
        
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Update name in database
        user.name = name;
        await user.save();

        res.json({
            success: true,
            message: 'Name updated successfully',
            data: user
        });

    } catch (error) {
        console.error('Error updating name:', error);
        res.status(500).json({ success: false, error: 'Failed to update name' });
    }
});

// ==================================================================
// 3. UPLOAD PROFILE PICTURE (Persists using Firebase URL)
// ==================================================================
router.post('/picture', isAuthenticated, upload.single('picture'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No image file provided' });
        }

        const userId = req.user.id;
        const file = req.file;

        // Create a unique filename to prevent browser caching issues
        const destination = `profile_pictures/${userId}_${Date.now()}_${file.originalname}`;

        // Upload to Firebase
        const publicUrl = await uploadFile(file, destination);

        // Update Database with the Firebase URL
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

// ==================================================================
// 4. REMOVE PROFILE PICTURE (Revert to Initials/Avatar)
// ==================================================================
router.delete('/picture', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Setting picture to NULL triggers the frontend to show Initials
        user.picture = null;
        await user.save();

        res.json({
            success: true,
            message: 'Profile picture removed',
            data: { picture: null }
        });

    } catch (error) {
        console.error('Error removing picture:', error);
        res.status(500).json({ success: false, error: 'Failed to remove picture' });
    }
});

module.exports = router;