import { Router } from 'express';
import sql from '../db/pool.js';
import { authenticate } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';

const router = Router();

// GET /api/dashboard/stats — Overview statistics
router.get('/stats', authenticate, roleGuard('admin', 'officer'), async (req, res, next) => {
  try {
    const stats = await sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'open')::int AS open,
        COUNT(*) FILTER (WHERE status = 'assigned')::int AS assigned,
        COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
        COUNT(*) FILTER (WHERE status IN ('resolved_pending', 'resolved_final'))::int AS resolved,
        COUNT(*) FILTER (WHERE status = 'reopened')::int AS reopened,
        ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600)
          FILTER (WHERE status = 'resolved_final'), 1) AS avg_hours_to_resolve
      FROM grievances
    `;

    const categoryBreakdown = await sql`
      SELECT ai_category, COUNT(*)::int AS count
      FROM grievances
      GROUP BY ai_category
      ORDER BY count DESC
    `;

    const wardBreakdown = await sql`
      SELECT ward, COUNT(*)::int AS count
      FROM grievances
      WHERE ward IS NOT NULL
      GROUP BY ward
      ORDER BY count DESC
      LIMIT 10
    `;

    res.json({
      ...stats[0],
      categories: categoryBreakdown,
      wards: wardBreakdown,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/heatmap — Heatmap intensity data
router.get('/heatmap', authenticate, async (req, res, next) => {
  try {
    const result = await sql`
      SELECT latitude, longitude, ai_priority AS intensity
      FROM grievances
      WHERE status NOT IN ('resolved_final')
    `;
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/officers — List officers for assignment
router.get('/officers', authenticate, roleGuard('admin'), async (req, res, next) => {
  try {
    const result = await sql`
      SELECT u.id, u.name, u.ward,
        COUNT(g.id)::int FILTER (WHERE g.status NOT IN ('resolved_final', 'resolved_pending')) AS active_cases
      FROM users u
      LEFT JOIN grievances g ON g.officer_id = u.id
      WHERE u.role = 'officer'
      GROUP BY u.id, u.name, u.ward
      ORDER BY u.name
    `;
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
