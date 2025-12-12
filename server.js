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
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  proxy: true, // 👈 REQUIRED for Render/Cloud
  cookie: {
    secure: true, // 👈 REQUIRED for HTTPS (Render)
    sameSite: 'none', // 👈 REQUIRED for Cross-Site (Frontend != Backend)
    maxAge: 24 * 60 * 60 * 1000 
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
        prompt: 'select_account', // 👈 FORCES Google to show account picker every time
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

// Improved Logout Route
app.get('/auth/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        
        req.session.destroy((err) => {
            if (err) console.log("Session destroy error:", err);
            
// 🧹 FORCE CLEAR COOKIE (Update the name here too!)
            res.clearCookie('easybills.sid', { // 👈 CHANGE 'connect.sid' TO 'easybills.sid'
                path: '/',
                secure: true, 
                sameSite: 'none'
            });
            
            res.status(200).json({ success: true, message: 'Logged out' });
        });
    });
});

// ==================================================================
// 🛠️ ADMIN SETUP & DB FIX ROUTE
// ==================================================================
app.get('/setup-admin', async (req, res) => {
    const targetEmail = '202317b2304@wilp.bits-pilani.ac.in'; 

    try {
        // 1. 🛠️ FIX THE DATABASE ENUM FIRST
        try {
            await sequelize.query(`ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'Accounts';`);
            console.log("✅ Enum updated successfully.");
        } catch (enumError) {
            console.log("Enum update skipped or failed (might already exist):", enumError.message);
        }

        // 2. 👤 UPDATE THE USER
        let user = await User.findOne({ where: { email: targetEmail } });

        if (user) {
            await sequelize.query(
                `UPDATE "Users" SET role = 'Accounts' WHERE email = :email`,
                { replacements: { email: targetEmail } }
            );
            
            return res.send(`
                <div style="font-family: sans-serif; padding: 2rem;">
                    <h1 style="color: green;">✅ Success!</h1>
                    <p>Database Enum updated.</p>
                    <p>User <b>${targetEmail}</b> is now an Admin (Accounts).</p>
                    <p>Please logout and log back in.</p>
                </div>
            `);
        } else {
            return res.send(`<h1>❌ User Not Found</h1><p>Please log in first to create your account.</p>`);
        }
    } catch (error) {
        return res.status(500).send(`<h1>❌ Error</h1><p>${error.message}</p>`);
    }
});

// ==================================================================
// 👇 API ROUTES
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