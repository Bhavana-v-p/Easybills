// config/session.js
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const { sequelize } = require('./db'); // Import your existing DB connection
const dotenv = require('dotenv');

dotenv.config();

// 1. Initialize the Session Store using Sequelize (Postgres)
const sessionStore = new SequelizeStore({
    db: sequelize,
    tableName: 'Sessions', // Optional: Table name in DB
    checkExpirationInterval: 15 * 60 * 1000, // Clean up expired sessions every 15 mins
    expiration: 24 * 60 * 60 * 1000 // Sessions last 1 Day
});

// Create the table automatically if it doesn't exist
sessionStore.sync();

// 2. Configure Session Middleware
const sessionMiddleware = session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'dev_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', 
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 1 Day
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
});

module.exports = { sessionMiddleware };