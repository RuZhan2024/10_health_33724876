const express = require('express');
const router = express.Router();

/**
 * Landing page for the app.
 * The template decides how to greet logged-in vs guest users.
 */
router.get('/', (req, res) => {
  res.render('home', {
    pageTitle: 'Welcome to the Health App'
  });
});

/**
 * Simple static page describing what the app does.
 */
router.get('/about', (req, res) => {
  res.render('about', {
    pageTitle: 'About this App'
  });
});

module.exports = router;
