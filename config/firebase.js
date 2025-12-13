// config/firebase.js
const admin = require('firebase-admin');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

try {
  // -----------------------------------------------------------------------
  // ⚠️ CRITICAL CHANGE: Construct credential object from Environment Variables
  // This bypasses the need for a physical 'firebase-key.json' file
  // -----------------------------------------------------------------------
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    
    // THE FIX: Properly format the private key (handles \n characters)
    private_key: process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined,
      
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
  };

  // Initialize the Firebase Admin SDK
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET 
    });
  }

  console.log(`Firebase Admin initialized for bucket: ${process.env.FIREBASE_STORAGE_BUCKET}`);

} catch (error) {
  console.error("Error initializing Firebase Admin. Check your .env variables.", error);
}

const storage = admin.storage();
const db = admin.firestore();

module.exports = { storage, db };