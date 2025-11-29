// routes/auth.js
const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/login', (req, res) => {
  res.render('login', { title: 'Login', errors: [], values: {} });
});

router.post('/login', async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.query(
      'SELECT id, username, password_hash, full_name, role FROM users WHERE username = ?',
      [username]
    );
    const user = rows[0];

    if (!user || user.password_hash !== password) {
      return res.status(401).render('login', {
        title: 'Login',
        errors: ['Invalid username or password'],
        values: { username },
      });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
    };

    req.session.flash = { type: 'success', message: 'Welcome back!' };
    res.redirect('/dashboard');
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;
