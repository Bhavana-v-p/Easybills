// config/session.js
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const { createClient } = require('redis');
const dotenv = require('dotenv');

dotenv.config();

// 1. Initialize Redis Client
const redisClient = createClient({
    // Uses REDIS_URL from .env (Render) or defaults to localhost (Local Dev)
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 1000)
    }
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('Connected to Redis for Sessions'));

// Connect to Redis asynchronously
redisClient.connect().catch(console.error);

// 2. Create Session Middleware
const sessionMiddleware = session({
    store: new RedisStore({
        client: redisClient,
        prefix: 'easybills_sess:', // Optional prefix to organize keys
    }),
    secret: process.env.SESSION_SECRET || 'dev_secret_key',
    resave: false,             // Required: false for Redis
    saveUninitialized: false,  // Required: false to prevent empty sessions
    cookie: {
        // Secure: true is REQUIRED for 'SameSite: none' (Production)
        secure: process.env.NODE_ENV === 'production', 
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 1 Day
        // 'none' allows cookies between Vercel (Frontend) and Render (Backend)
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
});

module.exports = { sessionMiddleware };