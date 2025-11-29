// routes/home.js
const express = require('express');
const db = require('../db');
const { requireLogin } = require('./_middleware');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    if (!req.session.user) {
      return res.render('home', { pageTitle: 'Home', stats: null });
    }

    const userId = req.session.user.id;

    const [rows] = await db.query(
      `SELECT
         COUNT(*) AS workout_count,
         COALESCE(SUM(duration_min), 0) AS total_minutes
       FROM workouts
       WHERE user_id = ?
         AND date >= CURDATE() - INTERVAL 7 DAY`,
      [userId]
    );

    res.render('home', { pageTitle: 'Home', stats: rows[0] });
  } catch (err) {
    next(err);
  }
});

router.get('/about', (req, res) => {
  res.render('about', { pageTitle: 'About' });
});

module.exports = router;
