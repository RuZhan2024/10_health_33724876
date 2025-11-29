// routes/auth.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const pool = require('../db');
const { requireLogin } = require('./_middleware');

const router = express.Router();

/**
 * GET /auth/register
 */
router.get('/register', (req, res) => {
  res.render('auth/register', {
    pageTitle: 'Register',
    errors: {},
    oldInput: { username: '', email: '' }
  });
});

/**
 * POST /auth/register
 */
router.post(
  '/register',
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('Username must be between 3 and 20 characters.')
      .matches(/^[A-Za-z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores.'),
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please enter a valid email address.')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long.'),
    body('confirm_password')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords do not match.');
        }
        return true;
      })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    const { username, email, password } = req.body;

    if (!errors.isEmpty()) {
      return res.status(422).render('auth/register', {
        pageTitle: 'Register',
        errors: errors.mapped(),
        oldInput: { username, email }
      });
    }

    try {
      // Check if username/email already exists
      const [existing] = await pool.query(
        'SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1',
        [username, email]
      );

      if (existing.length > 0) {
        return res.status(422).render('auth/register', {
          pageTitle: 'Register',
          errors: {
            username: { msg: 'Username or email already in use.' }
          },
          oldInput: { username, email }
        });
      }

      const hash = await bcrypt.hash(password, 10);

      await pool.query(
        'INSERT INTO users (username, email, password_hash, role, is_active) VALUES (?,?,?,?,1)',
        [username, email, hash, 'user']
      );

      req.flash('success', 'Registration successful. Please log in.');
      res.redirect('/auth/login');
    } catch (err) {
      console.error(err);
      res.status(500).render('error_500');
    }
  }
);

/**
 * GET /auth/login
 */
router.get('/login', (req, res) => {
  res.render('auth/login', {
    pageTitle: 'Login',
    errors: {},
    oldInput: { identifier: '' }
  });
});

/**
 * POST /auth/login
 */
router.post(
  '/login',
  [
    body('identifier')
      .trim()
      .notEmpty()
      .withMessage('Please enter your username or email.'),
    body('password')
      .notEmpty()
      .withMessage('Please enter your password.')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    const { identifier, password } = req.body;

    if (!errors.isEmpty()) {
      return res.status(422).render('auth/login', {
        pageTitle: 'Login',
        errors: errors.mapped(),
        oldInput: { identifier }
      });
    }

    let user = null;
    try {
      const [rows] = await pool.query(
        'SELECT * FROM users WHERE (username = ? OR email = ?) AND is_active = 1 LIMIT 1',
        [identifier, identifier]
      );

      if (rows.length > 0) {
        user = rows[0];
      }

      const ip = req.ip || null;
      const ua = req.get('User-Agent') || null;

      if (!user) {
        // Log failed attempt
        await pool.query(
          'INSERT INTO login_audit (user_id, username_attempt, success, ip_address, user_agent) VALUES (NULL, ?, 0, ?, ?)',
          [identifier, ip, ua]
        );

        return res.status(401).render('auth/login', {
          pageTitle: 'Login',
          errors: {
            identifier: { msg: 'Invalid username/email or password.' }
          },
          oldInput: { identifier }
        });
      }

      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) {
        await pool.query(
          'INSERT INTO login_audit (user_id, username_attempt, success, ip_address, user_agent) VALUES (?, ?, 0, ?, ?)',
          [user.id, identifier, ip, ua]
        );

        return res.status(401).render('auth/login', {
          pageTitle: 'Login',
          errors: {
            identifier: { msg: 'Invalid username/email or password.' }
          },
          oldInput: { identifier }
        });
      }

      // Successful login
      await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

      await pool.query(
        'INSERT INTO login_audit (user_id, username_attempt, success, ip_address, user_agent) VALUES (?, ?, 1, ?, ?)',
        [user.id, identifier, ip, ua]
      );

      req.session.user = {
        id: user.id,
        username: user.username,
        role: user.role
      };

      req.flash('success', 'You are now logged in.');
      res.redirect('/dashboard');
    } catch (err) {
      console.error(err);
      res.status(500).render('error_500');
    }
  }
);

/**
 * GET /auth/logout
 */
router.get('/logout', requireLogin, (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error(err);
      return res.status(500).render('error_500');
    }
    res.clearCookie('health_app_sid');
    req.flash('success', 'You have been logged out.');
    res.redirect('/');
  });
});

module.exports = router;
