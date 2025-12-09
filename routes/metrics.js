const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../db');
const { requireLogin } = require('./_middleware');

const router = express.Router();

/**
 * Format a Date (or date string) as YYYY-MM-DD for HTML date inputs.
 */
function formatDate(date) {
  if (!date) return '';
  if (typeof date === 'string') return date.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

/**
 * Show all metrics for the logged-in user, with optional filters.
 */
router.get('/', requireLogin, async (req, res) => {
  const userId = req.session.user.id;
  const typeFilter = req.query.type || '';
  const fromDate = req.query.from || '';
  const toDate = req.query.to || '';

  try {
    // Load metric types so the user can filter in the dropdown.
    const [metricTypes] = await pool.query(
      'SELECT id, name FROM metric_types ORDER BY name ASC'
    );

    const whereClauses = ['m.user_id = ?'];
    const params = [userId];

    if (typeFilter) {
      whereClauses.push('m.metric_type_id = ?');
      params.push(typeFilter);
    }
    if (fromDate) {
      whereClauses.push('m.metric_date >= ?');
      params.push(fromDate);
    }
    if (toDate) {
      whereClauses.push('m.metric_date <= ?');
      params.push(toDate);
    }

    const whereSql = 'WHERE ' + whereClauses.join(' AND ');

    const [rows] = await pool.query(
      `
      SELECT m.id,
             m.metric_date,
             m.value,
             COALESCE(m.unit, mt.default_unit) AS unit,
             m.notes,
             mt.name AS metric_type_name
      FROM metrics m
      JOIN metric_types mt ON m.metric_type_id = mt.id
      ${whereSql}
      ORDER BY m.metric_date DESC, m.created_at DESC
      `,
      params
    );

    // Pre-format date for display in the template.
    const metrics = rows.map(m => ({
      ...m,
      metric_date_str: formatDate(m.metric_date)
    }));

    res.render('metrics/list', {
      pageTitle: 'My Health Metrics',
      metricTypes,
      metrics,
      filters: {
        type: typeFilter,
        from: fromDate,
        to: toDate
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error_500');
  }
});

/**
 * Render the form for adding a new metric.
 */
router.get('/add', requireLogin, async (req, res) => {
  try {
    const [metricTypes] = await pool.query(
      'SELECT id, name, default_unit FROM metric_types ORDER BY name ASC'
    );

    res.render('metrics/form', {
      pageTitle: 'Add Metric',
      formTitle: 'Add Metric',
      formAction: '/metrics/add',
      metricTypes,
      metric: {
        metric_date: '',
        metric_type_id: '',
        value: '',
        unit: '',
        notes: ''
      },
      errors: {}
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error_500');
  }
});

/**
 * Create a new metric for the current user.
 */
router.post(
  '/add',
  requireLogin,
  [
    body('metric_date')
      .trim()
      .notEmpty()
      .withMessage('Please enter a date.'),
    body('metric_type_id')
      .trim()
      .notEmpty()
      .withMessage('Please select a metric type.'),
    body('value')
      .trim()
      .notEmpty()
      .withMessage('Please enter a value.')
      .isFloat()
      .withMessage('Value must be a number.')
  ],
  async (req, res) => {
    const userId = req.session.user.id;
    const errors = validationResult(req);
    const { metric_date, metric_type_id, value, unit, notes } = req.body;

    const metricForForm = {
      metric_date,
      metric_type_id,
      value,
      unit,
      notes
    };

    try {
      const [metricTypes] = await pool.query(
        'SELECT id, name, default_unit FROM metric_types ORDER BY name ASC'
      );

      if (!errors.isEmpty()) {
        // Re-render the form with validation messages and the user input.
        return res.status(422).render('metrics/form', {
          pageTitle: 'Add Metric',
          formTitle: 'Add Metric',
          formAction: '/metrics/add',
          metricTypes,
          metric: metricForForm,
          errors: errors.mapped()
        });
      }

      await pool.query(
        `
        INSERT INTO metrics
          (user_id, metric_type_id, metric_date, value, unit, notes)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          userId,
          metric_type_id,
          metric_date,
          value,
          unit || null,
          notes || null
        ]
      );

      req.flash('success', 'Metric added successfully.');
      res.redirect('../metrics');
    } catch (err) {
      console.error(err);
      res.status(500).render('error_500');
    }
  }
);

/**
 * Show the edit form for one metric belonging to the current user.
 */
router.get('/:id/edit', requireLogin, async (req, res) => {
  const userId = req.session.user.id;
  const metricId = req.params.id;

  try {
    const [rows] = await pool.query(
      `
      SELECT id, metric_date, metric_type_id, value, unit, notes
      FROM metrics
      WHERE id = ? AND user_id = ?
      LIMIT 1
      `,
      [metricId, userId]
    );

    if (rows.length === 0) {
      // Either the metric does not exist, or it belongs to another user.
      return res.status(404).render('error_404');
    }

    const metricRow = rows[0];

    const [metricTypes] = await pool.query(
      'SELECT id, name, default_unit FROM metric_types ORDER BY name ASC'
    );

    const metricForForm = {
      id: metricRow.id,
      metric_date: formatDate(metricRow.metric_date),
      metric_type_id: String(metricRow.metric_type_id),
      value: metricRow.value,
      unit: metricRow.unit || '',
      notes: metricRow.notes || ''
    };

    res.render('metrics/form', {
      pageTitle: 'Edit Metric',
      formTitle: 'Edit Metric',
      formAction: `/metrics/${metricId}/edit`,
      metricTypes,
      metric: metricForForm,
      errors: {}
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error_500');
  }
});

/**
 * Save changes to an existing metric.
 */
router.post(
  '/:id/edit',
  requireLogin,
  [
    body('metric_date')
      .trim()
      .notEmpty()
      .withMessage('Please enter a date.'),
    body('metric_type_id')
      .trim()
      .notEmpty()
      .withMessage('Please select a metric type.'),
    body('value')
      .trim()
      .notEmpty()
      .withMessage('Please enter a value.')
      .isFloat()
      .withMessage('Value must be a number.')
  ],
  async (req, res) => {
    const userId = req.session.user.id;
    const metricId = req.params.id;
    const errors = validationResult(req);
    const { metric_date, metric_type_id, value, unit, notes } = req.body;

    const metricForForm = {
      id: metricId,
      metric_date,
      metric_type_id,
      value,
      unit,
      notes
    };

    try {
      const [metricTypes] = await pool.query(
        'SELECT id, name, default_unit FROM metric_types ORDER BY name ASC'
      );

      if (!errors.isEmpty()) {
        return res.status(422).render('metrics/form', {
          pageTitle: 'Edit Metric',
          formTitle: 'Edit Metric',
          formAction: `/metrics/${metricId}/edit`,
          metricTypes,
          metric: metricForForm,
          errors: errors.mapped()
        });
      }

      const [result] = await pool.query(
        `
        UPDATE metrics
        SET metric_date = ?,
            metric_type_id = ?,
            value = ?,
            unit = ?,
            notes = ?
        WHERE id = ? AND user_id = ?
        `,
        [
          metric_date,
          metric_type_id,
          value,
          unit || null,
          notes || null,
          metricId,
          userId
        ]
      );

      if (result.affectedRows === 0) {
        // Metric was not found or belonged to someone else.
        return res.status(404).render('error_404');
      }

      req.flash('success', 'Metric updated successfully.');
      res.redirect('../../metrics');
    } catch (err) {
      console.error(err);
      res.status(500).render('error_500');
    }
  }
);

/**
 * Remove a metric owned by the current user.
 */
router.post('/:id/delete', requireLogin, async (req, res) => {
  const userId = req.session.user.id;
  const metricId = req.params.id;

  try {
    const [result] = await pool.query(
      'DELETE FROM metrics WHERE id = ? AND user_id = ?',
      [metricId, userId]
    );

    if (result.affectedRows > 0) {
      req.flash('success', 'Metric deleted.');
    } else {
      req.flash('error', 'Metric not found or not authorised.');
    }

    res.redirect('../../metrics');
  } catch (err) {
    console.error(err);
    res.status(500).render('error_500');
  }
});

module.exports = router;
