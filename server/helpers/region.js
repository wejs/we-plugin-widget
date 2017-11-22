/**
 * Widget region helper
 *
 * usage:  {{#region 'name'}} {{/region}}
 */
module.exports = function(we) {
  return function renderWidgetBlock(name, options) {
    if (!options.data.root.regions || !options.data.root.regions[name]) return '';

    let widgetsHtml = '';
    let widget;

    for (let i = 0; i < options.data.root.regions[name].widgets.length; i++) {
      widget = options.data.root.regions[name].widgets[i];

      if (!we.plugins['we-plugin-widget'].widgetTypes[widget.type]) {
        we.log.warn('Widget type not found in renderWidgetBlock for widget.id: ' + widget.id, widget.type);
        continue;
      }

      widgetsHtml += we.plugins['we-plugin-widget'].widgetTypes[widget.type]
      .render({
        widget: widget,
        locals: options.data.root
      },options.data.root.theme);
    }

    return we.view.renderTemplate('region', options.data.root.theme, {
      name: name,
      attrs: options.hash,
      widgets: widgetsHtml
    });
  }
}