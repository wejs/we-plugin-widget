

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

  if (req.headers['we-widget-action'] == 'add') {

    req.body = JSON.parse(req.body.widget);
    return req.we.controllers.widget.create(req, res);

  } else if (req.headers['we-widget-action'] == 'getCreateForm') {

    if (!res.locals.layoutName) res.locals.layoutName = 'default';

    req.body = JSON.parse(req.body.widget);
    req.params.id = req.body.id;
    return req.we.controllers.widget.getForm(req, res, next);

  } else if (req.headers['we-widget-action'] == 'getUpdateForm') {

    if (!res.locals.layoutName) res.locals.layoutName = 'default';

    req.body = JSON.parse(req.body.widget);
    req.params.id = req.body.id;
    return req.we.controllers.widget.getForm(req, res, next);

  } else if (req.headers['we-widget-action'] == 'update') {

    if (!res.locals.layoutName) res.locals.layoutName = 'default';

    req.body = JSON.parse(req.body.widget);
    req.widgetId = req.body.id;
    return req.we.controllers.widget.edit(req, res);

  } else if (req.headers['we-widget-action'] == 'delete') {

    req.method = 'POST';
    req.widget = { id: req.body.widgetId };

    return req.we.db.models.widget.findById(req.widget.id)
    .then(function (w) {
      res.locals.data = w;
      req.we.controllers.widget.delete(req, res);
    }).catch(res.queryError);

  } else if (req.headers['we-widget-action'] == 'findOne') {

    req.widgetData = JSON.parse(req.body.widget);
    res.locals.id = req.widgetData.id;

    return req.we.db.models.widget
    .findOne({ where: { id: res.locals.id }})
    .then(function afterfindOneWidget(r) {
      if (!r) return res.notFound();
      res.locals.id = r.id;
      res.locals.data = r;
      return req.we.controllers.widget.findOne(req, res, next);
    }).catch(res.queryError);

  } else if (req.headers['we-widget-action'] == 'find') {

    res.locals.model = 'widget';
    req.headers.accept = 'application/json';
    res.locals.query = {
      limit: 100,
      where: {}
    };

    if (req.query.regionName) {
      res.locals.query.where.regionName = req.query.regionName;
    }

    return req.we.controllers.widget.find(req, res, next);

  } else if (req.headers['we-widget-action'] == 'getWidgetsToSort') {

    if (req.body.params) req.params = JSON.parse(req.body.params);
    return req.we.controllers.widget.sortWidgets(req, res);

  } else if (req.headers['we-widget-action'] == 'updateSort') {

    req.body.widgets = JSON.parse(req.body.widgets);
    if (req.body.params) req.params = JSON.parse(req.body.params);

    res.locals.regionName = req.params.regionName;

    req.method = 'POST';
    return req.we.controllers.widget.sortWidgets(req, res);

  } else if (req.headers['we-widget-action'] == 'getWidgetTypes') {

    req.method = 'GET'; // pipe to get method
    return req.we.controllers.widget.getSelectWidgetTypes(req, res);

  } else {
    return res.badRequest();
  }
};