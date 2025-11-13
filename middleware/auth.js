// middleware/auth.js

// Minimal auth middleware stub for development/testing.
// - If `Authorization: Bearer <id>` header is provided, it will use that id.
// - Otherwise, it injects a placeholder user: { id: 1, role: 'Faculty' }.

module.exports = function (req, res, next) {
  try {
    const auth = req.header('Authorization');
    if (auth && auth.startsWith('Bearer ')) {
      const token = auth.slice(7).trim();
      // In real implementation decode/verify JWT or session
      // For now: accept numeric token as user id.
      const id = Number(token);
      if (!Number.isNaN(id)) {
        req.user = { id, role: 'Faculty' };
        return next();
      }
    }

    // Default development user (do NOT use in production)
    req.user = { id: 1, role: 'Faculty' };
    return next();
  } catch (err) {
    next(err);
  }
};
