// server.js

const express = require('express');
const dotenv = require('dotenv'); // <--- ADDED: Required for line 12
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db');
const claimsRoutes = require('./routes/claims');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

// Load environment variables immediately
dotenv.config(); 

const app = express();

// CORS Configuration for Vue.js Frontend
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', 
    credentials: true, 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sessions + Passport for Google OAuth
const passport = require('./config/passport');
const { sessionMiddleware } = require('./config/session');

// Use centralized session middleware (so Socket.io can reuse it)
app.use(sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());

// Authentication middleware import
const { isAuthenticated: auth } = require('./middleware/auth');
 
// REMOVED: app.use(auth);  <--- DELETED GLOBAL AUTH (It blocks login!)

// Connect to database
connectDB().catch((err) => {
    console.error('Failed to connect to database:', err);
    process.exit(1);
});

// Routes
app.use('/auth', authRoutes); // Public: Allow access to login routes
app.use('/api', auth, claimsRoutes); // Protected: Apply auth middleware here
app.use('/api/user', auth, userRoutes); // Protected: Apply auth middleware here

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, error: 'Server Error' });
});

// Start server with Socket.io
const http = require('http');
const realtime = require('./services/realtime');

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// Initialize realtime with CORS allowing frontend origin
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