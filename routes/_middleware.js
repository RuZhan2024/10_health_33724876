// routes/_middleware.js
function requireLogin(req, res, next) {
  if (!req.session.user) {
    req.session.flash = { type: 'error', message: 'Please log in first.' };
    return res.redirect('/login');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).render('error_403', { title: 'Forbidden' });
  }
  next();
}

module.exports = { requireLogin, requireAdmin };
