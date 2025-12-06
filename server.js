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

// Logger
app.use((req, res, next) => {
    console.log(`👉 [REQUEST] ${req.method} ${req.url}`);
    next();
});

const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

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
});

sessionStore.sync(); 
require('./config/passport'); 
app.use(passport.initialize());
app.use(passport.session());

// ==================================================================
// 👇 AUTH ROUTES (UPDATED TO MATCH /oauth/callback) 👇
// ==================================================================

// 1. Start Login
app.get('/auth/google', (req, res, next) => {
    const callbackURL = process.env.GOOGLE_CALLBACK_URL;
    console.log('🚀 LOGIN START. Using Callback:', callbackURL);
    
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        prompt: 'select_account',
        callbackURL: callbackURL
    })(req, res, next);
});

// 2. Callback Route (MATCHING YOUR ENV VARIABLE)
app.get('/oauth/callback', 
    (req, res, next) => {
        console.log('✅ CALLBACK HIT at /oauth/callback');
        const callbackURL = process.env.GOOGLE_CALLBACK_URL;
        passport.authenticate('google', { 
            failureRedirect: '/',
            callbackURL: callbackURL 
        })(req, res, next);
    },
    (req, res) => {
        console.log('🎉 AUTH SUCCESS');
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        req.session.save(() => res.redirect(`${frontendUrl}/dashboard`));
    }
);

// 3. Logout
app.get('/auth/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.session.destroy(() => {
            res.clearCookie('connect.sid');
            res.status(200).json({ success: true, message: 'Logged out' });
        });
    });
});

// ==================================================================

app.use('/api', require('./routes/claims'));
app.use('/api/user', require('./routes/user'));

app.get('/', (req, res) => res.send('Backend Running'));

// DEBUG: Verify routes on startup
function printRoutes() {
    console.log('\n--- REGISTERED ROUTES ---');
    app._router.stack.forEach((r) => {
        if (r.route && r.route.path) {
            console.log(`${Object.keys(r.route.methods).join(', ').toUpperCase()} ${r.route.path}`);
        }
    });
}

connectDB().then(() => {
    const http = require('http');
    const server = http.createServer(app);
    server.listen(PORT, () => {
        console.log(`EasyBills server running on port ${PORT}`);
        printRoutes(); 
    });
}).catch((err) => {
    console.error('Failed to connect to database:', err);
});