import { Router } from 'express';
import sql from '../db/pool.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// GET /api/alerts — Active anomaly alerts
router.get('/', authenticate, async (req, res, next) => {
  try {
    const result = await sql`
      SELECT * FROM alerts
      WHERE resolved_at IS NULL
      ORDER BY created_at DESC
      LIMIT 50
    `;
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/alerts/:id/resolve — Mark alert as resolved
router.post('/:id/resolve', authenticate, async (req, res, next) => {
  try {
    const result = await sql`
      UPDATE alerts SET resolved_at = NOW()
      WHERE id = ${req.params.id}
      RETURNING *
    `;
    if (!result[0]) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    res.json(result[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
