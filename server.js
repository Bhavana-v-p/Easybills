// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const passport = require('./config/passport'); // Import passport config
const { connectDB } = require('./config/db');
const { sessionMiddleware } = require('./config/session');
 
// Routes
const claimsRoutes = require('./routes/claims');
const userRoutes = require('./routes/user');
 
// Load environment variables
dotenv.config();
 
const app = express();
 
// 1. Trust Proxy (Crucial for Render)
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
 
// 4. Session & Passport
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());
 
// 5. Connect Database
connectDB().catch((err) => {
    console.error('Failed to connect to database:', err);
    process.exit(1);
});
 
// ==========================================
// 👇 AUTH ROUTES MOVED HERE (To Fix 404) 👇
// ==========================================
 
// Initiate Google Login
app.get('/auth/google', (req, res, next) => {
    const callbackURL = process.env.GOOGLE_CALLBACK_URL;
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        prompt: 'select_account',
        callbackURL: callbackURL
    })(req, res, next);
});
 
// Google Callback
app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        // Successful authentication
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        // Explicitly save session before redirecting
        req.session.save((err) => {
            if (err) console.error('Session save error:', err);
            res.redirect(`${frontendUrl}/dashboard`);
        });
    }
);
 
// Logout
app.get('/auth/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        req.session.destroy((err) => {
            res.clearCookie('connect.sid');
            res.status(200).json({ success: true, message: 'Logged out' });
        });
    });
});
 
// ==========================================
// 👆 END AUTH ROUTES 👆
// ==========================================
 
// API Routes
app.use('/api', claimsRoutes); // Ensure this matches your claim routes prefix
app.use('/api/user', userRoutes);
 
// Health Check
app.get('/', (req, res) => {
    res.status(200).send('EasyBills Backend is Running!');
});
 
// Error Handling
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, error: 'Server Error' });
});
 
// Start Server
const http = require('http');
const realtime = require('./services/realtime');
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
 
// Initialize Realtime
realtime.init(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
    },
    sessionMiddleware: sessionMiddleware
});
 
server.listen(PORT, () => {
    console.log(`EasyBills server running on port ${PORT}`);
});