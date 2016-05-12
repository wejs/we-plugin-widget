var assert = require('assert');
var helpers = require('we-test-tools').helpers;
var sinon = require('sinon');
var we, moment;

describe('coreHelpers', function () {

  before(function (done) {
    we = helpers.getWe();
    moment = we.utils.moment;
    done();
  });

  describe('regionHelper', function () {
    var helper;

    before(function (done) {
      helper = require('../../../server/helpers/region.js')(we);
      done();
    });
    it('regionHelper should render region template html', function (done) {
      // set spy to check if renderTemplate is called
      sinon.spy(we.view, 'renderTemplate');

      var text = helper.bind({
        context: 'ctx'
      })('default', {
        data: {
          root: { regions: { default: { widgets: [] } } }
        }
      });
      assert(text);
      assert(we.view.renderTemplate.called);
      // then remove the spy
      we.view.renderTemplate.restore();
      done();
    });
  });
});