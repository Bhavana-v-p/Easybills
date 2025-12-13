// config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User'); // Importing your User model

passport.serializeUser((user, done) => {
    done(null, user.id); // Save user ID to session
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findByPk(id); // Find user by ID
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL, 
    passReqToCallback: true
},
async (req, accessToken, refreshToken, profile, done) => {
    try {
        // 1. Check if user exists
        let user = await User.findOne({ where: { googleId: profile.id } });

        if (user) {
            // 🛑 CRITICAL LOGIC CHANGE:
            // We found the user, so we simply return them.
            // We DO NOT update their name or picture from Google here.
            // This ensures your manual edits (via the Profile page) are preserved.
            return done(null, user);
        }

        // 2. User doesn't exist? Create new user with Google data
        const newUser = await User.create({
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName, // Set initial name from Google
            picture: profile.photos ? profile.photos[0].value : null, // Set initial picture
            role: 'Faculty'
        });

        return done(null, newUser);
    } catch (err) {
        console.error('Google Auth Error:', err);
        return done(err, null);
    }
}));

module.exports = passport;