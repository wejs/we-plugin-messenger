var projectPath = process.cwd();
var deleteDir = require('rimraf');
var testTools = require('we-test-tools');
var path = require('path');
var we;

before(function(callback) {
  this.slow(100);

  testTools.copyLocalConfigIfNotExitst(projectPath, function() {
    we = require('we-core');
    testTools.init({}, we);

    we.bootstrap({
      i18n: {
        directory: path.resolve(__dirname, '..', 'locales'),
        updateFiles: true
      }
    } , function(err, we) {
      if (err) throw err;

      we.startServer(function(err) {
        if (err) throw err;
        callback();
      })
    })
  })
})

//after all tests
after(function (callback) {
  we.db.defaultConnection.close();

  var tempFolders = [
    projectPath + '/files/tmp',
    projectPath + '/files/config',
    projectPath + '/files/sqlite',

    projectPath + '/files/public/min',

    projectPath + '/files/public/tpls.hbs.js',
    projectPath + '/files/public/admin.tpls.hbs.js',
    projectPath + '/files/public/project.css',
    projectPath + '/files/public/project.js',
    projectPath + '/config/local.js',
  ];

  we.utils.async.each(tempFolders, function(folder, next){
    deleteDir( folder, next);
  }, function(err) {
    if (err) throw new Error(err);
    callback();
  })

});