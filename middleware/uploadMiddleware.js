// middleware/uploadMiddleware.js

const multer = require('multer');
const { storage } = require('../config/firebaseAdmin');
const path = require('path');

// Configure Multer to temporarily store files in memory
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Custom middleware to handle the actual upload to Firebase Storage
exports.uploadToFirebase = (req, res, next) => {
    // Check if a file was uploaded
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No receipt file provided.' });
    }

    const bucket = storage.bucket(process.env.FIREBASE_STORAGE_BUCKET);
    const fileName = `${Date.now()}_${path.basename(req.file.originalname)}`;
    const fileRef = bucket.file(`receipts/${req.user.id}/${fileName}`);
    
    // Create a write stream
    const fileStream = fileRef.createWriteStream({
        metadata: {
            contentType: req.file.mimetype,
        }
    });

    fileStream.on('error', (err) => {
        console.error('Firebase upload error:', err);
        return res.status(500).json({ success: false, message: 'Failed to upload document to storage.' });
    });

    fileStream.on('finish', async () => {
        try {
            // Make the file publicly accessible and get the URL
            await fileRef.makePublic();
            const publicUrl = `https://storage.googleapis.com/${process.env.FIREBASE_STORAGE_BUCKET}/receipts/${req.user.id}/${fileName}`;
            
            // Attach the document data to the request body for the controller
            req.documentData = {
                fileName: req.file.originalname,
                fileUrl: publicUrl
            };
            next(); // Move to the claim submission controller
            
        } catch (urlError) {
            console.error('Error getting public URL:', urlError);
            res.status(500).json({ success: false, message: 'Failed to finalize document link.' });
        }
    });

    // End the stream with the file buffer
    fileStream.end(req.file.buffer);
};

// Export multer's single file handler
exports.multerUpload = upload.single('receiptFile');
