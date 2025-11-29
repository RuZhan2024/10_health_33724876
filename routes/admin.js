// routes/admin.js
const express = require('express');
const db = require('../db');
const { requireAdmin } = require('./_middleware');

const router = express.Router();

router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const [[userCount]] = await db.query('SELECT COUNT(*) AS count FROM users');
    const [[workoutCount]] = await db.query('SELECT COUNT(*) AS count FROM workouts');
    const [[metricCount]] = await db.query('SELECT COUNT(*) AS count FROM metrics');

    const [topUsers] = await db.query(
      `SELECT u.username, COUNT(w.id) AS workouts
       FROM users u
       LEFT JOIN workouts w ON u.id = w.user_id
       GROUP BY u.id
       ORDER BY workouts DESC
       LIMIT 5`
    );

    res.render('admin', {
      title: 'Admin Overview',
      userCount: userCount.count,
      workoutCount: workoutCount.count,
      metricCount: metricCount.count,
      topUsers,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
