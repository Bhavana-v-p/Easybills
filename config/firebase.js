
// This should be initialized once and exported.
const { initializeApp, getApps, getApp } = require('firebase/app');
const { getStorage } = require('firebase/storage');
const { getFirestore } = require('firebase/firestore');

// Your web app's Firebase configuration - this is safe to be public
const firebaseConfig = {
  "projectId": "studio-7006842896-ae86d",
  "appId": "1:566808534128:web:0fe09aad7ef1a48110a8b5",
  "storageBucket": "studio-7006d.appspot.com",
  "apiKey": "AIzaSyBQMaQVjiGctIU4bEaudQIz8t-_Mg-P18Q",
  "authDomain": "studio-7006842896-ae86d.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "566808534128"
};

let firebaseApp;

if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
} else {
    firebaseApp = getApp();
}

const storage = getStorage(firebaseApp);
const db = getFirestore(firebaseApp);

module.exports = { storage, db };
