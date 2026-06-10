import pool from '../db.js';

// Criteria for automatic agent verification in Uganda:
// 1. Email verified
// 2. Phone number added
// 3. At least 1 approved listing
// 4. Account at least 3 days old

export const checkAndVerifyAgent = async (userId) => {
  try {
    const result = await pool.query(
      `SELECT
        u.is_verified,
        u.phone_number,
        u.created_at,
        u.is_agent_verified,
        u.role,
        COUNT(p.id) as approved_listings
       FROM users u
       LEFT JOIN properties p ON p.created_by = u.id
         AND p.status = 'approved'
         AND p.deleted_at IS NULL
       WHERE u.id = $1
       GROUP BY u.id`,
      [userId]
    );

    if (result.rows.length === 0) return;
    const user = result.rows[0];

    // Only applies to agents
    if (Number(user.role) !== 2) return;

    // Already verified — skip
    if (user.is_agent_verified) return;

    const accountAgeDays = (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24);

    const meetsEmailVerified = user.is_verified === true;
    const meetsPhone = !!user.phone_number;
    const meetsListings = parseInt(user.approved_listings) >= 1;
    const meetsAccountAge = accountAgeDays >= 3;

    if (meetsEmailVerified && meetsPhone && meetsListings && meetsAccountAge) {
      await pool.query(
        `UPDATE users SET is_agent_verified = true, updated_at = NOW() WHERE id = $1`,
        [userId]
      );
      console.log(`✅ Agent ${userId} automatically verified`);
    }
  } catch (err) {
    console.error('Agent verification check failed:', err.message);
  }
};