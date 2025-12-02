// middleware/auth.js

// Authentication middleware: uses Passport session if available.
// Falls back to the previous development stub when not authenticated and in development.

module.exports.isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ success: false, message: 'Unauthorized' });
};

    // Allow unauthenticated access in development for quick testing
    if (process.env.NODE_ENV !== 'production') {
      req.user = { id: 1, role: 'Faculty' };
      return next();
    }

    // In production require authentication
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  } catch (err) {
    next(err);
  }
};
