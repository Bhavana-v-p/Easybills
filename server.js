// server.js

const express = require('express');

const dotenv = require('dotenv');

const cors = require('cors');

const path = require('path');

const passport = require('passport');

const session = require('express-session');

const { createClient } = require('redis');

const connectRedis = require('connect-redis');

const { connectDB } = require('./config/db');
 
// Load environment variables

dotenv.config();
 
const app = express();
 
// 1. Trust Proxy (REQUIRED for Render HTTPS)

app.set('trust proxy', 1);
 
// 2. CORS Configuration

const corsOptions = {

    origin: process.env.FRONTEND_URL || 'http://localhost:5173',

    credentials: true,

    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],

    allowedHeaders: ['Content-Type', 'Authorization']

};

app.use(cors(corsOptions));
 
// 3. Middleware

app.use(express.json({ limit: '10mb' }));

app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(express.static(path.join(__dirname, 'public')));
 
// 4. Session Setup (Redis)

// Initialize Redis Client

const redisClient = createClient({

    url: process.env.REDIS_URL || 'redis://localhost:6379',

    socket: {

        reconnectStrategy: (retries) => Math.min(retries * 50, 1000)

    }

});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

redisClient.connect().catch(console.error);
 
// Configure RedisStore (Universal Fix for v6/v7)

let RedisStore = connectRedis.default || connectRedis;

const sessionMiddleware = session({

    store: new RedisStore({

        client: redisClient,

        prefix: 'easybills_sess:',

    }),

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
 
// 5. Passport Config

require('./config/passport'); // Ensure this file exists and configures the strategy

app.use(passport.initialize());

app.use(passport.session());
 
// ==================================================================

// 👇 AUTH ROUTES (Hardcoded here to prevent "Cannot GET" errors) 👇

// ==================================================================
 
// Route 1: Start Login

app.get('/auth/google', (req, res, next) => {

    console.log('Login started...'); // Debug Log

    const callbackURL = process.env.GOOGLE_CALLBACK_URL;

    passport.authenticate('google', {

        scope: ['profile', 'email'],

        prompt: 'select_account',

        callbackURL: callbackURL

    })(req, res, next);

});
 
// Route 2: Google Callback

app.get('/auth/google/callback', 

    (req, res, next) => {

        console.log('Google returned to callback...'); // Debug Log

        // Force the callback URL again to be safe

        const callbackURL = process.env.GOOGLE_CALLBACK_URL;

        passport.authenticate('google', { 

            failureRedirect: '/',

            callbackURL: callbackURL 

        })(req, res, next);

    },

    (req, res) => {

        // Successful authentication

        console.log('Authentication successful for:', req.user.email);

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

        // Explicitly save session before redirecting

        req.session.save((err) => {

            if (err) console.error('Session save error:', err);

            res.redirect(`${frontendUrl}/dashboard`);

        });

    }

);
 
// Route 3: Logout

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

// 👆 END AUTH ROUTES 👆

// ==================================================================
 
// Connect Routes

const claimsRoutes = require('./routes/claims');

const userRoutes = require('./routes/user');
 
app.use('/api', claimsRoutes); // Ensure routes/claims.js exists

app.use('/api/user', userRoutes); // Ensure routes/user.js exists
 
// Health Check

app.get('/', (req, res) => {

    res.status(200).send('EasyBills Backend is Running!');

});
 
// Connect Database & Start Server

connectDB().then(() => {

    const http = require('http');

    const realtime = require('./services/realtime');

    const server = http.createServer(app);

    // Initialize Socket.io

    realtime.init(server, {

        cors: corsOptions,

        sessionMiddleware: sessionMiddleware

    });
 
    server.listen(PORT, () => {

        console.log(`EasyBills server running on port ${PORT}`);

    });

}).catch((err) => {

    console.error('Failed to connect to database:', err);

});
 