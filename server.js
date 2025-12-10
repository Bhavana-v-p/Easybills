// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const passport = require('passport');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const { connectDB, sequelize } = require('./config/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Trust Proxy (REQUIRED for Render to allow secure cookies)
app.set('trust proxy', 1);

// 2. CORS - HARDCODED FIX
// We manually type the URL to ensure no Environment Variable mistakes
const corsOptions = {
    origin: 'https://easybills-amber.vercel.app', // 👈 Hardcoded URL
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
// 5. Session Setup - HARDCODED SECURITY
const sessionStore = new SequelizeStore({
    db: sequelize,
    tableName: 'Sessions',
    checkExpirationInterval: 15 * 60 * 1000, 
    expiration: 24 * 60 * 60 * 1000 
});

app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'super_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true, // 👈 FORCE SECURE (Required for Vercel->Render)
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'none' // 👈 FORCE NONE (Required for Cross-Site cookies)
    }
}));

sessionStore.sync(); 
require('./config/passport'); 
app.use(passport.initialize());
app.use(passport.session());

// ==================================================================
// 👇 AUTH ROUTES (USING CORRECT DOMAIN) 👇
// ==================================================================

// 1. Start Login
app.get('/auth/google', (req, res, next) => {
    // This MUST match the authorized URI in Google Console
    // Based on your settings: https://easybills.onrender.com/auth/google/callback
    const callbackURL = process.env.GOOGLE_CALLBACK_URL;
    
    console.log('🚀 LOGIN START. Callback:', callbackURL);
    
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        prompt: 'select_account',
        callbackURL: callbackURL
    })(req, res, next);
});

// 2. Callback Route
// We listen for the standard path.
app.get('/auth/google/callback', 
    (req, res, next) => {
        console.log('✅ CALLBACK HIT at /auth/google/callback');
        const callbackURL = process.env.GOOGLE_CALLBACK_URL;
        
        passport.authenticate('google', { 
            failureRedirect: '/',
            callbackURL: callbackURL 
        })(req, res, next);
    },
    (req, res) => {
        console.log('🎉 AUTH SUCCESS');
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        
        req.session.save((err) => {
            if (err) console.error('Session Save Error:', err);
            res.redirect(`${frontendUrl}/dashboard`);
        });
    }
);

// 3. Logout
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

app.use('/api', require('./routes/claims'));
app.use('/api/user', require('./routes/user'));

app.get('/', (req, res) => {
    res.status(200).send('EasyBills Backend is Running!');
});

// 404 Catcher (Debug)
app.use('*', (req, res) => {
    console.log(`❌ 404 MISS: ${req.method} ${req.originalUrl}`);
    res.status(404).send(`Cannot GET ${req.originalUrl}`);
});

connectDB().then(() => {
    const http = require('http');
    const server = http.createServer(app);
    server.listen(PORT, () => {
        console.log(`EasyBills server running on port ${PORT}`);
    });
}).catch((err) => {
    console.error('Failed to connect to database:', err);
});