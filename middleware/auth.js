// middleware/auth.js
 
module.exports = {
    isAuthenticated: (req, res, next) => {
        // Passport adds this method to the request object
        if (req.isAuthenticated && req.isAuthenticated()) {
            return next();
        }
        // If not logged in, return 401
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
};