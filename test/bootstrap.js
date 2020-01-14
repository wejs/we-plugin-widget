const projectPath = process.cwd(),
  testTools = require('we-test-tools'),
  path = require('path');

let we;

before(function(callback) {
  this.slow(100);

  testTools.copyLocalSQLiteConfigIfNotExists(projectPath, function() {
    const We = require('we-core');
    we = new We();

    testTools.init({}, we);

    we.bootstrap({
      i18n: {
        directory: path.join(__dirname, 'locales'),
        updateFiles: true
      },
      themes: {
        enabled: ['we-theme-site-wejs'],
        app: 'we-theme-site-wejs'
      }
    }, function(err, we) {
      if (err) throw err;

      we.plugins['we-plugin-widget'] = we.plugins.project;

      callback();
    });
  });
});

before(function(callback) {
  we.startServer(function(err) {
    if (err) throw err;
    callback();
  });
})

//after all tests
after(function (callback) {
  we.exit(callback);
});

after(function () {
  process.exit();
});