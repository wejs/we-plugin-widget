/**
 * Plugin.js file, set configs, routes, hooks and events here
 *
 * see http://wejs.org/docs/we/plugin
 */
const fs = require('fs');

module.exports = function loadPlugin(projectPath, Plugin) {
  const plugin = new Plugin(__dirname);

  plugin.setConfigs({
    permissions: {
      'manage_widget': {
        'group': 'admin',
        'title': 'Manage widget',
        'description': 'Create, update and delete widgets'
      },
      'create_context_widget': {
        'group': 'admin',
        'title': 'Create global widgets',
        'description': 'Create, update and delete widgets in context'
      }
    }
  });

  plugin.setRoutes({
    'get /api/v1/widget-form/:theme/:layout/:type': {
      'controller'    : 'widget',
      'action'        : 'getCreateForm',
      'model'         : 'widget',
      'permission'    : true
    },
  });

  // widget type instances
  plugin.widgetTypes = {};
  // widgets lists with widget folder
  plugin.widgets = {};

  /**
   * Get default widget query.
   *
   * @return {Object}     Query object to use in sequelize.findAll
   */
  plugin.getDefaultWidgetQuery = function getDefaultWidgetQuery(req, res) {
    let regions = null;
    const theme = res.getTheme();

    if (theme) {
      if (!res.locals.layoutName || !theme.layouts[res.locals.layoutName])
        res.locals.layoutName  = 'default';

      regions = Object.keys(theme.layouts[res.locals.layoutName].regions);
    }

    let path = req.path;

    // remove last slash from internal paths
    if (path.length > 1 && path.substr(-1) == '/') {
      path = path.slice(0, -1);
    }

    return {
      theme: { $or: [ res.locals.theme, null, ''] },
      layout: res.locals.layoutName,
      regionName: regions,
      context: res.locals.widgetContext || null,
      // path

      path: { $or: [ path, null, '' ]},
      // widget visibility conditions
      $or: [
        // current session (model)
        {
          $and: [
            { modelName: res.locals.model || null },
            { modelId: null },
          ]
        },
        // global
        {
          $and: [
            { modelName: null },
            { modelId: null },
          ]
        },
        // current record
        {
          $and: [
            { modelName: res.locals.model || null },
            { modelId: res.locals.id || null },
          ]
        },
        // contents of this sesison
        {
          $and: [
            { modelName: res.locals.model || null },
            { modelId: null },
            { inRecord: true },
          ]
        }
      ]
    };
  };

  /**
   * Load widgets from folder server/widgets
   *
   * @param  {Object}   we
   * @param  {Function} cb callback
   */
  plugin.loadWidgets = function loadWidgets(data, cb) {
    let name, file;
    const we = data.we;
    const pi = data.plugin;

    var widgetsPath = pi.pluginPath + '/server/widgets';

    fs.readdir(widgetsPath, (err, list)=> {
      if (err) {
        if (err.code === 'ENOENT') return cb();
        return cb(err);
      }

      for (let i = 0; i < list.length; i++) {
        name = list[i];
        file = widgetsPath +'/'+name;

        plugin.widgets[name] = file;

        plugin.widgetTypes[name] = require(plugin.widgets[name])(
          we.projectPath, plugin.Widget
        );
      }
      cb();
    });
  }

  plugin.hooks.on('request:view:after:resolve:layout', function (data, done) {
    const theme = data.res.getTheme();
    if (!theme) return done();

    const req = data.req;
    const res = data.res;
    const we = req.we;

    const regions = Object.keys(theme.layouts[res.locals.layoutName].regions);
    for (let i = 0; i < regions.length; i++) {
      res.locals.regions[regions[i]] = { widgets: [] };
    }

    let where = plugin.getDefaultWidgetQuery(req, res);

    if (res.locals.action != 'findOne') {
      where.inRecord = { $or: [false , null] };
    }

    // preload all widgets for this response
    return we.db.models.widget.findAll({
      where: where,
      order: [
        ['weight', 'ASC'], ['createdAt', 'DESC']
      ],
    })
    .then(function afterFindAllWidgets(widgets) {
      we.utils.async.each(widgets, (widget, nextW)=> {
        // set widget
        res.locals.regions[widget.regionName].widgets.push(widget);
        // run view middleware for load widget view data
        we.log.verbose('widget.viewMiddleware:', widget.id, widget.type);
        widget.viewMiddleware(req, res, nextW);
      }, done);
      return null;
    })
    .catch(done);
  });

  plugin.hooks.on('we:before:load:plugin:features', function (we, done) {
    plugin.Widget = require('./lib/Widget')(we);
    done();
  });

  plugin.hooks.on('plugin:load:features', plugin.loadWidgets);

  // bind update widget middleware
  plugin.events.on('router:add:acl:middleware', function (data) {
    data.middlewares.push(require('./lib/updateWidgetMiddleware'));
  });

  plugin.addJs('we-plugin-widget', {
    weight: 11,
    pluginName: 'we-plugin-widget',
    path: 'files/public/we-plugin-widget.js'
  });

  plugin.addCss('we-plugin-widget', {
    weight: 11,
    pluginName: 'we-plugin-widget',
    path: 'files/public/we-plugin-widget.css'
  });

  return plugin;
};
