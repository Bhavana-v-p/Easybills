const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const passport = require('passport');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const { connectDB, sequelize } = require('./config/db');
const User = require('./models/User'); 
const realtime = require('./services/realtime'); // 👈 IMPORT REALTIME SERVICE

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ==================================================================
// 🔐 SECURITY & CONNECTION SETTINGS
// ==================================================================

app.set('trust proxy', 1);

const corsOptions = {
    origin: 'https://easybills-amber.vercel.app', 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Session Setup
const sessionStore = new SequelizeStore({
    db: sequelize,
    tableName: 'Sessions',
    checkExpirationInterval: 15 * 60 * 1000, 
    expiration: 24 * 60 * 60 * 1000 
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'your_secret_key',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  proxy: true, 
  cookie: {
    secure: true, 
    sameSite: 'none', 
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
            if (err) console.log("Session destroy error:", err);
            res.clearCookie('connect.sid', { 
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
        try {
            await sequelize.query(`ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'Accounts';`);
        } catch (e) {}

        let user = await User.findOne({ where: { email: targetEmail } });
        if (user) {
            await sequelize.query(
                `UPDATE "Users" SET role = 'Accounts' WHERE email = :email`,
                { replacements: { email: targetEmail } }
            );
            return res.send(`<h1>✅ Success! User is now Admin.</h1>`);
        } else {
            return res.send(`<h1>❌ User Not Found. Login first.</h1>`);
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

// Start Server
connectDB().then(() => {
    const http = require('http');
    const server = http.createServer(app);
    
    // 🟢 INITIALIZE REALTIME (Fixes the "Realtime not initialized" error)
    realtime.init(server);

    server.listen(PORT, () => {
        console.log(`EasyBills server running on port ${PORT}`);
    });
}).catch((err) => {
    console.error('Failed to connect to database:', err);
});