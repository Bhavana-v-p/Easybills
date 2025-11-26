// config/session.js
const session = require('express-session');
const dotenv = require('dotenv');

dotenv.config();

// Create the session configuration object
const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'dev_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
});

module.exports = { sessionMiddleware };