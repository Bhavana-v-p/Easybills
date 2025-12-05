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

// 1. Trust Proxy (Crucial for Render)
app.set('trust proxy', 1);

// 2. Logging Middleware (See every request)
app.use((req, res, next) => {
    console.log(`👉 [REQUEST] ${req.method} ${req.url}`);
    next();
});

// 3. CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

// 4. Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Session Setup
const sessionStore = new SequelizeStore({
    db: sequelize,
    tableName: 'Sessions',
    checkExpirationInterval: 15 * 60 * 1000,
    expiration: 24 * 60 * 60 * 1000
});

app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'dev_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
}));

sessionStore.sync();

// 6. Passport
require('./config/passport');
app.use(passport.initialize());
app.use(passport.session());

// ==================================================================
// 👇 AUTH ROUTES (DEFINED FIRST) 👇
// ==================================================================

// Route 1: Start Login
app.get('/auth/google', (req, res, next) => {
    console.log('🚀 LOGIN INITIATED');
    const callbackURL = process.env.GOOGLE_CALLBACK_URL;
    console.log('🔍 DEBUG: callbackURL is:', callbackURL ? `'${callbackURL}'` : 'UNDEFINED');
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        prompt: 'select_account',
        callbackURL: callbackURL
    })(req, res, next);
});

// Route 2: Google Callback (Explicit handling)
app.get('/auth/google/callback', 
    (req, res, next) => {
        console.log('🔄 GOOGLE CALLBACK RECEIVED');
        const callbackURL = process.env.GOOGLE_CALLBACK_URL;
        passport.authenticate('google', { 
            failureRedirect: '/',
            callbackURL: callbackURL 
        })(req, res, next);
    },
    (req, res) => {
        console.log('✅ AUTH SUCCESS:', req.user.email);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        
        req.session.save((err) => {
            if (err) console.error('Session save error:', err);
            res.redirect(`${frontendUrl}/dashboard`);
        });
    }
);

// Route 3: Logout
app.get('/auth/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.session.destroy((err) => {
            res.clearCookie('connect.sid');
            res.status(200).json({ success: true, message: 'Logged out' });
        });
    });
});

// ==================================================================

// API Routes
app.use('/api', require('./routes/claims'));
app.use('/api/user', require('./routes/user'));

// Health Check
app.get('/', (req, res) => res.send('Backend is Running'));

// Print all registered routes to console (Debugging)
function printRoutes() {
    console.log('\n--- REGISTERED ROUTES ---');
    app._router.stack.forEach((r) => {
        if (r.route && r.route.path) {
            console.log(`${Object.keys(r.route.methods).join(', ').toUpperCase()} ${r.route.path}`);
        }
    });
    console.log('-------------------------\n');
}

// Start Server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`EasyBills server running on port ${PORT}`);
        printRoutes(); // 👈 Check your Render logs for this list!
    });
}).catch((err) => {
    console.error('Failed to connect to database:', err);
});