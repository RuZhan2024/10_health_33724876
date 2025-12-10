const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../db');
const { requireLogin } = require('./_middleware');

const router = express.Router();

/**
 * Format a Date (or date string) as YYYY-MM-DD.
 */
function formatDate(date) {
  if (!date) return '';
  if (typeof date === 'string') return date.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

/**
 * List workouts for the current user with optional filters.
 */
router.get('/', requireLogin, async (req, res) => {
  const userId = req.session.user.id;
  const typeFilter = req.query.type || '';
  const fromDate = req.query.from || '';
  const toDate = req.query.to || '';

  try {
    // Load workout types for the filter dropdown and forms.
    const [workoutTypes] = await pool.query(
      'SELECT id, name FROM workout_types ORDER BY name ASC'
    );

    const whereClauses = ['w.user_id = ?'];
    const params = [userId];

    if (typeFilter) {
      whereClauses.push('w.workout_type_id = ?');
      params.push(typeFilter);
    }
    if (fromDate) {
      whereClauses.push('w.workout_date >= ?');
      params.push(fromDate);
    }
    if (toDate) {
      whereClauses.push('w.workout_date <= ?');
      params.push(toDate);
    }

    const whereSql = whereClauses.length
      ? 'WHERE ' + whereClauses.join(' AND ')
      : '';

    const [rows] = await pool.query(
      `
      SELECT w.id,
             w.workout_date,
             w.duration_minutes,
             w.intensity,
             w.notes,
             wt.name AS workout_type_name
      FROM workouts w
      JOIN workout_types wt ON w.workout_type_id = wt.id
      ${whereSql}
      ORDER BY w.workout_date DESC, w.created_at DESC
      `,
      params
    );

    const workouts = rows.map(w => ({
      ...w,
      workout_date_str: formatDate(w.workout_date)
    }));

    res.render('workouts/list', {
      pageTitle: 'My Workouts',
      workoutTypes,
      workouts,
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
 * Show the form to add a new workout.
 */
router.get('/add', requireLogin, async (req, res) => {
  try {
    const [workoutTypes] = await pool.query(
      'SELECT id, name FROM workout_types ORDER BY name ASC'
    );

    res.render('workouts/form', {
      pageTitle: 'Add Workout',
      formTitle: 'Add Workout',
      formAction: '/workouts/add',
      workoutTypes,
      workout: {
        workout_date: '',
        workout_type_id: '',
        duration_minutes: '',
        intensity: 'medium',
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
 * Validate and create a new workout.
 */
router.post(
  '/add',
  requireLogin,
  [
    body('workout_date')
      .trim()
      .notEmpty()
      .withMessage('Please enter a date.'),
    body('workout_type_id')
      .trim()
      .notEmpty()
      .withMessage('Please select a workout type.'),
    body('duration_minutes')
      .trim()
      .notEmpty()
      .withMessage('Please enter a duration.')
      .isInt({ min: 1 })
      .withMessage('Duration must be a positive number of minutes.'),
    body('intensity')
      .trim()
      .isIn(['low', 'medium', 'high'])
      .withMessage('Please choose a valid intensity.')
  ],
  async (req, res) => {
    const userId = req.session.user.id;
    const errors = validationResult(req);
    const { workout_date, workout_type_id, duration_minutes, intensity, notes } =
      req.body;

    const workoutForForm = {
      workout_date,
      workout_type_id,
      duration_minutes,
      intensity: intensity || 'medium',
      notes
    };

    try {
      const [workoutTypes] = await pool.query(
        'SELECT id, name FROM workout_types ORDER BY name ASC'
      );

      if (!errors.isEmpty()) {
        // Display validation messages and keep user input on the form.
        return res.status(422).render('workouts/form', {
          pageTitle: 'Add Workout',
          formTitle: 'Add Workout',
          formAction: '../workouts/add',
          workoutTypes,
          workout: workoutForForm,
          errors: errors.mapped()
        });
      }

      await pool.query(
        `
        INSERT INTO workouts
          (user_id, workout_type_id, workout_date, duration_minutes, intensity, notes)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          userId,
          workout_type_id,
          workout_date,
          duration_minutes,
          intensity,
          notes || null
        ]
      );

      req.flash('success', 'Workout added successfully.');
      res.redirect('../workouts');
    } catch (err) {
      console.error(err);
      res.status(500).render('error_500');
    }
  }
);

/**
 * Show the edit form for a workout owned by the current user.
 */
router.get('/:id/edit', requireLogin, async (req, res) => {
  const userId = req.session.user.id;
  const workoutId = req.params.id;

  try {
    const [rows] = await pool.query(
      `
      SELECT id, workout_date, workout_type_id, duration_minutes, intensity, notes
      FROM workouts
      WHERE id = ? AND user_id = ?
      LIMIT 1
      `,
      [workoutId, userId]
    );

    if (rows.length === 0) {
      // Not found or not owned by this user.
      return res.status(404).render('error_404');
    }

    const workoutRow = rows[0];

    const [workoutTypes] = await pool.query(
      'SELECT id, name FROM workout_types ORDER BY name ASC'
    );

    const workoutForForm = {
      id: workoutRow.id,
      workout_date: formatDate(workoutRow.workout_date),
      workout_type_id: String(workoutRow.workout_type_id),
      duration_minutes: workoutRow.duration_minutes,
      intensity: workoutRow.intensity,
      notes: workoutRow.notes || ''
    };

    res.render('workouts/form', {
      pageTitle: 'Edit Workout',
      formTitle: 'Edit Workout',
      formAction: `/workouts/${workoutId}/edit`,
      workoutTypes,
      workout: workoutForForm,
      errors: {}
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error_500');
  }
});

/**
 * Validate and update an existing workout.
 */
router.post(
  '/:id/edit',
  requireLogin,
  [
    body('workout_date')
      .trim()
      .notEmpty()
      .withMessage('Please enter a date.'),
    body('workout_type_id')
      .trim()
      .notEmpty()
      .withMessage('Please select a workout type.'),
    body('duration_minutes')
      .trim()
      .notEmpty()
      .withMessage('Please enter a duration.')
      .isInt({ min: 1 })
      .withMessage('Duration must be a positive number of minutes.'),
    body('intensity')
      .trim()
      .isIn(['low', 'medium', 'high'])
      .withMessage('Please choose a valid intensity.')
  ],
  async (req, res) => {
    const userId = req.session.user.id;
    const workoutId = req.params.id;
    const errors = validationResult(req);
    const { workout_date, workout_type_id, duration_minutes, intensity, notes } =
      req.body;

    const workoutForForm = {
      id: workoutId,
      workout_date,
      workout_type_id,
      duration_minutes,
      intensity: intensity || 'medium',
      notes
    };

    try {
      const [workoutTypes] = await pool.query(
        'SELECT id, name FROM workout_types ORDER BY name ASC'
      );

      if (!errors.isEmpty()) {
        return res.status(422).render('workouts/form', {
          pageTitle: 'Edit Workout',
          formTitle: 'Edit Workout',
          formAction: `/workouts/${workoutId}/edit`,
          workoutTypes,
          workout: workoutForForm,
          errors: errors.mapped()
        });
      }

      const [result] = await pool.query(
        `
        UPDATE workouts
        SET workout_date = ?,
            workout_type_id = ?,
            duration_minutes = ?,
            intensity = ?,
            notes = ?
        WHERE id = ? AND user_id = ?
        `,
        [
          workout_date,
          workout_type_id,
          duration_minutes,
          intensity,
          notes || null,
          workoutId,
          userId
        ]
      );

      if (result.affectedRows === 0) {
        // The row was not updated, likely because it does not exist or is not owned.
        return res.status(404).render('error_404');
      }

      req.flash('success', 'Workout updated successfully.');
      res.redirect('../../workouts');
    } catch (err) {
      console.error(err);
      res.status(500).render('error_500');
    }
  }
);

/**
 * Delete a workout for the current user.
 */
router.post('/:id/delete', requireLogin, async (req, res) => {
  const userId = req.session.user.id;
  const workoutId = req.params.id;

  try {
    const [result] = await pool.query(
      'DELETE FROM workouts WHERE id = ? AND user_id = ?',
      [workoutId, userId]
    );

    if (result.affectedRows > 0) {
      req.flash('success', 'Workout deleted.');
    } else {
      req.flash('error', 'Workout not found or not authorised.');
    }

    res.redirect('../../workouts');
  } catch (err) {
    console.error(err);
    res.status(500).render('error_500');
  }
});

module.exports = router;
