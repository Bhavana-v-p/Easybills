// server.js

const express = require('express');
const { connectDB } = require('./config/db');
const claimsRoutes = require('./routes/claims');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Authentication middleware (development stub).
// This injects `req.user` so controllers can use `req.user.id`.
const auth = require('./middleware/auth');
app.use(auth);

// Connect to database
connectDB().catch((err) => {
    console.error('Failed to connect to database:', err);
    process.exit(1);
});

// Routes
app.use('/api', claimsRoutes);

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
