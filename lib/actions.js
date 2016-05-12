
module.exports = {
  add: function add(req, res) {
    req.body = JSON.parse(req.body.widget);
    req.we.controllers.widget.create(req, res);
  },
  getCreateForm: function getCreateForm(req, res, next) {
    if (!res.locals.layoutName) res.locals.layoutName = 'default';

    req.body = JSON.parse(req.body.widget);
    req.params.id = req.body.id;
    req.we.controllers.widget.getForm(req, res, next);
  },

  getUpdateForm: function getUpdateForm(req, res, next) {

    if (!res.locals.layoutName) res.locals.layoutName = 'default';

    req.body = JSON.parse(req.body.widget);
    req.params.id = req.body.id;
    req.we.controllers.widget.getForm(req, res, next);
  },

  update: function update(req, res) {
    if (!res.locals.layoutName) res.locals.layoutName = 'default';

    req.body = JSON.parse(req.body.widget);
    req.widgetId = req.body.id;
    req.we.controllers.widget.edit(req, res);
  },

  'delete': function deleteAc(req, res) {
    req.method = 'POST';
    req.widget = { id: req.body.widgetId };

    return req.we.db.models.widget.findById(req.widget.id)
    .then(function (w) {
      res.locals.data = w;
      req.we.controllers.widget.delete(req, res);
    }).catch(res.queryError);
  },

  findOne: function findOne(req, res, next) {
    req.widgetData = JSON.parse(req.body.widget);
    res.locals.id = req.widgetData.id;

    req.we.db.models.widget
    .findOne({ where: { id: res.locals.id }})
    .then(function afterfindOneWidget(r) {
      if (!r) return res.notFound();
      res.locals.id = r.id;
      res.locals.data = r;
      req.we.controllers.widget.findOne(req, res, next);
    }).catch(res.queryError);

  },

  find: function find(req, res, next) {
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

  getWidgetsToSort: function getWidgetsToSort(req, res, next) {
    if (req.body.params) req.params = JSON.parse(req.body.params);
    req.we.controllers.widget.sortWidgets(req, res, next);
  },

  updateSort: function updateSort(req, res, next) {
    req.body.widgets = JSON.parse(req.body.widgets);
    if (req.body.params) req.params = JSON.parse(req.body.params);

    res.locals.regionName = req.params.regionName;

    req.method = 'POST';
    req.we.controllers.widget.sortWidgets(req, res, next);
  },

  getWidgetTypes: function getWidgetTypes(req, res, next) {
    req.method = 'GET'; // pipe to get method
    req.we.controllers.widget.getSelectWidgetTypes(req, res, next);
  }
}