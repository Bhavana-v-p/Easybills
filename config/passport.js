// config/passport.js

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

const allowedDomain = process.env.GOOGLE_ALLOWED_DOMAIN; // e.g., 'bits-pilani.ac.in'

// Startup debug: log presence of required Google auth env vars (do not print secrets)
console.log('Google OAuth config:');
console.log(' - GOOGLE_CLIENT_ID present:', !!process.env.GOOGLE_CLIENT_ID);
console.log(' - GOOGLE_CLIENT_SECRET present:', !!process.env.GOOGLE_CLIENT_SECRET);
console.log(' - GOOGLE_CALLBACK_URL:', !!process.env.GOOGLE_CALLBACK_URL);
console.log(' - GOOGLE_ALLOWED_DOMAIN:', !!process.env.GOOGLE_ALLOWED_DOMAIN);

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback'
},
async (accessToken, refreshToken, profile, done) => {
  try {
    const email = (profile.emails && profile.emails[0] && profile.emails[0].value) || '';
    const domain = email.split('@')[1] || '';

    if (allowedDomain && domain.toLowerCase() !== allowedDomain.toLowerCase()) {
      return done(null, false, { message: 'Unauthorized domain' });
    }

    // Find or create a user mapping for googleId
    const [user] = await User.findOrCreate({
      where: { googleId: profile.id },
      defaults: { email, role: 'Faculty' }
    });

    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
