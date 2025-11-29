// routes/search.js
const express = require('express');
const db = require('../db');
const { requireLogin } = require('./_middleware');

const router = express.Router();

router.get('/search', requireLogin, (req, res) => {
  res.render('search', {
    title: 'Search Workouts',
    values: {},
  });
});

router.get('/search/results', requireLogin, async (req, res, next) => {
  const userId = req.session.user.id;
  const { q, date_from, date_to, min_duration } = req.query;

  const conditions = ['user_id = ?'];
  const params = [userId];

  if (q && q.trim()) {
    conditions.push('(type LIKE ? OR notes LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }
  if (date_from) {
    conditions.push('date >= ?');
    params.push(date_from);
  }
  if (date_to) {
    conditions.push('date <= ?');
    params.push(date_to);
  }
  if (min_duration) {
    conditions.push('duration_min >= ?');
    params.push(Number(min_duration));
  }

  const whereClause = conditions.join(' AND ');

  try {
    const [rows] = await db.query(
      `SELECT * FROM workouts
       WHERE ${whereClause}
       ORDER BY date DESC, id DESC`,
      params
    );

    res.render('search_results', {
      title: 'Search Results',
      workouts: rows,
      count: rows.length,
      values: req.query,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
