// config/session.js

const session = require('express-session');

const { createClient } = require('redis');

const dotenv = require('dotenv');
 
// 👇 DIRECT V7 IMPORT (The fix)

const RedisStore = require('connect-redis').default;
 
dotenv.config();
 
// 1. Initialize Redis Client

const redisClient = createClient({

    // Uses REDIS_URL from Render or localhost for dev

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

    // 👇 Pass client directly to the store

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
 
module.exports = { sessionMiddleware };
 