// routes/dashboard.js
const express = require('express');
const db = require('../db');
const { requireLogin } = require('./_middleware');

const router = express.Router();

router.get('/dashboard', requireLogin, async (req, res, next) => {
  const userId = req.session.user.id;

  try {
    const [[weekWorkouts]] = await db.query(
      `SELECT
         COUNT(*) AS workout_count,
         COALESCE(SUM(duration_min), 0) AS total_minutes,
         COALESCE(AVG(intensity), 0) AS avg_intensity
       FROM workouts
       WHERE user_id = ?
         AND date >= CURDATE() - INTERVAL 7 DAY`,
      [userId]
    );

    const [[weekMetrics]] = await db.query(
      `SELECT
         COALESCE(AVG(weight_kg), 0) AS avg_weight,
         COALESCE(AVG(steps), 0) AS avg_steps
       FROM metrics
       WHERE user_id = ?
         AND date >= CURDATE() - INTERVAL 7 DAY`,
      [userId]
    );

    res.render('dashboard', {
      title: 'Dashboard',
      weekWorkouts,
      weekMetrics,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
