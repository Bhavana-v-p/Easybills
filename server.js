// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const passport = require('passport');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const { connectDB, sequelize } = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Trust Proxy (REQUIRED for Render HTTPS)
app.set('trust proxy', 1);

// 2. Request Logger (DEBUGGING)
// This will show us exactly what URL Render is receiving
app.use((req, res, next) => {
    console.log(`👉 Incoming Request: ${req.method} ${req.url}`);
    next();
});

// 3. CORS Configuration
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// 4. Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// 5. Session Setup
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
sessionStore.sync(); 

// 6. Passport
require('./config/passport'); 
app.use(passport.initialize());
app.use(passport.session());

// ==================================================================
// 👇 HARDCODED AUTH ROUTES 👇
// ==================================================================

// Login Route
app.get(['/api/auth/google/callback', '/auth/google/callback/'], (req, res) => {
    res.redirect('/auth/google/callback');
});
app.get('/auth/google', (req, res, next) => {
    console.log('🚀 Starting Google Login...');
    const callbackURL = process.env.GOOGLE_CALLBACK_URL;
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        prompt: 'select_account',
        callbackURL: callbackURL
    })(req, res, next);
});


// Callback Route
app.get('/auth/google/callback', 
    (req, res, next) => {
        console.log('✅ Google returned to callback route!');
        const callbackURL = process.env.GOOGLE_CALLBACK_URL;
        passport.authenticate('google', { 
            failureRedirect: '/',
            callbackURL: callbackURL 
        })(req, res, next);
    },
    (req, res) => {
        console.log('🎉 Authentication successful! Redirecting...');
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        req.session.save(() => {
            res.redirect(`${frontendUrl}/dashboard`);
        });
    }
);

// Logout Route
app.get('/auth/logout', (req, res, next) => {
    console.log('👋 Logging out...');
    req.logout((err) => {
        if (err) { return next(err); }
        req.session.destroy(() => {
            res.clearCookie('connect.sid');
            res.status(200).json({ success: true, message: 'Logged out' });
        });
    });
});

// ==================================================================

// API Routes
const claimsRoutes = require('./routes/claims');
const userRoutes = require('./routes/user');
app.use('/api', claimsRoutes);
app.use('/api/user', userRoutes);

// Health Check
app.get('/', (req, res) => {
    res.status(200).send('EasyBills Backend is Running!');
});

// Start Server
connectDB().then(() => {
    const http = require('http');
    const server = http.createServer(app);
    server.listen(PORT, () => {
        console.log(`EasyBills server running on port ${PORT}`);
    });
}).catch((err) => {
    console.error('Failed to connect to database:', err);
});