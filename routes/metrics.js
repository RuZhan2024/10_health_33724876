// routes/metrics.js
const express = require('express');
const db = require('../db');
const { requireLogin } = require('./_middleware');

const router = express.Router();

// list metrics
router.get('/', requireLogin, async (req, res, next) => {
  const userId = req.session.user.id;

  try {
    const [rows] = await db.query(
      `SELECT * FROM metrics
       WHERE user_id = ?
       ORDER BY date DESC, id DESC`,
      [userId]
    );

    res.render('metrics/list', {
      title: 'My Health Metrics',
      metrics: rows,
    });
  } catch (err) {
    next(err);
  }
});

// add form
router.get('/add', requireLogin, (req, res) => {
  res.render('metrics/form', {
    title: 'Add Metric',
    errors: [],
    values: { date: new Date().toISOString().slice(0, 10) },
    formAction: '/metrics/add',
    submitLabel: 'Add Metric',
  });
});

// add submit
router.post('/add', requireLogin, async (req, res, next) => {
  const userId = req.session.user.id;
  const { date, weight_kg, steps, bp_systolic, bp_diastolic, notes } = req.body;

  const errors = [];
  if (!date) errors.push('Date is required.');

  if (errors.length > 0) {
    return res.render('metrics/form', {
      title: 'Add Metric',
      errors,
      values: req.body,
      formAction: '/metrics/add',
      submitLabel: 'Add Metric',
    });
  }

  try {
    await db.query(
      `INSERT INTO metrics
         (user_id, date, weight_kg, steps, bp_systolic, bp_diastolic, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        date,
        weight_kg || null,
        steps || null,
        bp_systolic || null,
        bp_diastolic || null,
        notes || null,
      ]
    );
    req.session.flash = { type: 'success', message: 'Metric added.' };
    res.redirect('/metrics');
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
      'SELECT * FROM metrics WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    const metric = rows[0];
    if (!metric) {
      return res.status(404).render('error_404', { title: 'Not found' });
    }
    res.render('metrics/detail', { title: 'Metric Details', metric });
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
      'SELECT * FROM metrics WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    const metric = rows[0];
    if (!metric) {
      return res.status(404).render('error_404', { title: 'Not found' });
    }

    res.render('metrics/form', {
      title: 'Edit Metric',
      errors: [],
      values: metric,
      formAction: `/metrics/${id}/edit`,
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
  const { date, weight_kg, steps, bp_systolic, bp_diastolic, notes } = req.body;

  const errors = [];
  if (!date) errors.push('Date is required.');

  if (errors.length > 0) {
    return res.render('metrics/form', {
      title: 'Edit Metric',
      errors,
      values: req.body,
      formAction: `/metrics/${id}/edit`,
      submitLabel: 'Save changes',
    });
  }

  try {
    await db.query(
      `UPDATE metrics
       SET date = ?, weight_kg = ?, steps = ?, bp_systolic = ?, bp_diastolic = ?, notes = ?
       WHERE id = ? AND user_id = ?`,
      [date, weight_kg || null, steps || null, bp_systolic || null, bp_diastolic || null, notes || null, id, userId]
    );
    req.session.flash = { type: 'success', message: 'Metric updated.' };
    res.redirect('/metrics');
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
      'DELETE FROM metrics WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    req.session.flash = { type: 'success', message: 'Metric deleted.' };
    res.redirect('/metrics');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
