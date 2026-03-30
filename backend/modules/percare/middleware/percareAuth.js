/**
 * PerCare Auth Middleware
 * Stubs for JWT-based authentication and role-based authorization
 * Replace with actual JWT verification logic when integrating
 */

/**
 * Require authentication
 * In production: verify JWT token from Authorization header
 */
function requireAuth(req, res, next) {
  // TODO: Replace with actual JWT verification
  const authHeader = req.headers['authorization'];
  if (!authHeader && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  // In development: allow all requests and set a default user
  req.user = req.user || {
    id:   req.headers['x-user-id']   || 'dev-user',
    role: req.headers['x-user-role'] || 'provider',
    name: req.headers['x-user-name'] || 'Dev User',
  };
  next();
}

/**
 * Require a specific role
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });
    if (!roles.includes(req.user.role) && process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    next();
  };
}

/**
 * Optional auth — attach user if token present, continue if not
 */
function optionalAuth(req, res, next) {
  req.user = req.user || {
    id:   req.headers['x-user-id']   || 'anonymous',
    role: req.headers['x-user-role'] || 'viewer',
    name: req.headers['x-user-name'] || 'Anonymous',
  };
  next();
}

module.exports = { requireAuth, requireRole, optionalAuth };
