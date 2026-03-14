import { Router } from 'express';
import sql from '../db/pool.js';
import { authenticate } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import { logger } from '../utils/logger.js';

const router = Router();

// GET /api/dashboard/stats — Overview statistics
router.get('/stats', authenticate, roleGuard('admin', 'officer'), async (req, res, next) => {
  try {
    logger.debug('Fetching dashboard stats', { userId: req.user.id });

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

    logger.info('Dashboard stats returned', { total: stats[0]?.total });
    res.json({
      ...stats[0],
      categories: categoryBreakdown,
      wards: wardBreakdown,
    });
  } catch (err) {
    logger.error('Dashboard stats query failed', { error: err.message });
    next(err);
  }
});

// GET /api/dashboard/heatmap — Heatmap intensity data
router.get('/heatmap', authenticate, async (req, res, next) => {
  try {
    logger.debug('Fetching heatmap data');
    const result = await sql`
      SELECT latitude, longitude, ai_priority AS intensity
      FROM grievances
      WHERE status NOT IN ('resolved_final')
    `;
    logger.info('Heatmap data returned', { count: result.length });
    res.json(result);
  } catch (err) {
    logger.error('Heatmap query failed', { error: err.message });
    next(err);
  }
});

// GET /api/dashboard/officers — List officers for assignment
router.get('/officers', authenticate, roleGuard('admin'), async (req, res, next) => {
  try {
    logger.debug('Fetching officers list');
    const result = await sql`
      SELECT u.id, u.name, u.ward,
        COUNT(g.id)::int FILTER (WHERE g.status NOT IN ('resolved_final', 'resolved_pending')) AS active_cases
      FROM users u
      LEFT JOIN grievances g ON g.officer_id = u.id
      WHERE u.role = 'officer'
      GROUP BY u.id, u.name, u.ward
      ORDER BY u.name
    `;
    logger.info('Officers listed', { count: result.length });
    res.json(result);
  } catch (err) {
    logger.error('Officers query failed', { error: err.message });
    next(err);
  }
});

// GET /api/dashboard/admin-stats — Summary stats for admin dashboard
router.get('/admin-stats', authenticate, roleGuard('admin', 'officer'), async (req, res, next) => {
  try {
    logger.debug('Fetching admin stats');

    const stats = await sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status IN ('open', 'assigned', 'reopened'))::int AS open_count,
        COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress_count,
        COUNT(*) FILTER (WHERE status IN ('resolved_pending', 'resolved_final')
          AND updated_at >= CURRENT_DATE)::int AS resolved_today,
        ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600)
          FILTER (WHERE status = 'resolved_final'), 1) AS avg_resolution_hours
      FROM grievances
    `;

    const alertCount = await sql`
      SELECT COUNT(*)::int AS count FROM alerts WHERE resolved_at IS NULL
    `;

    logger.info('Admin stats returned', { stats: stats[0] });
    res.json({
      ...stats[0],
      active_alerts: alertCount[0].count,
    });
  } catch (err) {
    logger.error('Admin stats query failed', { error: err.message });
    next(err);
  }
});

export default router;
