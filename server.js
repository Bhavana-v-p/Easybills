// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const passport = require('passport');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const { connectDB, sequelize } = require('./config/db');

// 👇 Import User model directly
const User = require('./models/User'); 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ==================================================================
// 🔐 SECURITY & CONNECTION SETTINGS (The Fix)
// ==================================================================

// 1. Trust Proxy (Crucial for Render to allow secure cookies)
app.set('trust proxy', 1);

// 2. CORS: Explicitly allow your Vercel App
const corsOptions = {
    origin: 'https://easybills-amber.vercel.app', // 👈 Hardcoded Vercel URL
    credentials: true, // Allow cookies to be sent
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// 3. Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// 4. Session Setup: Force "Cross-Site" Cookies
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
        secure: true,        // 👈 REQUIRED: Cookie only travels over HTTPS
        httpOnly: true,      // Prevents JavaScript access (Security)
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'none'     // 👈 REQUIRED: Allows cookie to cross from Vercel to Render
    }
}));

sessionStore.sync(); 
require('./config/passport'); 
app.use(passport.initialize());
app.use(passport.session());

// ==================================================================
// 👇 AUTH ROUTES 👇
// ==================================================================

// 1. Start Login
app.get('/auth/google', (req, res, next) => {
    const callbackURL = process.env.GOOGLE_CALLBACK_URL;
    console.log('🚀 LOGIN START. Callback:', callbackURL);
    
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        prompt: 'select_account',
        callbackURL: callbackURL
    })(req, res, next);
});

// 2. Callback Route
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
        // 👇 Hardcoded Frontend Redirect to ensure it goes to the right place
        const frontendUrl = 'https://easybills-amber.vercel.app'; 
        
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

// 404 Catcher
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