
module.exports = {
  add(req, res) {
    req.body = JSON.parse(req.body.widget);
    req.we.controllers.widget.create(req, res);
  },
  getCreateForm(req, res, next) {
    if (!res.locals.layoutName) res.locals.layoutName = 'default';

    req.body = JSON.parse(req.body.widget);
    req.params.id = req.body.id;
    req.we.controllers.widget.getForm(req, res, next);
  },

  getUpdateForm(req, res, next) {

    if (!res.locals.layoutName) res.locals.layoutName = 'default';

    req.body = JSON.parse(req.body.widget);
    req.params.id = req.body.id;
    req.we.controllers.widget.getForm(req, res, next);
  },

  update(req, res) {
    if (!res.locals.layoutName) res.locals.layoutName = 'default';

    req.body = JSON.parse(req.body.widget);
    req.widgetId = req.body.id;
    req.we.controllers.widget.edit(req, res);
  },
  delete(req, res) {
    req.method = 'POST';
    req.widget = { id: req.body.widgetId };

    return req.we.db.models.widget
    .findById(req.widget.id)
    .then( (w)=> {
      res.locals.data = w;
      req.we.controllers.widget.delete(req, res);
      return w;
    })
    .catch(res.queryError);
  },

  findOne(req, res, next) {
    req.widgetData = JSON.parse(req.body.widget);
    res.locals.id = req.widgetData.id;

    return req.we.db.models.widget
    .findOne({ where: { id: res.locals.id }})
    .then(function afterfindOneWidget (r) {
      if (!r) {
        res.notFound();
        return null;
      }

      res.locals.id = r.id;
      res.locals.data = r;
      req.we.controllers.widget.findOne(req, res, next);
      return r;
    })
    .catch(res.queryError);
  },

  find(req, res, next) {
    res.locals.model = 'widget';
    req.headers.accept = 'application/json';
    res.locals.query = {
      limit: 100,
      where: {}
    };

    if (req.query.regionName) {
      res.locals.query.where.regionName = req.query.regionName;
    }

    req.we.controllers.widget.find(req, res, next);
  },

  getWidgetsToSort(req, res, next) {
    if (req.body.params) req.params = JSON.parse(req.body.params);
    req.we.controllers.widget.sortWidgets(req, res, next);
  },

  updateSort(req, res, next) {
    req.body.widgets = JSON.parse(req.body.widgets);
    if (req.body.params) req.params = JSON.parse(req.body.params);

    res.locals.regionName = req.params.regionName;

    req.method = 'POST';
    req.we.controllers.widget.sortWidgets(req, res, next);
  },

  getWidgetTypes(req, res, next) {
    req.method = 'GET'; // pipe to get method
    req.we.controllers.widget.getSelectWidgetTypes(req, res, next);
  }
}
