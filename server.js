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
// 🔐 SECURITY & CONNECTION SETTINGS
// ==================================================================

// 1. Trust Proxy
app.set('trust proxy', 1);

// 2. CORS
const corsOptions = {
    origin: 'https://easybills-amber.vercel.app', 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// 3. Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// 4. Session Setup
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
        secure: true,        
        httpOnly: true,      
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'none'     
    }
}));

sessionStore.sync(); 
require('./config/passport'); 
app.use(passport.initialize());
app.use(passport.session());

// ==================================================================
// 👇 AUTH ROUTES
// ==================================================================

app.get('/auth/google', (req, res, next) => {
    const callbackURL = process.env.GOOGLE_CALLBACK_URL;
    console.log('🚀 LOGIN START. Callback:', callbackURL);
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        prompt: 'select_account',
        callbackURL: callbackURL
    })(req, res, next);
});

app.get('/auth/google/callback', 
    (req, res, next) => {
        const callbackURL = process.env.GOOGLE_CALLBACK_URL;
        passport.authenticate('google', { 
            failureRedirect: '/',
            callbackURL: callbackURL 
        })(req, res, next);
    },
    (req, res) => {
        console.log('🎉 AUTH SUCCESS');
        const frontendUrl = 'https://easybills-amber.vercel.app'; 
        req.session.save((err) => {
            if (err) console.error('Session Save Error:', err);
            res.redirect(`${frontendUrl}/dashboard`);
        });
    }
);

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
// 🛠️ TEMPORARY ADMIN SETUP ROUTE (Add this part!)
// ==================================================================
app.get('/setup-admin', async (req, res) => {
    // 👇 Ensure this email matches exactly what you use to log in
    const targetEmail = '202317b2304@wilp.bits-pilani.ac.in'; 

    try {
        let user = await User.findOne({ where: { email: targetEmail } });

        if (user) {
            user.role = 'Accounts'; // Force the role update
            await user.save();
            return res.send(`
                <div style="font-family: sans-serif; padding: 2rem;">
                    <h1 style="color: green;">✅ Success!</h1>
                    <p>User <b>${targetEmail}</b> role updated to: <b>${user.role}</b></p>
                    <p>Please logout and log back in to see the Accounts Dashboard.</p>
                </div>
            `);
        } else {
            return res.send(`<h1>❌ User Not Found</h1><p>Please log in to the app at least once first, so your account is created in the database.</p>`);
        }
    } catch (error) {
        return res.status(500).send(`<h1>❌ Error</h1><p>${error.message}</p>`);
    }
});
// ==================================================================

app.use('/api', require('./routes/claims'));
app.use('/api/user', require('./routes/user'));

app.get('/', (req, res) => {
    res.status(200).send('EasyBills Backend is Running!');
});

app.use('*', (req, res) => {
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