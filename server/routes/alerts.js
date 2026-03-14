import { Router } from 'express';
import sql from '../db/pool.js';
import { authenticate } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = Router();

// GET /api/alerts — Active anomaly alerts
router.get('/', authenticate, async (req, res, next) => {
  try {
    logger.debug('Fetching active alerts');
    const result = await sql`
      SELECT * FROM alerts
      WHERE resolved_at IS NULL
      ORDER BY created_at DESC
      LIMIT 50
    `;
    logger.info('Alerts returned', { count: result.length });
    res.json(result);
  } catch (err) {
    logger.error('Alerts query failed', { error: err.message });
    next(err);
  }
});

// POST /api/alerts/:id/resolve — Mark alert as resolved
router.post('/:id/resolve', authenticate, async (req, res, next) => {
  try {
    logger.info('Resolving alert', { alertId: req.params.id, userId: req.user.id });
    const result = await sql`
      UPDATE alerts SET resolved_at = NOW()
      WHERE id = ${req.params.id}
      RETURNING *
    `;
    if (!result[0]) {
      logger.warn('Alert not found', { alertId: req.params.id });
      return res.status(404).json({ error: 'Alert not found' });
    }
    logger.info('Alert resolved', { alertId: req.params.id });
    res.json(result[0]);
  } catch (err) {
    logger.error('Alert resolution failed', { error: err.message });
    next(err);
  }
});

export default router;
