// config/firebase.js

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK using service account key
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-key.json';

try {
  admin.initializeApp({
    credential: admin.credential.cert(require(path.resolve(serviceAccountPath))),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });

  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error.message);
  console.error('Ensure FIREBASE_SERVICE_ACCOUNT_PATH and FIREBASE_STORAGE_BUCKET are set in .env');
}

const storage = admin.storage();

module.exports = { admin, storage };
