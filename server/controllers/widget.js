module.exports = {
  create(req, res) {
    res.locals.layout = false;
    if (req.user) req.body.creatorId = req.user.id;

    const type = req.body.type;

    // context is fixed based in current context
    req.body.context = res.locals.widgetContext;

    if (req.body.modelName != res.locals.model || (!req.body.modelName) ) {
      req.body.modelName = null;
    }

    if (req.body.modelId != res.locals.id || (!req.body.modelId) ) {
      req.body.modelId = null;
    }

    if (req.body.path != req.path || (!req.body.path) ) {
      req.body.path = null;
    }

    req.we.plugins['we-plugin-widget'].widgetTypes[type]
    .beforeSave(req, res, (err)=> {
      if (err) {
        res.queryError(err);
        return null;
      }

      req.we.db.models.widget
      .create(req.body)
      .then(function afterCreateWidget(record) {
        res.locals.model = 'widget';

        res.locals.template = record.type + '/wiew';
        // run view middleware for load widget view data
        record.viewMiddleware(req, res, ()=> {

          record.dataValues.html = req.we.plugins['we-plugin-widget'].widgetTypes[record.type]
          .render({
            locals: res.locals,
            widget: record
          }, res.locals.theme);

          if (req.accepts('html')) {
            return res.status(201).send(record.dataValues.html);
          } else {
            res.locals.data = record;
            return res.created();
          }
        });

        return null;
      })
      .catch(function onError(err) {
        res.locals.model = 'widget';
        res.queryError(err);
        return null;
      });
    });
  },
  /**
   * Update multiple widgets weight attribute
   *
   * @param  {object}   req  express.js request
   * @param  {object}   res  express.js response
   * @param  {Function} next callback
   */
  sortWidgets(req, res) {
    const we = req.we;

    res.locals.regionName = req.params.regionName;
    // get where to only update records in this context
    const where = we.plugins['we-plugin-widget']
      .getDefaultWidgetQuery(req, res);

    where.regionName = req.params.regionName;

    if (req.method == 'POST') {
      if (!req.body.widgets)
        return res.badRequest('widgets body params is required');

      let weights = 0;

      we.utils.async.eachSeries(req.body.widgets, (w, next)=> {
        // start in 1 for sorted widgets
        w.weight = weights;

        // only update weight field
        we.db.models.widget.update(w, {
          where: we.utils._.merge(where, {
            id: w.id
          }),
          fields: ['weight']
        })
        .then(function afterUpdate() {
          next();
          return null;
        })
        .catch(next);

        weights++;
      }, function afterUpdateAllWigets(err) {
        if (err) return res.serverError(err);
        we.controllers.widget.sortWidgetsList(req, res);
      });
    } else {
      we.controllers.widget.sortWidgetsList(req, res);
    }
  },
  /**
   * Widgets list getter for sort widgets
   *
   * @param  {object}   req  express.js request
   * @param  {object}   res  express.js response
   * @param  {Function} next callback
   */
  sortWidgetsList(req, res) {
    const we = req.we;

    const where =  we.plugins['we-plugin-widget'].getDefaultWidgetQuery(req, res);
    where.regionName = req.params.regionName;

    res.locals.model = 'widget';
    res.locals.template = 'widget/sortWidgets';

    we.db.models.widget
    .findAll({
      where: where,
      order: [ ['weight', 'ASC'], ['createdAt', 'DESC']]
    })
    .then( (widgets)=> {
      if (req.method == 'POST') {
        res.send({ widget: widgets });
      } else {
        res.locals.data = widgets;
        res.ok();
      }
    })
    .catch(res.queryError);
  },

  findOne(req, res, next) {
    const we = req.we;

    res.locals.model = 'widget';
    res.locals.layout = false;
    res.locals.regionName = req.params.regionName;

    if (!res.locals.data) return next();
    const record = res.locals.data;

    record.viewMiddleware(req, res, ()=> {
      res.locals.template = record.type + '/wiew';
      res.status(200);

      record.html = we.plugins['we-plugin-widget'].widgetTypes[record.type]
      .render({
        locals: res.locals,
        widget: record
      }, res.locals.theme);

      if (req.accepts('html')) {
        return res.send(record.dataValues.html);
      } else {
        res.locals.data = record;
        return res.ok();
      }
    });
  },

  find(req, res) {

    req.we.db.models.widget
    .findAndCountAll(res.locals.query)
    .then(function afterFind(result) {

      if (result && result.rows) {
        result.rows.forEach( (record)=> {
          record.dataValues.html =  req.we.plugins['we-plugin-widget'].widgetTypes[record.type].render({
            locals: res.locals,
            widget: record
          }, res.locals.theme);
        });

        res.locals.metadata.count = result.count;
        res.locals.data = result.rows;
      }

      res.ok();
      return null;
    })
    .catch(res.queryError);
  },

  /**
   * action to return widget options avaible for selection
   *
   * @param  {Object} req express.js request
   * @param  {Object} res express.js response
   */
  getSelectWidgetTypes(req, res) {
    const we = req.we;

    res.locals.widgetTypes = [];

    for (let type in we.plugins['we-plugin-widget'].widgetTypes) {
      if (we.plugins['we-plugin-widget'].widgetTypes[type].isAvaibleForSelection(req, res)) {
        res.locals.widgetTypes.push({
          type: type,
          label: req.__('widget.'+type+'.label'),
          description: req.__('widget.'+type+'.description')
        })
      }
    }
    // var html = we.view.renderTemplate('widget/selectWidgetTypeForm', res.locals.theme, res.locals);
    return res.send({ widget: res.locals.widgetTypes});
  },

  getCreateForm(req, res, next) {
    const we = req.we;

    if (
      !we.plugins['we-plugin-widget'].widgetTypes[req.params.type] ||
      !we.view.themes[req.params.theme]
    ) return next();

    const layoutToUpdate = we.view.themes[req.params.theme].layouts[req.params.layout];
    if (!layoutToUpdate) return next();

    we.plugins['we-plugin-widget'].widgetTypes[req.params.type]
    .formMiddleware(req, res, (err)=> {
      if (err) return res.serverError(err);

      res.locals.title = null;

      let context = false;

      if(res.locals.widgetContext) {
        context = res.locals.widgetContext;
      } else if (req.query.context) {
        context = req.query.context;
      }

      const widgetType = we.plugins['we-plugin-widget'].widgetTypes[req.params.type];

      res.locals.type = req.params.type;
      res.locals.layout = req.params.layout;
      res.locals.theme = req.params.theme;
      res.locals.regions = {};
      // optional params
      res.locals.context = req.query.context;
      res.locals.selectedRegion = req.query.regionName;

      res.locals.controllFields = '';

      res.locals.controllFields += widgetType.rederContextField(null, context, req, res);
      res.locals.controllFields += widgetType.renderVisibilityField(null, context, req, res);
      if (res.locals.type)
      res.locals.controllFields += '<input type="hidden" name="type" value="'+res.locals.type+'">';
      if (res.locals.layout)
        res.locals.controllFields += '<input type="hidden" name="layout" value="'+res.locals.layout+'">';
      if (res.locals.theme)
        res.locals.controllFields += '<input type="hidden" name="theme" value="'+res.locals.theme+'">';
      if (res.locals.context)
        res.locals.controllFields += '<input type="hidden" name="context" value="'+res.locals.context+'">';
      if (res.locals.selectedRegion)
        res.locals.controllFields += '<input type="hidden" name="regionName" value="'+res.locals.selectedRegion+'">';

      let html = we.plugins['we-plugin-widget'].widgetTypes[req.params.type].renderForm(res.locals, res.locals.theme);
      res.status(200);
      res.send(html);
      return null;
    });
  },

  /**
   * Get form to update
   */
  getForm(req, res, next) {
    const we = req.we;
    const id = req.params.id;

    res.locals.model = 'widget';

    we.db.models.widget
    .findOne({
      where: { id: id }
    })
    .then( (record)=> {
      if (!record) {
        next();
        return null;
      }

      res.status(200);

      let context = record.context || false;

      const widgetType = we.plugins['we-plugin-widget'].widgetTypes[record.type];

      widgetType.formMiddleware(req, res, (err)=> {
        if (err) return res.serverError(err);

        const widget = record.toJSON();

        widget.regions = {};

        res.locals.selectedRegion = widget.regionName;

        we.utils._.merge(res.locals, widget);

        res.locals.controllFields = '';

        res.locals.controllFields += widgetType.rederContextField(record, context, req, res);
        res.locals.controllFields += widgetType.renderVisibilityField(record, context, req, res);

        if (record.type)
          res.locals.controllFields += '<input type="hidden" name="type" value="'+record.type+'">';
        if (record.layout)
          res.locals.controllFields += '<input type="hidden" name="layout" value="'+record.layout+'">';
        if (record.theme)
          res.locals.controllFields += '<input type="hidden" name="theme" value="'+record.theme+'">';
        if (record.context)
          res.locals.controllFields += '<input type="hidden" name="context" value="'+record.context+'">';
        if (record.regionName)
          res.locals.controllFields += '<input type="hidden" name="regionName" value="'+record.regionName+'">';

        record.dataValues.html = we.plugins['we-plugin-widget'].widgetTypes[record.type]
        .renderForm(res.locals, res.locals.theme);

        if (req.accepts('html')) {
          res.send(record.dataValues.html);
        } else {
          res.locals.data = record;
          res.ok();
        }
      });
      return null;
    })
    .catch(res.queryError);
  },

  /**
   * Update one widget action
   */
  edit(req, res) {
    const we = req.we;
    let id = req.widgetId || res.locals.id;

    // never update widget context
    delete req.body.context;

    if (req.body.modelName != res.locals.model || (!req.body.modelName) ) {
      req.body.modelName = null;
    }

    if (req.body.path != req.path || (!req.body.path) ) {
      req.body.path = null;
    }

    // remove layout for this response
    res.locals.layout = false;
    res.locals.model = 'widget';

    // check if the widget exists
    we.db.models.widget
    .findOne({
      where: { id: id }
    })
    .then( (record)=> {
      if (!record) {
        res.notFound();
        return null;
      }

      const type = record.type;
      we.plugins['we-plugin-widget'].widgetTypes[type].beforeSave(req, res, (err)=> {
        if (err) return res.queryError(err);
        // update in db
        record.updateAttributes(req.body)
        .then( ()=> {

          res.locals.model = 'widget';

          res.locals.template = record.type + '/wiew';
          res.status(200);
          // run view middleware for load widget view data
          record.viewMiddleware(req, res, ()=> {
            record.dataValues.html = we.plugins['we-plugin-widget'].widgetTypes[record.type]
            .render({
              locals: res.locals,
              widget: record
            }, res.locals.theme);

            if (req.accepts('html')) {
              return res.send(record.dataValues.html);
            } else {
              res.locals.data = record;
              return res.ok();
            }
          });

          return null;
        });
      });

      return null;
    });
  },

  delete(req, res) {
    req.headers.accept = 'application/json';

    const record = res.locals.data;
    if (!record) return res.notFound();

    res.locals.deleteMsg = res.locals.model+'.delete.confirm.msg';

    record.destroy()
    .then(function afterDestroy() {
      res.locals.deleted = true;
      res.deleted();
      return null;
    })
    .catch(res.queryError);
  }
};
