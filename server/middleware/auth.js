import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    logger.warn('Auth middleware: missing or malformed Authorization header', { url: req.originalUrl });
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    logger.debug('Auth middleware: authenticated', { userId: payload.id, role: payload.role });
    next();
  } catch (err) {
    logger.warn('Auth middleware: invalid token', { error: err.message, url: req.originalUrl });
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
