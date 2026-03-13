import { Router } from 'express';
import { readFile } from 'fs/promises';
import sql from '../db/pool.js';
import { authenticate } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import { upload } from '../middleware/upload.js';
import { categorizeGrievance, verifyMedia, verifyResolution } from '../services/gemini.js';
import { checkSpatialBuffer } from '../services/spatial.js';
import { checkDeadline } from '../services/verification.js';
import { STATUS, VERIFICATION_WINDOW_HOURS } from '../utils/constants.js';

const router = Router();

// GET /api/grievances/map — Lightweight data for map markers
router.get('/map', async (req, res, next) => {
  try {
    const result = await sql`
      SELECT id, latitude, longitude, ai_category, ai_priority, status, title, impact_count
      FROM grievances
      WHERE status != ${STATUS.RESOLVED_FINAL}
      ORDER BY created_at DESC
      LIMIT 1000
    `;
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/grievances — List with filters and sorting
router.get('/', async (req, res, next) => {
  try {
    const { status, category, ward, sort = 'impact', page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `SELECT g.*, u.name as user_name FROM grievances g JOIN users u ON g.user_id = u.id WHERE 1=1`;
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

    res.json({
      grievances: result,
      total: countResult[0].total,
      page: parseInt(page),
      totalPages: Math.ceil(countResult[0].total / parseInt(limit)),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/grievances/:id — Single grievance with lazy deadline check
router.get('/:id', async (req, res, next) => {
  try {
    const result = await sql`
      SELECT g.*, u.name as user_name
      FROM grievances g
      JOIN users u ON g.user_id = u.id
      WHERE g.id = ${req.params.id}
    `;

    if (!result[0]) {
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

    // Get upvote count and check if current user upvoted
    const upvoteInfo = await sql`
      SELECT COUNT(*)::int as count FROM upvotes WHERE grievance_id = ${req.params.id}
    `;

    res.json({
      ...grievance,
      proofs,
      upvotes: upvoteInfo[0].count,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/grievances — Create new grievance with AI categorization
router.post('/', authenticate, upload.single('media'), async (req, res, next) => {
  try {
    const { raw_description, latitude, longitude } = req.body;

    if (!raw_description || !latitude || !longitude) {
      return res.status(400).json({ error: 'Description, latitude, and longitude are required' });
    }

    // AI categorization
    const aiResult = await categorizeGrievance(raw_description);

    // Handle media upload
    let mediaUrl = null;
    let mediaVerified = false;
    if (req.file) {
      if (process.env.NODE_ENV === 'production') {
        // In production, store base64 in DB
        mediaUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      } else {
        mediaUrl = `/uploads/${req.file.filename}`;
      }

      // Verify media matches description
      const imageBase64 = req.file.buffer
        ? req.file.buffer.toString('base64')
        : await readFile(req.file.path).then(buf => buf.toString('base64'));

      const verification = await verifyMedia(imageBase64, req.file.mimetype, raw_description);
      mediaVerified = verification.matches_description;
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
    next(err);
  }
});

// POST /api/grievances/:id/upvote — "I'm affected too"
router.post('/:id/upvote', authenticate, async (req, res, next) => {
  try {
    // Atomic upsert + increment using CTE
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
      // Either already upvoted or grievance not found
      const existing = await sql`SELECT impact_count FROM grievances WHERE id = ${req.params.id}`;
      if (!existing[0]) {
        return res.status(404).json({ error: 'Grievance not found' });
      }
      return res.json({ impact_count: existing[0].impact_count, already_upvoted: true });
    }

    res.json({ impact_count: result[0].impact_count, already_upvoted: false });
  } catch (err) {
    next(err);
  }
});

// POST /api/grievances/:id/resolve — Officer uploads proof
router.post('/:id/resolve', authenticate, roleGuard('officer', 'admin'), upload.single('proof'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Proof photo is required' });
    }

    // Get original grievance
    const grievanceResult = await sql`SELECT * FROM grievances WHERE id = ${req.params.id}`;
    if (!grievanceResult[0]) {
      return res.status(404).json({ error: 'Grievance not found' });
    }
    const grievance = grievanceResult[0];

    // Upload proof photo
    let proofUrl;
    if (process.env.NODE_ENV === 'production') {
      proofUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    } else {
      proofUrl = `/uploads/${req.file.filename}`;
    }

    // AI verification if original has media
    let aiMatchScore = null;
    if (grievance.media_url && !grievance.media_url.startsWith('data:')) {
      try {
        const originalBuffer = await readFile(grievance.media_url.replace(/^\//, ''));
        const proofBuffer = req.file.buffer || await readFile(req.file.path);
        const result = await verifyResolution(
          originalBuffer.toString('base64'), 'image/jpeg',
          proofBuffer.toString('base64'), req.file.mimetype,
          grievance.raw_description
        );
        aiMatchScore = result.match_score;
      } catch (e) {
        console.error('Resolution verification failed:', e.message);
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

    res.json({ grievance: updated[0], ai_match_score: aiMatchScore });
  } catch (err) {
    next(err);
  }
});

// POST /api/grievances/:id/verify — Citizen verifies or reopens
router.post('/:id/verify', authenticate, async (req, res, next) => {
  try {
    const { verified } = req.body;

    const grievanceResult = await sql`SELECT * FROM grievances WHERE id = ${req.params.id}`;
    if (!grievanceResult[0]) {
      return res.status(404).json({ error: 'Grievance not found' });
    }

    const grievance = grievanceResult[0];

    // Only original filer can verify
    if (grievance.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the original filer can verify' });
    }

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

    // Update proof citizen_verified field
    if (verified) {
      await sql`
        UPDATE resolution_proofs
        SET citizen_verified = true
        WHERE grievance_id = ${req.params.id}
      `;
    }

    res.json(updated[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/grievances/:id/assign — Admin assigns officer
router.post('/:id/assign', authenticate, roleGuard('admin'), async (req, res, next) => {
  try {
    const { officer_id } = req.body;
    const updated = await sql`
      UPDATE grievances
      SET officer_id = ${officer_id}, status = ${STATUS.ASSIGNED}, updated_at = NOW()
      WHERE id = ${req.params.id}
      RETURNING *
    `;
    if (!updated[0]) {
      return res.status(404).json({ error: 'Grievance not found' });
    }
    res.json(updated[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
