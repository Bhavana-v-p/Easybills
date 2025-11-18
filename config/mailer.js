// config/mailer.js

const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

// Create the Nodemailer transporter (Connection details to Gmail)
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE, 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD // Google App Password
    },
    // Enforce SSL security for production readiness
    secure: true, 
    tls: {
        // Required for some hosting environments
        rejectUnauthorized: false
    }
});

module.exports = transporter;
