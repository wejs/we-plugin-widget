const actions = require('./actions');

module.exports = function updateWidgetMiddleware(req, res, next) {
  if (!req.isWidgetAction) return next();

  // redirect to widget controller if headers['we-widget-action'] is set:

  // check permisison
  //
  if (res.locals.widgetContext) {
    if(!req.we.acl.canStatic('create_context_widget', req.userRoleNames)) {
      return res.forbidden();
    }
  } else {
    if(!req.we.acl.canStatic('manage_widget', req.userRoleNames)) {
      return res.forbidden();
    }
  }

  if (actions[req.headers['we-widget-action']]) {
    actions[req.headers['we-widget-action']](req, res, next);
  } else {
    res.badRequest();
  }
};