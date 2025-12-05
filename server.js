// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const passport = require('passport');
const session = require('express-session');
// Use Sequelize Session Store
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const { connectDB, sequelize } = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Trust Proxy
app.set('trust proxy', 1);

// 2. Request Logger (Shows what URL is hitting the server)
app.use((req, res, next) => {
    console.log(`👉 [REQUEST] ${req.method} ${req.url}`);
    next();
});

// 3. CORS
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
// 👇 AUTH ROUTES (Defined explicitly) 👇
// ==================================================================

// Route: Start Login
app.get('/auth/google', (req, res, next) => {
    console.log('🚀 LOGIN INITIATED');
    const callbackURL = process.env.GOOGLE_CALLBACK_URL;
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        prompt: 'select_account',
        callbackURL: callbackURL
    })(req, res, next);
});

// Route: Callback
// Accepts both /callback and /callback/
// Find the callback route and CHANGE the path
app.get('/oauth/callback',  // 👈 CHANGED FROM /auth/google/callback
    (req, res, next) => {
        console.log('🔄 NEW CALLBACK HIT');
        const callbackURL = process.env.GOOGLE_CALLBACK_URL;
        passport.authenticate('google', { 
            failureRedirect: '/',
            callbackURL: callbackURL 
        })(req, res, next);
    },
    (req, res) => {
        console.log('✅ AUTH SUCCESS');
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        req.session.save((err) => {
            res.redirect(`${frontendUrl}/dashboard`);
        });
    }
);

// Route: Logout
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

// API Routes
const claimsRoutes = require('./routes/claims');
const userRoutes = require('./routes/user');

app.use('/api', claimsRoutes);
app.use('/api/user', userRoutes);

// Health Check
app.get('/', (req, res) => {
    res.status(200).send('EasyBills Backend is Running!');
});

// DEBUG: Print all registered routes
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
    const http = require('http');
    const server = http.createServer(app);
    
    server.listen(PORT, () => {
        console.log(`EasyBills server running on port ${PORT}`);
        printRoutes(); // 👈 CHECK THIS IN RENDER LOGS
    });
}).catch((err) => {
    console.error('Failed to connect to database:', err);
});