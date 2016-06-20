# We.js widget plugin

[![npm version](https://badge.fury.io/js/we-plugin-widget.svg)](https://badge.fury.io/js/we-plugin-widget) [![Build Status](https://travis-ci.org/wejs/we-plugin-widget.svg?branch=master)](https://travis-ci.org/wejs/we-plugin-widget) [![Coverage Status](https://coveralls.io/repos/github/wejs/we-plugin-widget/badge.svg?branch=master)](https://coveralls.io/github/wejs/we-plugin-widget?branch=master)

Add widget features with API in any we.js project

Widgets are dynamic blocks how may be added in any url (layout) with regions

## Installation

```sh
ẁe i we-plugin-widget
```

## API

### Add / create one widget

```js
  $.ajax({
    headers: { 'we-widget-action': 'add' },
    url: location.pathname,
    method: 'POST',
    data: {
      widget: JSON.stringify(formData)`// new widget data`
    }
  }).then(function (html) {
    console.log('new widget html:',html);
  });
```

### getCreateForm

```js
  $.ajax({
    headers: { 'we-widget-action': 'getCreateForm' },
    url: location.pathname,
    method: 'POST'
  }).then(function (r) {
    console.log('html form:',r);
  });
```

### getUpdateForm

```js
  $.ajax({
    headers: { 'we-widget-action': 'getUpdateForm' },
    url: url,
    method: 'POST',
    data: {
      widget: JSON.stringify({ id: id }) // required
    }
  }).then(function (f) {
    console.log('html form:',r);
  });
```

### update

```js
  $.ajax({
    headers: { 'we-widget-action': 'update' },
    url: url+'?responseType=json',
    method: 'POST',
    data: {
      widget: JSON.stringify(formData) // data to update with widgetId
    }
  }).then(function (r) {
    console.log('updated widget data:',r);
  });
```

### delete
```js
    $.ajax({
      headers: { 'we-widget-action': 'delete' },
      url: location.pathname+'?responseType=json',
      method: 'POST',
      data: {
        widgetId: id
      }
    }).then(function (r) {
       console.log('deleted widget:', r);
    });
```

### findOne

```js
    $.ajax({
      headers: { 'we-widget-action': 'findOne' },
      url: location.pathname+'?responseType=json',
      method: 'POST',
      data: {
         widget: JSON.stringify({ id: 131231})
      }
    }).then(function (r) {
       console.log('Widget:', r.widget);
    });
```

### find

```js
    $.ajax({
      headers: { 'we-widget-action': 'find' },
      url: location.pathname+'?responseType=json',
      method: 'POST'
    }).then(function (r) {
       console.log('Widgets:', r);
    });
```

### getWidgetsToSort , get widget sort form

```js
  $.ajax({
    headers: { 'we-widget-action': 'getWidgetsToSort' },
    url: url+'?responseType=modal&skipHTML=true',
    method: 'POST',
    data: {
      params: JSON.stringify({
        regionName: regionName
      })
    }
  }).then(function (f) {
    console.log('html>', f);
  });
```

### updateSort

```js
    $.ajax({
      headers: { 'we-widget-action': 'updateSort' },
      url: location.pathname+'?responseType=json',
      method: 'POST',
      data: {
        params: JSON.stringify({
          regionName: regionName,
          layout: $('#we-layout').attr('data-we-layout') // layout name
        }),
        widgets: JSON.stringify(widgets)
      }
    }).then(function(r){
        console.log('updated widgets:', r.widget);
    })
```

### getWidgetTypes

```js
  $.ajax({
    headers: { 'we-widget-action': 'getWidgetTypes' },
    url: location.pathname,
    method: 'POST',
    data: {}
  }).then(function afterGetWidgetTypes(r) {
    console.log('widget types:', r);
  });
```


## Links

> * We.js site: http://wejs.org

## NPM Info:

[![NPM](https://nodei.co/npm/we-plugin-widget.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/we-plugin-widget/)

## License

Under [the MIT license](https://github.com/wejs/we/blob/master/LICENSE.md).