/**
 * We.js messenger plugin config
 */

module.exports = function loadPlugin(projectPath, Plugin) {
  var plugin = new Plugin(__dirname);

  // set plugin configs
  plugin.setConfigs({
    permissions: {
      'use_messenger': {
        'title': 'Use the messenger',
        'description': 'Use we.js messenger'
      }
    }
  });

  plugin.setResource({ name: 'room' });

  plugin.setResource({ name: 'message', parent: 'room' });

  // ser plugin routes
  plugin.setRoutes({
    'post /room/:roomId([0-9]+)/member/:userId([0-9]+)/invite': {
      controller    : 'room',
      action        : 'inviteMember',
      model         : 'room',
      responseType  : 'json',
      permission    : true
    },
    'post /room/:roomId([0-9]+)/member/accept': {
      controller    : 'room',
      action        : 'acceptMembership',
      model         : 'room',
      responseType  : 'json',
      permission    : true
    },
    'post /room/:roomId([0-9]+)/member/:userId([0-9]+)/remove': {
      controller    : 'room',
      action        : 'removeMember',
      model         : 'room',
      responseType  : 'json',
      permission    : true
    },
    'post /room/:roomId([0-9]+)/member/leave': {
      controller    : 'room',
      action        : 'leave',
      model         : 'room',
      responseType  : 'json',
      permission    : true
    },

    'get /room/:roomId([0-9]+)/member': {
      controller    : 'room',
      action        : 'findMembers',
      model         : 'user',
      responseType  : 'json',
      permission    : true
    },

    // Send a message to show writing status
    // 'post /messenger/user/writing': {
    //   controller    : 'message',
    //   action        : 'emitIamWriting',
    //   model         : 'message',
    //   responseType  : 'json',
    //   loadRecord    :  true,
    //   permission    : 'use_messenger'
    // },
    'get /widget/messenger/private/:id([0-9]+)': {
      controller    : 'message',
      model         : 'user',
      action        : 'contactBoxIframe',
      loadRecord    :  true,
      permission    : 'use_messenger'
    },
    'get /widget/messenger/list': {
      controller    : 'message',
      action        : 'contactListIframe',
      permission    : 'use_messenger',
      responseType  : 'modal'
    },

    'get /widget/room/:id([0-9]+)': {
      controller    : 'room',
      model         : 'room',
      action        : 'roomIframe',
      loadRecord    :  true,
      permission    : 'find_room'
    },

    'get /widget/room-public': {
      controller    : 'room',
      model         : 'room',
      action        : 'roomIframe',
      permission    : true
    }
  });

  plugin.events.on('we:after:load:socket.io', require('./lib/we-after-load-socket.io'));

  return plugin;
};