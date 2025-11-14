const session = require('express-session');

// Use MemoryStore for development. For production, replace with RedisStore.
const MemoryStore = session.MemoryStore;
const store = new MemoryStore();

const sessionMiddleware = session({
  store,
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // set true behind HTTPS in production
    httpOnly: true,
    sameSite: 'lax'
  }
});

module.exports = { sessionMiddleware, sessionStore: store };
