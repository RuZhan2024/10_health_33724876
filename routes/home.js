// routes/home.js
const express = require('express');
const router = express.Router();

/**
 * GET /
 * Landing page – different message for guests vs logged-in users.
 */
router.get('/', (req, res) => {
  res.render('home', {
    pageTitle: 'Welcome to the Health App'
  });
});

/**
 * GET /about
 */
router.get('/about', (req, res) => {
  res.render('about', {
    pageTitle: 'About this App'
  });
});

module.exports = router;
