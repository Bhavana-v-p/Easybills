// services/fileService.js
 
const { storage } = require('../config/firebase');
const path = require('path');
const crypto = require('crypto');
 
/**
* Upload a file to Firebase Cloud Storage
* @param {Object} file - File object from multer (buffer, originalname, mimetype)
* @param {string} claimId - Claim ID for organizing files
* @returns {Promise<Object>} - { fileName, fileUrl, success }
*/
exports.uploadFile = async (file, claimId) => {
  try {
    if (!file) {
      return { success: false, error: 'No file provided' };
    }
 
    // Explicitly use the bucket from the environment config to be safe
    const bucket = storage.bucket(process.env.FIREBASE_STORAGE_BUCKET);
    // Generate unique filename: claims/{claimId}/{timestamp}-{randomId}-{originalName}
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(4).toString('hex');
    const ext = path.extname(file.originalname);
    // Sanitize filename to remove spaces/special chars
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    const uniqueFileName = `${timestamp}-${randomId}-${baseName}${ext}`;
    const filePath = `claims/${claimId}/${uniqueFileName}`;
 
    // Upload file
    const fileRef = bucket.file(filePath);
    await fileRef.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
        // Optional: Add custom metadata
        metadata: {
          originalName: file.originalname,
          claimId: String(claimId)
        }
      }
    });
 
    // Generate signed URL (valid for 1 year)
    // Note: To make files truly public, you would use fileRef.makePublic() instead
    const [url] = await fileRef.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 365 * 24 * 60 * 60 * 1000 // 1 year
    });
 
    console.log(`File uploaded to Firebase: ${filePath}`);
 
    return {
      success: true,
      fileName: file.originalname,
      fileUrl: url,
      storagePath: filePath,
      uploadedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('File upload error:', error);
    return { success: false, error: error.message };
  }
};
 
/**
* Delete a file from Firebase Cloud Storage
* @param {string} storagePath - Path to the file in storage
* @returns {Promise<Object>} - { success, message }
*/
exports.deleteFile = async (storagePath) => {
  try {
    const bucket = storage.bucket(process.env.FIREBASE_STORAGE_BUCKET);
    await bucket.file(storagePath).delete();
 
    console.log(`File deleted from Firebase: ${storagePath}`);
    return { success: true, message: 'File deleted successfully' };
  } catch (error) {
    console.error('File deletion error:', error);
    return { success: false, error: error.message };
  }
};
 
/**
* List all files for a specific claim
* @param {string} claimId - Claim ID
* @returns {Promise<Array>} - Array of file objects
*/
exports.listClaimFiles = async (claimId) => {
  try {
    const bucket = storage.bucket(process.env.FIREBASE_STORAGE_BUCKET);
    const [files] = await bucket.getFiles({
      prefix: `claims/${claimId}/`
    });
 
    return files.map(file => ({
      name: file.name,
      size: file.metadata.size,
      created: file.metadata.timeCreated,
      // You can generate a fresh signed URL here if needed
    }));
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
};