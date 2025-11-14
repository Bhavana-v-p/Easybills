// config/mailer.js

const nodemailer = require('nodemailer');

// Create transporter based on env config
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail', // or sendgrid, aws-ses, etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Verify connection at startup
transporter.verify((error, success) => {
  if (error) {
    console.error('Email transporter error:', error);
  } else {
    console.log('Email service ready:', success);
  }
});

module.exports = transporter;
