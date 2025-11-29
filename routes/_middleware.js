// _middleware.js

function requireLogin(req, res, next) {
  if (!req.session || !req.session.user) {
    req.flash('error', 'You must be logged in to view that page.');
    return res.redirect('/auth/login');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session || !req.session.user) {
    req.flash('error', 'You must be logged in to view that page.');
    return res.redirect('/auth/login');
  }
  if (req.session.user.role !== 'admin') {
    return res.status(403).render('error_403');
  }
  next();
}

function attachUserToLocals(req, res, next) {
  res.locals.currentUser = req.session ? req.session.user : null;
  res.locals.successMessages = req.flash('success');
  res.locals.errorMessages = req.flash('error');
  next();
}

module.exports = {
  requireLogin,
  requireAdmin,
  attachUserToLocals
};
