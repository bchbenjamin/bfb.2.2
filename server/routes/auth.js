import { Router } from 'express';
import jwt from 'jsonwebtoken';
import sql from '../db/pool.js';

const router = Router();

// POST /api/auth/login — Simulated DigiLocker/Aadhaar OIDC
router.post('/login', async (req, res, next) => {
  try {
    const { aadhaar_id, name, email, phone, otp, language_pref } = req.body;

    if (!aadhaar_id || !name) {
      return res.status(400).json({ error: 'Aadhaar ID and name are required' });
    }

    if (!/^\d{12}$/.test(aadhaar_id)) {
      return res.status(400).json({ error: 'Aadhaar ID must be 12 digits' });
    }

    // Simulated OTP verification — always accepts "123456"
    if (otp && otp !== '123456') {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Upsert user
    const result = await sql`
      INSERT INTO users (aadhaar_id, name, email, phone, language_pref)
      VALUES (${aadhaar_id}, ${name}, ${email || null}, ${phone || null}, ${language_pref || 'en'})
      ON CONFLICT (aadhaar_id)
      DO UPDATE SET name = EXCLUDED.name, language_pref = COALESCE(EXCLUDED.language_pref, users.language_pref)
      RETURNING id, name, role, language_pref, ward, email
    `;

    const user = result[0];

    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role, language_pref: user.language_pref },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me — Get current user info
router.get('/me', async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    const result = await sql`SELECT id, name, role, language_pref, ward, email FROM users WHERE id = ${payload.id}`;

    if (!result[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
