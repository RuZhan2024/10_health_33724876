const express = require('express');
const pool = require('../db');
const { requireAdmin } = require('./_middleware');

const router = express.Router();

/**
 * Format a Date or string as "YYYY-MM-DD HH:MM:SS" for display.
 */
function formatDateTime(dt) {
  if (!dt) return '';
  if (typeof dt === 'string') return dt.replace('T', ' ').slice(0, 19);
  // Handle Date objects from MySQL driver.
  return dt.toISOString().replace('T', ' ').slice(0, 19);
}

/**
 * Admin dashboard with site-wide stats, users, and recent login attempts.
 */
router.get('/', requireAdmin, async (req, res) => {
  try {
    // Site-level aggregates (user counts, activity counts, etc.)
    const [statsRows] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'admin') AS total_admins,
        (SELECT COUNT(*) FROM users WHERE is_active = 1) AS active_users,
        (SELECT COUNT(*) FROM workouts) AS total_workouts,
        (SELECT COUNT(*) FROM metrics) AS total_metrics,
        (SELECT COUNT(*) FROM workouts
           WHERE workout_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        ) AS workouts_last7,
        (SELECT COUNT(*) FROM metrics
           WHERE metric_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        ) AS metrics_last7
    `);

    const siteStats = statsRows[0] || {
      total_users: 0,
      total_admins: 0,
      active_users: 0,
      total_workouts: 0,
      total_metrics: 0,
      workouts_last7: 0,
      metrics_last7: 0
    };

    // Load users along with how many workouts and metrics each one has.
const [usersRows] = await pool.query(`
  SELECT
    u.id,                              -- user id
    u.username,                        -- username shown in the app
    u.email,                           -- contact email
    u.role,                            -- "user" or "admin"
    u.is_active,                       -- 1 = active, 0 = deactivated
    u.created_at,                      -- when the account was created
    u.last_login,                      -- last time the user logged in
    COALESCE(w.workout_count, 0) AS workout_count,  -- total workouts for this user
    COALESCE(m.metric_count, 0) AS metric_count     -- total metrics for this user
  FROM users u
  LEFT JOIN (
    -- Aggregate workouts per user
    SELECT user_id, COUNT(*) AS workout_count
    FROM workouts
    GROUP BY user_id
  ) w ON u.id = w.user_id
  LEFT JOIN (
    -- Aggregate metrics per user
    SELECT user_id, COUNT(*) AS metric_count
    FROM metrics
    GROUP BY user_id
  ) m ON u.id = m.user_id
  ORDER BY u.created_at ASC, u.username ASC   -- show oldest accounts first
`);

    const users = usersRows.map(u => ({
      ...u,
      created_at_str: formatDateTime(u.created_at),
      last_login_str: u.last_login ? formatDateTime(u.last_login) : 'Never'
    }));

    // Most recent login attempts from the audit table.
    const [loginRows] = await pool.query(`
      SELECT
        la.id,
        la.username_attempt,
        la.success,
        la.ip_address,
        la.user_agent,
        la.attempted_at,
        u.username AS linked_username
      FROM login_audit la
      LEFT JOIN users u ON la.user_id = u.id
      ORDER BY la.attempted_at DESC
      LIMIT 10
    `);

    const recentLogins = loginRows.map(l => ({
      ...l,
      attempted_at_str: formatDateTime(l.attempted_at)
    }));

    res.render('admin', {
      pageTitle: 'Admin Dashboard',
      siteStats,
      users,
      recentLogins,
      currentAdminId: req.session.user.id
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error_500');
  }
});

/**
 * Promote or demote a user to/from admin.
 */
router.post('/users/:id/role', requireAdmin, async (req, res) => {
  const targetUserId = req.params.id;
  const newRole = req.body.role; // expected 'user' or 'admin'
  const currentAdminId = req.session.user.id;

  if (!['user', 'admin'].includes(newRole)) {
    req.flash('error', 'Invalid role value.');
    return res.redirect('/admin');
  }

  // Prevent an admin from accidentally removing their own admin rights.
  if (String(targetUserId) === String(currentAdminId) && newRole !== 'admin') {
    req.flash('error', 'You cannot remove your own admin role.');
    return res.redirect('/admin');
  }

  try {
    const [result] = await pool.query(
      'UPDATE users SET role = ? WHERE id = ?',
      [newRole, targetUserId]
    );

    if (result.affectedRows === 0) {
      req.flash('error', 'User not found.');
    } else {
      req.flash('success', 'User role updated.');
    }
    res.redirect('/admin');
  } catch (err) {
    console.error(err);
    res.status(500).render('error_500');
  }
});

/**
 * Activate or deactivate a user account.
 */
router.post('/users/:id/toggle-active', requireAdmin, async (req, res) => {
  const targetUserId = req.params.id;
  const currentAdminId = req.session.user.id;

  // Do not allow an admin to deactivate themselves.
  if (String(targetUserId) === String(currentAdminId)) {
    req.flash('error', 'You cannot deactivate your own account.');
    return res.redirect('/admin');
  }

  try {
    // Flip is_active between 0 and 1.
    const [result] = await pool.query(
      'UPDATE users SET is_active = 1 - is_active WHERE id = ?',
      [targetUserId]
    );

    if (result.affectedRows === 0) {
      req.flash('error', 'User not found.');
    } else {
      req.flash('success', 'User activation status updated.');
    }

    res.redirect('/admin');
  } catch (err) {
    console.error(err);
    res.status(500).render('error_500');
  }
});

module.exports = router;
