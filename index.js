// index.js
const path = require('path');
const express = require('express');
const session = require('express-session');

const homeRoutes = require('./routes/home');
const authRoutes = require('./routes/auth');
const workoutRoutes = require('./routes/workouts');
const metricRoutes = require('./routes/metrics');
const dashboardRoutes = require('./routes/dashboard');
const searchRoutes = require('./routes/search');
const adminRoutes = require('./routes/admin');

const app = express();

// view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: 'change-this-secret',
    resave: false,
    saveUninitialized: false,
  })
);

// expose user + flash to all views
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
});

// routes
app.use('/', homeRoutes);
app.use('/', authRoutes);
app.use('/workouts', workoutRoutes);
app.use('/metrics', metricRoutes);
app.use('/', dashboardRoutes);
app.use('/', searchRoutes);
app.use('/admin', adminRoutes);

// 404
app.use((req, res) => {
  res.status(404).render('error_404', { title: 'Page not found' });
});

// error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error_500', { title: 'Server error' });
});

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Guardian Health Tracker running on http://localhost:${PORT}`);
});
