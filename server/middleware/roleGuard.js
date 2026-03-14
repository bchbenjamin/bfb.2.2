import { logger } from '../utils/logger.js';

export function roleGuard(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      logger.warn('RoleGuard: no user on request', { url: req.originalUrl });
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('RoleGuard: insufficient permissions', {
        userId: req.user.id,
        role: req.user.role,
        required: allowedRoles,
        url: req.originalUrl,
      });
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
