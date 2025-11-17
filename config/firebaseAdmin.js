// config/firebaseAdmin.js

const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');
const dotenv = require('dotenv');

dotenv.config();

// Load the downloaded service account key
const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // Use the Storage Bucket name from your .env file
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

// Initialize Google Cloud Storage (needed for advanced file operations)
const storage = new Storage({
    projectId: serviceAccount.project_id,
    credentials: {
        client_email: serviceAccount.client_email,
        private_key: serviceAccount.private_key.replace(/\\n/g, '\n') // Handle escaped newlines
    }
});

module.exports = { admin, storage };
