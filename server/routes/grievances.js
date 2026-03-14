import { Router } from 'express';
import sql from '../db/pool.js';
import { authenticate } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import { upload } from '../middleware/upload.js';
import { categorizeGrievance, verifyMedia, verifyResolution } from '../services/gemini.js';
import { checkSpatialBuffer } from '../services/spatial.js';
import { checkDeadline } from '../services/verification.js';
import { STATUS, VERIFICATION_WINDOW_HOURS } from '../utils/constants.js';
import { logger } from '../utils/logger.js';

const router = Router();

// GET /api/grievances/map — Lightweight data for map markers
router.get('/map', async (req, res, next) => {
  try {
    logger.debug('Fetching map grievances');
    const result = await sql`
      SELECT id, latitude, longitude, ai_category, ai_priority, status, title, impact_count
      FROM grievances
      ORDER BY created_at DESC
      LIMIT 1000
    `;
    logger.info('Map data returned', { count: result.length });
    res.json(result);
  } catch (err) {
    logger.error('Map query failed', { error: err.message });
    next(err);
  }
});

// POST /api/grievances/analyze — AI categorization preview (no save)
router.post('/analyze', authenticate, async (req, res, next) => {
  try {
    const { raw_description } = req.body;
    logger.info('Analyze request', { userId: req.user.id });

    if (!raw_description?.trim()) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const aiResult = await categorizeGrievance(raw_description);
    logger.info('Analyze result', { category: aiResult.category });
    res.json(aiResult);
  } catch (err) {
    logger.error('Analyze failed', { error: err.message });
    next(err);
  }
});

// POST /api/grievances/verify-media — Backend-routed media verification
router.post('/verify-media', authenticate, upload.single('media'), async (req, res, next) => {
  try {
    const { category, description } = req.body;
    logger.info('Verify-media request', { userId: req.user.id, category });

    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const imageBase64 = req.file.buffer.toString('base64');
    const verification = await verifyMedia(imageBase64, req.file.mimetype, description || category);
    logger.info('Verify-media result', { matches: verification.matches_description });
    res.json(verification);
  } catch (err) {
    logger.error('Verify-media failed', { error: err.message });
    next(err);
  }
});


// GET /api/grievances — List with filters and sorting
router.get('/', async (req, res, next) => {
  try {
    const { status, category, ward, sort = 'impact', page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    logger.debug('Listing grievances', { status, category, ward, sort, page, limit });

    let query = `SELECT g.* FROM grievances g WHERE 1=1`;
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND g.status = $${paramIndex++}`;
      params.push(status);
    }
    if (category) {
      query += ` AND g.ai_category = $${paramIndex++}`;
      params.push(category);
    }
    if (ward) {
      query += ` AND g.ward = $${paramIndex++}`;
      params.push(ward);
    }

    const sortMap = {
      impact: 'g.impact_count DESC',
      recent: 'g.created_at DESC',
      priority: 'g.ai_priority DESC',
    };
    query += ` ORDER BY ${sortMap[sort] || sortMap.impact}`;
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit), offset);

    const result = await sql(query, params);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*)::int as total FROM grievances WHERE 1=1`;
    const countParams = [];
    let countIndex = 1;
    if (status) {
      countQuery += ` AND status = $${countIndex++}`;
      countParams.push(status);
    }
    if (category) {
      countQuery += ` AND ai_category = $${countIndex++}`;
      countParams.push(category);
    }
    if (ward) {
      countQuery += ` AND ward = $${countIndex++}`;
      countParams.push(ward);
    }
    const countResult = await sql(countQuery, countParams);

    logger.info('Grievances listed', { returned: result.length, total: countResult[0].total });
    res.json({
      grievances: result,
      total: countResult[0].total,
      page: parseInt(page),
      totalPages: Math.ceil(countResult[0].total / parseInt(limit)),
    });
  } catch (err) {
    logger.error('Grievance list query failed', { error: err.message });
    next(err);
  }
});

// GET /api/grievances/:id — Single grievance with lazy deadline check
router.get('/:id', async (req, res, next) => {
  try {
    logger.debug('Fetching grievance', { id: req.params.id });
    const result = await sql`
      SELECT g.*
      FROM grievances g
      WHERE g.id = ${req.params.id}
    `;

    if (!result[0]) {
      logger.warn('Grievance not found', { id: req.params.id });
      return res.status(404).json({ error: 'Grievance not found' });
    }

    // Lazy verification deadline check
    let grievance = await checkDeadline(result[0]);

    // Get resolution proofs
    const proofs = await sql`
      SELECT rp.*, u.name as officer_name
      FROM resolution_proofs rp
      JOIN users u ON rp.officer_id = u.id
      WHERE rp.grievance_id = ${req.params.id}
      ORDER BY rp.created_at DESC
    `;

    // Get upvote count
    const upvoteInfo = await sql`
      SELECT COUNT(*)::int as count FROM upvotes WHERE grievance_id = ${req.params.id}
    `;

    res.json({
      ...grievance,
      proofs,
      upvotes: upvoteInfo[0].count,
    });
  } catch (err) {
    logger.error('Grievance fetch failed', { id: req.params.id, error: err.message });
    next(err);
  }
});

// POST /api/grievances — Create new grievance with AI categorization
router.post('/', authenticate, upload.single('media'), async (req, res, next) => {
  try {
    const { raw_description, latitude, longitude } = req.body;
    logger.info('Creating grievance', { userId: req.user.id, hasMedia: !!req.file });

    if (!raw_description || !latitude || !longitude) {
      logger.warn('Grievance creation rejected: missing fields');
      return res.status(400).json({ error: 'Description, latitude, and longitude are required' });
    }

    // AI categorization
    logger.debug('Running AI categorization');
    const aiResult = await categorizeGrievance(raw_description);
    logger.info('AI categorization result', { category: aiResult.category, priority: aiResult.priority });

    // Handle media upload (always memory buffer)
    let mediaUrl = null;
    let mediaVerified = false;
    if (req.file) {
      mediaUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      logger.debug('Media uploaded to memory', { size: req.file.size, mimetype: req.file.mimetype });

      // Verify media matches description
      const imageBase64 = req.file.buffer.toString('base64');
      const verification = await verifyMedia(imageBase64, req.file.mimetype, raw_description);
      mediaVerified = verification.matches_description;
      logger.info('Media verification result', { mediaVerified });
    }

    // Insert grievance
    const result = await sql`
      INSERT INTO grievances (
        user_id, title, raw_description,
        ai_category, ai_subcategory, ai_priority, ai_detected_location,
        latitude, longitude, media_url, media_verified, ward
      ) VALUES (
        ${req.user.id}, ${aiResult.suggested_title || raw_description.slice(0, 80)}, ${raw_description},
        ${aiResult.category}, ${aiResult.subcategory}, ${aiResult.priority}, ${aiResult.detected_location},
        ${parseFloat(latitude)}, ${parseFloat(longitude)}, ${mediaUrl}, ${mediaVerified},
        ${aiResult.detected_location || null}
      )
      RETURNING *
    `;

    const grievance = result[0];
    logger.info('Grievance created', { grievanceId: grievance.id, category: aiResult.category });

    // Spatial buffer check — real-time anomaly detection
    const spatialResult = await checkSpatialBuffer(
      aiResult.category,
      parseFloat(latitude),
      parseFloat(longitude)
    );

    res.status(201).json({
      grievance,
      ai_analysis: aiResult,
      media_verified: mediaVerified,
      spatial_alert: spatialResult.isAlert ? spatialResult : null,
    });
  } catch (err) {
    logger.error('Grievance creation failed', { error: err.message, stack: err.stack });
    next(err);
  }
});

// POST /api/grievances/:id/upvote — "I'm affected too"
router.post('/:id/upvote', authenticate, async (req, res, next) => {
  try {
    logger.info('Upvote attempt', { grievanceId: req.params.id, userId: req.user.id });

    const result = await sql`
      WITH inserted AS (
        INSERT INTO upvotes (grievance_id, user_id)
        VALUES (${req.params.id}, ${req.user.id})
        ON CONFLICT (grievance_id, user_id) DO NOTHING
        RETURNING id
      )
      UPDATE grievances
      SET impact_count = impact_count + 1, updated_at = NOW()
      WHERE id = ${req.params.id} AND EXISTS (SELECT 1 FROM inserted)
      RETURNING impact_count
    `;

    if (!result[0]) {
      const existing = await sql`SELECT impact_count FROM grievances WHERE id = ${req.params.id}`;
      if (!existing[0]) {
        return res.status(404).json({ error: 'Grievance not found' });
      }
      logger.debug('Already upvoted', { grievanceId: req.params.id, userId: req.user.id });
      return res.json({ impact_count: existing[0].impact_count, already_upvoted: true });
    }

    logger.info('Upvote recorded', { grievanceId: req.params.id, newCount: result[0].impact_count });
    res.json({ impact_count: result[0].impact_count, already_upvoted: false });
  } catch (err) {
    logger.error('Upvote failed', { error: err.message });
    next(err);
  }
});

// POST /api/grievances/:id/resolve — Officer uploads proof
router.post('/:id/resolve', authenticate, roleGuard('officer', 'admin'), upload.single('proof'), async (req, res, next) => {
  try {
    logger.info('Resolution attempt', { grievanceId: req.params.id, officerId: req.user.id });

    if (!req.file) {
      return res.status(400).json({ error: 'Proof photo is required' });
    }

    // Get original grievance
    const grievanceResult = await sql`SELECT * FROM grievances WHERE id = ${req.params.id}`;
    if (!grievanceResult[0]) {
      return res.status(404).json({ error: 'Grievance not found' });
    }
    const grievance = grievanceResult[0];

    // Upload proof photo (always memory buffer)
    const proofUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    // AI verification if original has media
    let aiMatchScore = null;
    if (grievance.media_url && grievance.media_url.startsWith('data:')) {
      try {
        // Extract base64 from data URI
        const originalBase64 = grievance.media_url.split(',')[1];
        const proofBase64 = req.file.buffer.toString('base64');
        const result = await verifyResolution(
          originalBase64, 'image/jpeg',
          proofBase64, req.file.mimetype,
          grievance.raw_description
        );
        aiMatchScore = result.match_score;
        logger.info('Resolution AI verification', { aiMatchScore });
      } catch (e) {
        logger.error('Resolution verification failed', { error: e.message });
      }
    }

    // Insert proof
    await sql`
      INSERT INTO resolution_proofs (grievance_id, officer_id, photo_url, ai_match_score)
      VALUES (${req.params.id}, ${req.user.id}, ${proofUrl}, ${aiMatchScore})
    `;

    // Update grievance status with 24-hour verification deadline
    const updated = await sql`
      UPDATE grievances
      SET status = ${STATUS.RESOLVED_PENDING},
          officer_id = ${req.user.id},
          verification_deadline = NOW() + make_interval(hours => ${VERIFICATION_WINDOW_HOURS}),
          updated_at = NOW()
      WHERE id = ${req.params.id}
      RETURNING *
    `;

    logger.info('Grievance marked resolved_pending', { grievanceId: req.params.id });
    res.json({ grievance: updated[0], ai_match_score: aiMatchScore });
  } catch (err) {
    logger.error('Resolution failed', { error: err.message, stack: err.stack });
    next(err);
  }
});

// POST /api/grievances/:id/verify — Citizen verifies or reopens
router.post('/:id/verify', authenticate, async (req, res, next) => {
  try {
    const { verified } = req.body;
    logger.info('Verification attempt', { grievanceId: req.params.id, verified, userId: req.user.id });

    const grievanceResult = await sql`SELECT * FROM grievances WHERE id = ${req.params.id}`;
    if (!grievanceResult[0]) {
      return res.status(404).json({ error: 'Grievance not found' });
    }

    const grievance = grievanceResult[0];

    // Any logged-in citizen can verify — no ownership check (anonymous filing)

    if (grievance.status !== STATUS.RESOLVED_PENDING) {
      return res.status(400).json({ error: 'Grievance is not pending verification' });
    }

    const newStatus = verified ? STATUS.RESOLVED_FINAL : STATUS.REOPENED;

    const updated = await sql`
      UPDATE grievances
      SET status = ${newStatus}, updated_at = NOW()
      WHERE id = ${req.params.id}
      RETURNING *
    `;

    if (verified) {
      await sql`
        UPDATE resolution_proofs
        SET citizen_verified = true
        WHERE grievance_id = ${req.params.id}
      `;
    }

    logger.info('Grievance verification result', { grievanceId: req.params.id, newStatus });
    res.json(updated[0]);
  } catch (err) {
    logger.error('Verification failed', { error: err.message });
    next(err);
  }
});

// POST /api/grievances/:id/assign — Admin assigns officer
router.post('/:id/assign', authenticate, roleGuard('admin'), async (req, res, next) => {
  try {
    const { officer_id } = req.body;
    logger.info('Assigning officer', { grievanceId: req.params.id, officerId: officer_id });

    const updated = await sql`
      UPDATE grievances
      SET officer_id = ${officer_id}, status = ${STATUS.ASSIGNED}, updated_at = NOW()
      WHERE id = ${req.params.id}
      RETURNING *
    `;
    if (!updated[0]) {
      return res.status(404).json({ error: 'Grievance not found' });
    }

    logger.info('Officer assigned', { grievanceId: req.params.id, officerId: officer_id });
    res.json(updated[0]);
  } catch (err) {
    logger.error('Assignment failed', { error: err.message });
    next(err);
  }
});

// PATCH /api/grievances/:id/status — Officer changes status (e.g. to in_progress)
router.patch('/:id/status', authenticate, roleGuard('officer', 'admin'), async (req, res, next) => {
  try {
    const { status: newStatus } = req.body;
    const allowedStatuses = [STATUS.IN_PROGRESS, STATUS.ASSIGNED];

    if (!allowedStatuses.includes(newStatus)) {
      return res.status(400).json({ error: `Status must be one of: ${allowedStatuses.join(', ')}` });
    }

    logger.info('Status change', { grievanceId: req.params.id, newStatus, officerId: req.user.id });

    const updated = await sql`
      UPDATE grievances
      SET status = ${newStatus}, officer_id = ${req.user.id}, updated_at = NOW()
      WHERE id = ${req.params.id}
      RETURNING *
    `;

    if (!updated[0]) {
      return res.status(404).json({ error: 'Grievance not found' });
    }

    logger.info('Status updated', { grievanceId: req.params.id, newStatus });
    res.json(updated[0]);
  } catch (err) {
    logger.error('Status change failed', { error: err.message });
    next(err);
  }
});

export default router;
