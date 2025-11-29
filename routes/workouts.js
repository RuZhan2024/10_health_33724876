// routes/workouts.js
const express = require('express');
const db = require('../db');
const { requireLogin } = require('./_middleware');

const router = express.Router();

// list with pagination
router.get('/', requireLogin, async (req, res, next) => {
  const userId = req.session.user.id;
  const page = parseInt(req.query.page || '1', 10);
  const pageSize = 10;
  const offset = (page - 1) * pageSize;

  try {
    const [[{ count }]] = await db.query(
      'SELECT COUNT(*) AS count FROM workouts WHERE user_id = ?',
      [userId]
    );

    const [rows] = await db.query(
      `SELECT * FROM workouts
       WHERE user_id = ?
       ORDER BY date DESC, id DESC
       LIMIT ? OFFSET ?`,
      [userId, pageSize, offset]
    );

    const totalPages = Math.ceil(count / pageSize);

    res.render('workouts/list', {
      title: 'My Workouts',
      workouts: rows,
      page,
      totalPages,
    });
  } catch (err) {
    next(err);
  }
});

// add form
router.get('/add', requireLogin, (req, res) => {
  res.render('workouts/form', {
    title: 'Add Workout',
    errors: [],
    values: { date: new Date().toISOString().slice(0, 10) },
    formAction: '/workouts/add',
    submitLabel: 'Add Workout',
  });
});

// add submit
router.post('/add', requireLogin, async (req, res, next) => {
  const userId = req.session.user.id;
  const { date, type, duration_min, intensity, calories, notes } = req.body;

  const errors = [];
  if (!date) errors.push('Date is required.');
  if (!type) errors.push('Type is required.');
  if (!duration_min || isNaN(duration_min) || duration_min <= 0) {
    errors.push('Duration must be a positive number.');
  }

  if (errors.length > 0) {
    return res.render('workouts/form', {
      title: 'Add Workout',
      errors,
      values: req.body,
      formAction: '/workouts/add',
      submitLabel: 'Add Workout',
    });
  }

  try {
    await db.query(
      `INSERT INTO workouts
         (user_id, date, type, duration_min, intensity, calories, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, date, type, duration_min, intensity || 1, calories || null, notes || null]
    );
    req.session.flash = { type: 'success', message: 'Workout added.' };
    res.redirect('/workouts');
  } catch (err) {
    next(err);
  }
});

// detail
router.get('/:id', requireLogin, async (req, res, next) => {
  const userId = req.session.user.id;
  const id = req.params.id;

  try {
    const [rows] = await db.query(
      'SELECT * FROM workouts WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    const workout = rows[0];
    if (!workout) {
      return res.status(404).render('error_404', { title: 'Not found' });
    }
    res.render('workouts/detail', { title: 'Workout Details', workout });
  } catch (err) {
    next(err);
  }
});

// edit form
router.get('/:id/edit', requireLogin, async (req, res, next) => {
  const userId = req.session.user.id;
  const id = req.params.id;

  try {
    const [rows] = await db.query(
      'SELECT * FROM workouts WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    const workout = rows[0];
    if (!workout) {
      return res.status(404).render('error_404', { title: 'Not found' });
    }

    res.render('workouts/form', {
      title: 'Edit Workout',
      errors: [],
      values: workout,
      formAction: `/workouts/${id}/edit`,
      submitLabel: 'Save changes',
    });
  } catch (err) {
    next(err);
  }
});

// edit submit
router.post('/:id/edit', requireLogin, async (req, res, next) => {
  const userId = req.session.user.id;
  const id = req.params.id;
  const { date, type, duration_min, intensity, calories, notes } = req.body;

  const errors = [];
  if (!date) errors.push('Date is required.');
  if (!type) errors.push('Type is required.');
  if (!duration_min || isNaN(duration_min) || duration_min <= 0) {
    errors.push('Duration must be a positive number.');
  }

  if (errors.length > 0) {
    return res.render('workouts/form', {
      title: 'Edit Workout',
      errors,
      values: req.body,
      formAction: `/workouts/${id}/edit`,
      submitLabel: 'Save changes',
    });
  }

  try {
    await db.query(
      `UPDATE workouts
       SET date = ?, type = ?, duration_min = ?, intensity = ?, calories = ?, notes = ?
       WHERE id = ? AND user_id = ?`,
      [date, type, duration_min, intensity || 1, calories || null, notes || null, id, userId]
    );
    req.session.flash = { type: 'success', message: 'Workout updated.' };
    res.redirect('/workouts');
  } catch (err) {
    next(err);
  }
});

// delete
router.post('/:id/delete', requireLogin, async (req, res, next) => {
  const userId = req.session.user.id;
  const id = req.params.id;

  try {
    await db.query(
      'DELETE FROM workouts WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    req.session.flash = { type: 'success', message: 'Workout deleted.' };
    res.redirect('/workouts');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
