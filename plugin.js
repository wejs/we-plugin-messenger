/**
 * We.js plugin config
 */


module.exports = function loadPlugin(projectPath, Plugin) {
  var plugin = new Plugin(__dirname);

  // plugin.setConfigs({

  // });


  console.log(plugin.events);
  return plugin;
};