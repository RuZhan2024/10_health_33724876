const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireLogin } = require('./_middleware');

/**
 * Personal dashboard for the logged-in user.
 * Shows a few recent workouts and metrics, plus summary stats.
 */
router.get('/', requireLogin, async (req, res) => {
  const userId = req.session.user.id;

  try {
    // Last 5 workouts for this user.
    const [recentWorkouts] = await pool.query(
      `
      SELECT w.id,
             w.workout_date,
             w.duration_minutes,
             w.intensity,
             w.notes,
             wt.name AS workout_type_name
      FROM workouts w
      JOIN workout_types wt ON w.workout_type_id = wt.id
      WHERE w.user_id = ?
      ORDER BY w.workout_date DESC, w.created_at DESC
      LIMIT 5
      `,
      [userId]
    );

    // Last 5 metrics for this user.
    const [recentMetrics] = await pool.query(
      `
      SELECT m.id,
             m.metric_date,
             m.value,
             COALESCE(m.unit, mt.default_unit) AS unit,
             m.notes,
             mt.name AS metric_type_name
      FROM metrics m
      JOIN metric_types mt ON m.metric_type_id = mt.id
      WHERE m.user_id = ?
      ORDER BY m.metric_date DESC, m.created_at DESC
      LIMIT 5
      `,
      [userId]
    );

    // Workouts in the last 7 days (for quick activity overview).
    const [workoutsLast7Rows] = await pool.query(
      `
      SELECT COUNT(*) AS count, COALESCE(SUM(duration_minutes), 0) AS total_minutes
      FROM workouts
      WHERE user_id = ?
        AND workout_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      `,
      [userId]
    );
    const workoutsLast7 = workoutsLast7Rows[0] || { count: 0, total_minutes: 0 };

    // Workouts in the last 30 days, used for average activity stats.
    const [workoutsLast30Rows] = await pool.query(
      `
      SELECT COUNT(*) AS count, COALESCE(SUM(duration_minutes), 0) AS total_minutes
      FROM workouts
      WHERE user_id = ?
        AND workout_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      `,
      [userId]
    );
    const workoutsLast30 = workoutsLast30Rows[0] || { count: 0, total_minutes: 0 };

    // How many metric records the user has ever created.
    const [metricsCountRows] = await pool.query(
      `
      SELECT COUNT(*) AS count
      FROM metrics
      WHERE user_id = ?
      `,
      [userId]
    );
    const metricsCount = metricsCountRows[0] ? metricsCountRows[0].count : 0;

    const stats = {
      workoutsLast7Count: workoutsLast7.count || 0,
      workoutsLast7Minutes: workoutsLast7.total_minutes || 0,
      workoutsLast30Count: workoutsLast30.count || 0,
      workoutsLast30Minutes: workoutsLast30.total_minutes || 0,
      metricsCount
    };

    res.render('dashboard', {
      pageTitle: 'Dashboard',
      recentWorkouts,
      recentMetrics,
      stats
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error_500');
  }
});

module.exports = router;
