/**
 * Plugin.js file, set configs, routes, hooks and events here
 *
 * see http://wejs.org/docs/we/plugin
 */
var fs = require('fs');

module.exports = function loadPlugin(projectPath, Plugin) {
  var plugin = new Plugin(__dirname);

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
    var regions = null;
    var theme = res.getTheme();

    if (theme) {
      if (!res.locals.layoutName || !theme.layouts[res.locals.layoutName])
        res.locals.layoutName  = 'default';

      regions = Object.keys(theme.layouts[res.locals.layoutName].regions);
    }

    var path = req.path;

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
    var name, file;
    var we = data.we;
    var pi = data.plugin;

    var widgetsPath = pi.pluginPath + '/server/widgets';

    fs.readdir(widgetsPath , function (err, list) {
      if (err) {
        if (err.code === 'ENOENT') return cb();
        return cb(err);
      }

      for (var i = 0; i < list.length; i++) {
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
    var theme = data.res.getTheme();
    if (!theme) return done();

    var req = data.req;
    var res = data.res;
    var we = req.we;

    var regions = Object.keys(theme.layouts[res.locals.layoutName].regions);
    for (var i = 0; i < regions.length; i++) {
      res.locals.regions[regions[i]] = { widgets: [] };
    }

    var where =  plugin.getDefaultWidgetQuery(req, res);

    if (res.locals.action != 'findOne') {
      where.inRecord = { $or: [false , null] };
    }

    // preload all widgets for this response
    we.db.models.widget.findAll({
      where: where,
      order: [
        ['weight', 'ASC'], ['createdAt', 'DESC']
      ],
    }).then(function afterFindAllWidgets(widgets) {
      we.utils.async.each(widgets, function (widget, nextW) {
        // set widget
        res.locals.regions[widget.regionName].widgets.push(widget);
        // run view middleware for load widget view data
        we.log.verbose('widget.viewMiddleware:', widget.id, widget.type);
        widget.viewMiddleware(req, res, nextW);
      }, done);
      return null;
    }).catch(done);
  });

  plugin.hooks.on('we:before:load:plugin:features', function(we, done) {
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
