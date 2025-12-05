// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const passport = require('passport');
const session = require('express-session');
// Using Sequelize Session Store
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const { connectDB, sequelize } = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Trust Proxy (REQUIRED for Render to handle HTTPS correctly)
app.set('trust proxy', 1);

// 2. CORS Configuration
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// 3. Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// 4. Session Setup (PostgreSQL Store)
const sessionStore = new SequelizeStore({
    db: sequelize,
    tableName: 'Sessions',
    checkExpirationInterval: 15 * 60 * 1000, 
    expiration: 24 * 60 * 60 * 1000 
});

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

app.use(sessionMiddleware);
sessionStore.sync(); // Create the sessions table

// 5. Passport Config
require('./config/passport'); 
app.use(passport.initialize());
app.use(passport.session());

// ==================================================================
// 👇 AUTH ROUTES (Hardcoded here to FIX the "Cannot GET" error) 👇
// ==================================================================

// Route 1: Start Login
app.get('/auth/google', (req, res, next) => {
    const callbackURL = process.env.GOOGLE_CALLBACK_URL;
    console.log('Starting login with callback:', callbackURL);
    
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        prompt: 'select_account',
        callbackURL: callbackURL
    })(req, res, next);
});

// Route 2: Google Callback
app.get('/auth/google/callback', 
    (req, res, next) => {
        const callbackURL = process.env.GOOGLE_CALLBACK_URL;
        passport.authenticate('google', { 
            failureRedirect: '/',
            callbackURL: callbackURL 
        })(req, res, next);
    },
    (req, res) => {
        // Successful authentication
        console.log('User logged in:', req.user.email);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        
        // Save session and redirect
        req.session.save((err) => {
            if (err) console.error('Session save error:', err);
            res.redirect(`${frontendUrl}/dashboard`);
        });
    }
);

// Route 3: Logout
app.get('/auth/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        req.session.destroy((err) => {
            res.clearCookie('connect.sid');
            res.status(200).json({ success: true, message: 'Logged out' });
        });
    });
});

// ==================================================================
// 👆 END AUTH ROUTES 👆
// ==================================================================

// Connect other routes
const claimsRoutes = require('./routes/claims');
const userRoutes = require('./routes/user');

app.use('/api', claimsRoutes); // Note: Removed 'auth' middleware here to test. Add it back later if needed.
app.use('/api/user', userRoutes);

// Health Check
app.get('/', (req, res) => {
    res.status(200).send('EasyBills Backend is Running!');
});

// Connect Database & Start Server
connectDB().then(() => {
    const http = require('http');
    // Remove realtime if it's causing issues, otherwise keep it
    // const realtime = require('./services/realtime'); 
    const server = http.createServer(app);
    
    // realtime.init(server, { cors: corsOptions, sessionMiddleware });

    server.listen(PORT, () => {
        console.log(`EasyBills server running on port ${PORT}`);
    });
}).catch((err) => {
    console.error('Failed to connect to database:', err);
});