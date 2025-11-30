// config/firebase.js
const admin = require('firebase-admin');
const path = require('path');
const dotenv = require('dotenv');
 
// Load environment variables
dotenv.config();
 
// Resolve the path to your service account key file
// (Ensure firebase-key.json is in your backend root folder)
const serviceAccountPath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 'firebase-key.json');
 
try {
  const serviceAccount = require(serviceAccountPath);
 
  // Initialize the Firebase Admin SDK
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // This pulls the correct bucket URL from your .env file
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET 
    });
  }
 
  console.log(`Firebase Admin initialized for bucket: ${process.env.FIREBASE_STORAGE_BUCKET}`);
 
} catch (error) {
  console.error("Error initializing Firebase Admin. Check if 'firebase-key.json' exists and path is correct.", error);
}
 
const storage = admin.storage();
const db = admin.firestore();
 
module.exports = { storage, db };