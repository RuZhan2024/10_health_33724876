/**
 * Ensure the user is logged in before accessing a route.
 * If not logged in, redirect to the login page with a flash message.
 */
function requireLogin(req, res, next) {
  if (!req.session || !req.session.user) {
    req.flash('error', 'You must be logged in to view that page.');
    return res.redirect('/auth/login');
  }
  next();
}

/**
 * Ensure the user is both logged in and has admin role.
 * Non-admin users get a 403 error page.
 */
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

/**
 * Attach common values to res.locals so templates can use them easily.
 * This includes the current user and any flash messages.
 */
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
