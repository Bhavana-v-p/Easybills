// middleware/upload.js

const multer = require('multer');
const path = require('path');

// Configure multer for in-memory storage (files stored in memory, then uploaded to Firebase)
const storage = multer.memoryStorage();

// File filter: only allow common document types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  const maxFileSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Invalid file type. Allowed: PDF, images, Word, Excel'));
  }

  if (file.size > maxFileSize) {
    return cb(new Error('File size exceeds 10MB limit'));
  }

  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

module.exports = upload;
