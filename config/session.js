// config/session.js

const session = require('express-session');

const { createClient } = require('redis');

const dotenv = require('dotenv');
 


let RedisStore = require('connect-redis');
 
// Check if it's version 7+ (has .default) or version 6 (is a function)

if (RedisStore.default) {

    RedisStore = RedisStore.default;

} else if (typeof RedisStore === 'function') {

    // Version 6 fallback: Initialize with session

    RedisStore = RedisStore(session);

}
 
dotenv.config();
 
// 1. Initialize Redis Client

const redisClient = createClient({

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
 