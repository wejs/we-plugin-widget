const actions = require('./actions');

module.exports = function updateWidgetMiddleware(req, res, next) {
  if (!req.isWidgetAction) return next();
  if (!req.headers) return res.badRequest('headers not found');

  // redirect to widget controller if headers['we-widget-action'] is set:

  // check permisison
  if (
    req.headers['we-widget-action'] &&
    req.headers['we-widget-action'] == 'findOne'
  ) {
    if(req.we.acl.canStatic('findOne_context_widget', req.userRoleNames)) {
      return actions[req.headers['we-widget-action']](req, res, next);
    }
  }

  if (
    req.headers['we-widget-action'] &&
    req.headers['we-widget-action'] == 'find'
  ) {
    if(req.we.acl.canStatic('find_context_widget', req.userRoleNames)) {
      return actions[req.headers['we-widget-action']](req, res, next);
    }
  }

  // create, update, sort and delete methods:
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