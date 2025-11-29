// routes/search.js
const express = require('express');
const pool = require('../db');
const { requireLogin } = require('./_middleware');

const router = express.Router();

function formatDate(date) {
  if (!date) return '';
  if (typeof date === 'string') return date.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

/**
 * GET /search
 * Show search form.
 */
router.get('/', requireLogin, (req, res) => {
  res.render('search/search', {
    pageTitle: 'Search',
    filters: {
      scope: 'all',
      keyword: '',
      from: '',
      to: ''
    }
  });
});

/**
 * GET /search/results
 * Perform search on workouts and/or metrics.
 * Query params:
 *  - scope: "all" | "workouts" | "metrics"
 *  - keyword: text to search in type name or notes
 *  - from / to: date range
 */
router.get('/results', requireLogin, async (req, res) => {
  const userId = req.session.user.id;

  const scope = req.query.scope || 'all';
  const keyword = (req.query.keyword || '').trim();
  const fromDate = req.query.from || '';
  const toDate = req.query.to || '';

  const filters = {
    scope,
    keyword,
    from: fromDate,
    to: toDate
  };

  let workouts = [];
  let metrics = [];

  try {
    // ----- Build WORKOUTS query if needed -----
    if (scope === 'all' || scope === 'workouts') {
      const whereClausesW = ['w.user_id = ?'];
      const paramsW = [userId];

      if (keyword) {
        whereClausesW.push('(wt.name LIKE ? OR w.notes LIKE ?)');
        const like = `%${keyword}%`;
        paramsW.push(like, like);
      }
      if (fromDate) {
        whereClausesW.push('w.workout_date >= ?');
        paramsW.push(fromDate);
      }
      if (toDate) {
        whereClausesW.push('w.workout_date <= ?');
        paramsW.push(toDate);
      }

      const whereSqlW = 'WHERE ' + whereClausesW.join(' AND ');

      const [rowsW] = await pool.query(
        `
        SELECT w.id,
               w.workout_date,
               w.duration_minutes,
               w.intensity,
               w.notes,
               wt.name AS workout_type_name
        FROM workouts w
        JOIN workout_types wt ON w.workout_type_id = wt.id
        ${whereSqlW}
        ORDER BY w.workout_date DESC, w.created_at DESC
        `,
        paramsW
      );

      workouts = rowsW.map(w => ({
        ...w,
        workout_date_str: formatDate(w.workout_date)
      }));
    }

    // ----- Build METRICS query if needed -----
    if (scope === 'all' || scope === 'metrics') {
      const whereClausesM = ['m.user_id = ?'];
      const paramsM = [userId];

      if (keyword) {
        whereClausesM.push('(mt.name LIKE ? OR m.notes LIKE ?)');
        const like = `%${keyword}%`;
        paramsM.push(like, like);
      }
      if (fromDate) {
        whereClausesM.push('m.metric_date >= ?');
        paramsM.push(fromDate);
      }
      if (toDate) {
        whereClausesM.push('m.metric_date <= ?');
        paramsM.push(toDate);
      }

      const whereSqlM = 'WHERE ' + whereClausesM.join(' AND ');

      const [rowsM] = await pool.query(
        `
        SELECT m.id,
               m.metric_date,
               m.value,
               COALESCE(m.unit, mt.default_unit) AS unit,
               m.notes,
               mt.name AS metric_type_name
        FROM metrics m
        JOIN metric_types mt ON m.metric_type_id = mt.id
        ${whereSqlM}
        ORDER BY m.metric_date DESC, m.created_at DESC
        `,
        paramsM
      );

      metrics = rowsM.map(m => ({
        ...m,
        metric_date_str: formatDate(m.metric_date)
      }));
    }

    res.render('search/results', {
      pageTitle: 'Search Results',
      filters,
      workouts,
      metrics
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error_500');
  }
});

module.exports = router;
