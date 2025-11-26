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
        // Check if user already exists
        const existingUser = await User.findOne({ where: { googleId: profile.id } });

        if (existingUser) {
            return done(null, existingUser);
        }

        // If new user, create them in the database
        const newUser = await User.create({
            googleId: profile.id,
            email: profile.emails[0].value,
            role: 'Faculty' // Default role as per your User.js model
        });

        return done(null, newUser);
    } catch (err) {
        console.error('Google Auth Error:', err);
        return done(err, null);
    }
}));

module.exports = passport;