// server.js

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const claimsRoutes = require('./routes/claims');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

const app = express();

// CORS Configuration for Vue.js Frontend
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Vue.js dev server default
    credentials: true, // Allow cookies for sessions
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sessions + Passport for Google OAuth
const session = require('express-session');
const passport = require('./config/passport');

app.use(session({
    secret: process.env.SESSION_SECRET || 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());

// Authentication middleware (uses session passport info)
const auth = require('./middleware/auth');
app.use(auth);

// Connect to database
connectDB().catch((err) => {
    console.error('Failed to connect to database:', err);
    process.exit(1);
});

// Routes
app.use('/api', claimsRoutes);
app.use('/auth', authRoutes);
app.use('/api/user', userRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, error: 'Server Error' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`EasyBills server running on port ${PORT}`);
});
