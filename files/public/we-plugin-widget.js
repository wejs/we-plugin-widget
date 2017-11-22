(function (we) {

  if (we.config.widgetContext) {
    // add current page headers for ajax requests
    $.ajaxSetup({
      headers: {
        'wejs-context': this.config.widgetContext,
        'wejs-theme': this.config.theme
      }
    });
  }

  we.structure = {
    addWidgetModalFormId: '#AddWidgetFormModal',
    updateWidgetModalFormId: '#updateWidgetFormModal',
    sortWidgetModalFormId: '#sortWidgetFormModal',

    showLayoutEditor: function showLayoutEditor() {
      $('#we-layout-start-edit-btn').hide();
      $('#we-layout-stop-edit-btn').show();
      $('body').addClass('we-editing-layout');
    },
    hideLayoutEditor: function hideLayoutEditor() {
      $('#we-layout-start-edit-btn').show();
      $('#we-layout-stop-edit-btn').hide();
      $('body').removeClass('we-editing-layout');
    },
    regions: {},

    newWidgetObj: {},
    setForDataValuesWithVisibility: function(formData) {
      switch(formData.visibility) {
        case 'in-page':
          if (we.config.modelName && we.config.modelId) {
            formData.modelName = we.config.modelName;
            formData.modelId = we.config.modelId;
          } else {
            formData.path = location.pathname;
          }
          break;
        case 'in-session':
          formData.modelName = we.config.modelName;
          formData.modelId = null;
          break;
        case 'in-session-record':
          formData.modelName = we.config.modelName;
          formData.modelId = null;
          formData.inRecord = true;
          break;
        default:
          formData.modelName = null;
          formData.modelId = null;
      }
    },
    openAddWidgetForm: function openAddWidgetForm(regionName) {
      var modal = $(we.structure.addWidgetModalFormId);
      if (!modal) throw new Error('Add widget modal not found!', we.structure.addWidgetModalFormId);

      this.newWidgetObj = {
        theme: we.config.theme,
        layout: $('#we-layout').attr('data-we-layout'),
        type: '',
        regionName: regionName,
        context: $('#we-layout').attr('data-we-widgetcontext')
      };

      $.ajax({
        headers: { 'we-widget-action': 'getWidgetTypes' },
        url: location.pathname,
        method: 'POST',
        data: {}
      }).then(function afterGetWidgetTypes(r) {
        $('#AddWidgetFormModal-select-type').select2({
          data: r.widget.map(function (w){
            return {
              id : w.type,
              text: w.label+' ('+w.type+')'
            };
          })
        });
      });

      modal.find('.steps-body .step1').show();
      modal.find('.steps-body .step2').hide();

      modal.modal('show');
    },
    goToStep1: function goToStep1() {
      var modal = $(we.structure.addWidgetModalFormId);
      modal.find('.steps-body .step1').show();
    },
    goToStep2: function goToStep2() {
      var self = this;

      var modal = $(we.structure.addWidgetModalFormId);
      var regionWidgetsTag = $('#region-'+ this.newWidgetObj.regionName +'-widgets');

      this.newWidgetObj.type = $('#AddWidgetFormModal-select-type').val();
      // type is required for step 2
      if (!this.newWidgetObj.type) return;

      modal.find('.steps-body .step1').hide();
      modal.find('.steps-body .step2').show();

      var url = '/api/v1/widget-form/'+this.newWidgetObj.theme;
      url += '/' + this.newWidgetObj.layout;
      url += '/' + this.newWidgetObj.type;
      url += '?regionName=' + this.newWidgetObj.regionName;

      if (we.config.widgetContext)
        url += '&context=' + we.config.widgetContext;

      $.get(url).then(function (f) {
        modal.find('.steps-body .step2').html(f);
        modal.modal('show');

        modal.find('form').submit(function( event ) {
          event.preventDefault();
          var formData = {};

          modal.find('form').serializeArray().forEach(function (d) {
            formData[d.name] = d.value;
          });

          we.structure.setForDataValuesWithVisibility(formData);

          formData.theme = self.newWidgetObj.theme;
          formData.regionName = self.newWidgetObj.regionName;
          formData.context = we.config.widgetContext;

          $.ajax({
            headers: {
              'we-widget-action': 'add'
            },
            url: location.pathname,
            method: 'POST',
            data: {
              widget: JSON.stringify(formData)
            }
          }).then(function (html) {
            // insert after regions actions
            regionWidgetsTag.prepend(html);
          }).always(function() {
            modal.modal('hide');
          });
        });
      });
    },
    updateWidget: function updateWidget(id) {
      var modalForm = $(this.updateWidgetModalFormId);

      if (!id) return console.warn('data-id attribute is required for updateWidget');

      var widgetTag = $('#widget-'+id);
      modalForm.modal('show');

      var url = location.pathname;

      $.ajax({
        headers: { 'we-widget-action': 'getUpdateForm' },
        url: url,
        method: 'POST',
        data: {
          widget: JSON.stringify({ id: id })
        }
      }).then(function (f) {
        modalForm.find('.modal-body').html(f);

        modalForm.find('form').submit(function( event ) {
          event.preventDefault();
          var formData = { id: id };

          modalForm.find('form').serializeArray().forEach(function (d) {
            formData[d.name] = d.value;
          });

          we.structure.setForDataValuesWithVisibility(formData);

          $.ajax({
            headers: { 'we-widget-action': 'update' },
            url: url,
            method: 'POST',
            data: {
              widget: JSON.stringify(formData)
            }
          }).then(function (html) {
            widgetTag.after(html);
            widgetTag.remove();
          }).always(function(){
            modalForm.modal('hide');
          });
        });
      });
    },
    deleteWidget: function deleteWidget(id) {
      if (!id) return console.warn('data-id attribute is required for deleteWidget');

      if (confirm(we.config.structure.deleteWidgetConfirm)) {
        $.ajax({
          headers: { 'we-widget-action': 'delete' },
          url: location.pathname+'?responseType=json',
          method: 'POST',
          data: {
            widgetId: id
          }
        }).then(function (r) {
          we.events.emit('model-update-after', 'widget', r);
          $('#widget-'+id).remove();
        });
      }
    },

    sortRegionWidgetsForm: function sortRegionWidgetsForm(regionName) {
      var modal = $(we.structure.sortWidgetModalFormId);
      if (!modal) throw new Error('sort widget modal not found!', we.structure.sortWidgetModalFormId);
     modal.modal('show');

      var url = location.pathname;

      $.ajax({
        headers: { 'we-widget-action': 'getWidgetsToSort' },
        url: url+'?contentOnly=true&skipHTML=true',
        method: 'POST',
        data: {
          params: JSON.stringify({
            regionName: regionName
          })
        }
      }).then(function (f) {
        modal.find('.modal-body').html(f);
      });
    }
  };

  we.admin.layouts = {
    widgetTableSorter: function widgetTableSorter (selector, regionName) {
      if (!selector) selector = '.sorted_table > tbody';

      var sortableList = $(selector);
      // Sortable rows
      sortableList.sortable({
        update: function updateSort() {
          saveOrder(this);
        }
      });
      function saveOrder(tbody) {
        var widgets = [];
        var list = $(tbody).children('tr');

        for (var i = 0; i < list.length; i++) {
          widgets.push({
            id: $(list[i]).attr('model-id'), weight: i
          });

          $(list[i]).attr('data-weight', i);
        }

        $.ajax({
          headers: { 'we-widget-action': 'updateSort' },
          url: location.pathname+'?responseType=json',
          method: 'POST',
          // dataType: 'json',
          // contentType: 'application/json; charset=utf-8',
          data: {
            params: JSON.stringify({
              regionName: regionName,
              layout: $('#we-layout').attr('data-we-layout')
            }),
            widgets: JSON.stringify(widgets)
          }
        }).done(function (r) {
          var region = $('#region-'+regionName);
          var widget;
          var lastWidget = null;
          for (var i = 0; i < r.widget.length; i++) {
            widget = region.find('#widget-'+r.widget[i].id);
            if (lastWidget) {
              widget.insertAfter(lastWidget);
            } else {
              region.find('widgets').prepend(widget);
            }
            lastWidget = widget;
          }
        });
      }
    }
  };

})(window.we);