// server.js (DIAGNOSTIC MODE)
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

app.set('trust proxy', 1);

// 1. GLOBAL LOGGER: This must run first!
app.use((req, res, next) => {
    console.log(`🔍 INCOMING: ${req.method} ${req.url}`);
    next();
});

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Database & Session
const sessionStore = new SequelizeStore({
    db: sequelize,
    tableName: 'Sessions',
    checkExpirationInterval: 15 * 60 * 1000, 
    expiration: 24 * 60 * 60 * 1000 
});

app.use(session({
    store: sessionStore,
    secret: 'temp_secret_key', // Hardcoded for testing
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
require('./config/passport'); 
app.use(passport.initialize());
app.use(passport.session());

// ==================================================================
// 👇 AUTH ROUTES (HARDCODED URLS) 👇
// ==================================================================

// We hardcode this to ensure there are absolutely no typos in Env Vars
const HARDCODED_CALLBACK = 'https://easybills-backend.onrender.com/auth/google/callback';

app.get('/auth/google', (req, res, next) => {
    console.log('🚀 LOGIN STARTING. Target Callback:', HARDCODED_CALLBACK);
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        prompt: 'select_account',
        callbackURL: HARDCODED_CALLBACK
    })(req, res, next);
});

app.get('/auth/google/callback', 
    (req, res, next) => {
        console.log('✅ CALLBACK HIT SUCCESSFULLY!');
        passport.authenticate('google', { 
            failureRedirect: '/',
            callbackURL: HARDCODED_CALLBACK 
        })(req, res, next);
    },
    (req, res) => {
        console.log('🎉 AUTH SUCCESS. Redirecting...');
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/dashboard`);
    }
);

app.get('/auth/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.session.destroy(() => res.json({ success: true }));
    });
});

// ==================================================================

app.use('/api', require('./routes/claims'));
app.use('/api/user', require('./routes/user'));
app.get('/', (req, res) => res.send('Backend Online'));

// 👇 THE "CATCH-ALL" DEBUGGER
// If the code reaches here, it means NO route matched.
app.use('*', (req, res) => {
    console.log(`❌ ROUTE MISSED: ${req.method} ${req.originalUrl}`);
    res.status(404).send(`DEBUG: Server received ${req.method} ${req.originalUrl} but found no route.`);
});

connectDB().then(() => {
    const http = require('http');
    const server = http.createServer(app);
    server.listen(PORT, () => {
        console.log(`EasyBills server running on port ${PORT}`);
    });
}).catch((err) => console.error(err));