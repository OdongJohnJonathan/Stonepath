import express from 'express';
import crypto from 'crypto';
import pool from '../db.js';
import { hashPassword, comparePassword } from '../../utils/hash.js';
import { generateToken } from '../../utils/jwt.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../../utils/email.js';

const router = express.Router();

// ── REGISTER ──────────────────────────────────────
router.post('/register', async (req, res) => {
  const {
    first_name, last_name, email, password, phone_number, role,
    // Service Provider specific fields (only used when role === 5)
    business_name, business_description, category_ids,
    country, district, location, whatsapp, years_experience, logo_url,
  } = req.body;

  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ error: 'First name, last name, email and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  if (!phone_number) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  // 2 = Agent, 5 = Service Provider, 1 = User (default/regular buyer)
  const assignedRole = role === 2 ? 2 : role === 5 ? 5 : 1;

  if (assignedRole === 5) {
    if (!business_name || !business_description || !Array.isArray(category_ids) || category_ids.length === 0) {
      return res.status(400).json({ error: 'Business name, description, and at least one service category are required' });
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query('SELECT id, email FROM users WHERE email = $1 OR phone_number = $2', [email, phone_number]);
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      const field = existing.rows[0].email === email ? 'email' : 'phone number';
      return res.status(400).json({ error: `An account with this ${field} already exists` });
    }

    const password_hash = await hashPassword(password);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const result = await client.query(
      `INSERT INTO users
        (first_name, last_name, email, password_hash, phone_number, role,
         is_verified, verification_token, verification_token_expires, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,false,$7,$8,NOW(),NOW())
       RETURNING *`,
      [first_name, last_name, email, password_hash, phone_number || null,
       assignedRole, verificationToken, verificationExpires]
    );
    const user = result.rows[0];

    // If registering as a Service Provider, create their provider profile + category links
    if (assignedRole === 5) {
      const providerResult = await client.query(
        `INSERT INTO service_providers
          (user_id, business_name, description, phone_number, email, whatsapp,
           country, district, location, years_experience, logo_url, status, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending',NOW(),NOW())
         RETURNING id`,
        [
          user.id, business_name, business_description, phone_number, email,
          whatsapp || null, country || 'Uganda', district || null, location || null,
          years_experience || null, logo_url || null,
        ]
      );
      const providerId = providerResult.rows[0].id;

      for (const categoryId of category_ids) {
        await client.query(
          `INSERT INTO service_provider_categories (provider_id, category_id)
           VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [providerId, categoryId]
        );
      }
    }

    await client.query('COMMIT');

    // Send verification email (don't block registration if it fails)
    try {
      await sendVerificationEmail(email, first_name, verificationToken);
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr.message);
    }

    res.status(201).json({ token: generateToken(user) });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      const field = err.constraint?.includes('phone') ? 'phone number' : 'email';
      return res.status(400).json({ error: `An account with this ${field} already exists` });
    }
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ── LOGIN ─────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    const user = result.rows[0];

    // Block deactivated accounts
    if (user.is_active === false) {
      return res.status(403).json({ error: 'Your account has been deactivated. Please contact support.' });
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    if (!user.is_verified) {
      return res.status(403).json({
        error: 'Please verify your email before logging in. Check your inbox for the verification link.',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    res.json({ token: generateToken(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── VERIFY EMAIL ──────────────────────────────────
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;

  if (!token) return res.status(400).json({ error: 'Token is required' });

  try {
    const result = await pool.query(
      `SELECT id FROM users
       WHERE verification_token = $1
       AND verification_token_expires > NOW()
       AND is_verified = false`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification link' });
    }

    await pool.query(
      `UPDATE users
       SET is_verified = true,
           verification_token = NULL,
           verification_token_expires = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [result.rows[0].id]
    );

    // Redirect to frontend success page
    res.redirect(`${process.env.FRONTEND_URL}/verify-email?success=true`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// ── OAUTH (Google / Apple) ────────────────────────
// Stubs until client IDs/secrets are provided — wire up
// passport-google-oauth20 / passport-apple here once keys exist.
router.get('/google', (req, res) => {
  res.status(501).json({ error: 'Google sign-in is not set up yet. Please use email and password.', code: 'OAUTH_NOT_CONFIGURED' });
});

router.get('/apple', (req, res) => {
  res.status(501).json({ error: 'Apple sign-in is not set up yet. Please use email and password.', code: 'OAUTH_NOT_CONFIGURED' });
});

// ── RESEND VERIFICATION EMAIL ─────────────────────
router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    // Always return success to prevent email enumeration
    if (result.rows.length === 0) {
      return res.json({ message: 'If that account exists and is unverified, a new verification email has been sent.' });
    }

    const user = result.rows[0];
    if (user.is_verified) {
      return res.json({ message: 'If that account exists and is unverified, a new verification email has been sent.' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await pool.query(
      `UPDATE users
       SET verification_token = $1, verification_token_expires = $2, updated_at = NOW()
       WHERE id = $3`,
      [verificationToken, verificationExpires, user.id]
    );

    try {
      await sendVerificationEmail(email, user.first_name, verificationToken);
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr.message);
    }

    res.json({ message: 'If that account exists and is unverified, a new verification email has been sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// ── FORGOT PASSWORD ───────────────────────────────
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    // Always return success to prevent email enumeration
    if (result.rows.length === 0) {
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const user = result.rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      `UPDATE users
       SET reset_token = $1, reset_token_expires = $2, updated_at = NOW()
       WHERE id = $3`,
      [resetToken, resetExpires, user.id]
    );

    try {
      await sendPasswordResetEmail(email, user.first_name, resetToken);
    } catch (emailErr) {
      console.error('Failed to send reset email:', emailErr.message);
    }

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// ── RESET PASSWORD ────────────────────────────────
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    const result = await pool.query(
      `SELECT id FROM users
       WHERE reset_token = $1
       AND reset_token_expires > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset link' });
    }

    const password_hash = await hashPassword(password);

    await pool.query(
      `UPDATE users
       SET password_hash = $1,
           reset_token = NULL,
           reset_token_expires = NULL,
           updated_at = NOW()
       WHERE id = $2`,
      [password_hash, result.rows[0].id]
    );

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Reset failed' });
  }
});

export default router;