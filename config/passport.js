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
    // 👇 THIS LINE IS CRITICAL
    callbackURL: process.env.GOOGLE_CALLBACK_URL, 
    passReqToCallback: true
},
async (req, accessToken, refreshToken, profile, done) => {
    try {
        // Check if user exists
        let user = await User.findOne({ where: { googleId: profile.id } });

        if (user) {
            // 👇 OPTIONAL: Update name if it's missing
            if (!user.name) {
                user.name = profile.displayName;
                await user.save();
            }
            return done(null, user);
        }

        // Create new user with NAME
        const newUser = await User.create({
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName, // 👈 SAVE THE NAME HERE
            role: 'Faculty'
        });

        return done(null, newUser);
    } catch (err) {
        console.error('Google Auth Error:', err);
        return done(err, null);
    }
}));



module.exports = passport;