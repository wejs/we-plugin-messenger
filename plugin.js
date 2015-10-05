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
      },
      'create_roommessage': {
        'title': 'Create roommessage',
        'description': 'Create one room message'
      }
    }
  });

  plugin.setResource({ name: 'message' });
  plugin.setResource({ name: 'room' });

  // ser plugin routes
  plugin.setRoutes({
    // 'get /messenger/start': {
    //   controller    : 'message',
    //   action        : 'start',
    //   model         : 'message',
    //   responseType  : 'json',
    //   permission    : 'use_messenger'
    // },
    // Return a list of messages between authenticated user and :uid user
    'get /messenger/messages/with-user/:uid?': {
      controller    : 'message',
      action        : 'messagesWithUser',
      model         : 'message',
      responseType  : 'json',
      permission    : 'use_messenger',
      loadRecord    :  true
    },
    // Return messages without toIds and roomIds
    'get /messenger/messages/public': {
      controller    : 'message',
      action        : 'getPublicMessages',
      model         : 'message',
      responseType  : 'json',
      loadRecord    :  true,
      permission    : 'use_messenger'
    },
    // Send a message to show writing status
    'post /messenger/user/writing': {
      controller    : 'message',
      action        : 'emitIamWriting',
      model         : 'message',
      responseType  : 'json',
      loadRecord    :  true,
      permission    : 'use_messenger'
    },
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
      responseType  : 'html',
    },

    // - roommessage
    'get /roommessage': {
      controller    : 'roommessage',
      action        : 'find',
      model         : 'roommessage',
      permission    : 'find_room'
    },
    'get /roommessage/:id([0-9]+)': {
      controller    : 'roommessage',
      model         : 'roommessage',
      action        : 'findOne',
      permission    : 'find_room'
    },
    'post /roommessage': {
      controller    : 'roommessage',
      action        : 'create',
      model         : 'roommessage',
      permission    : 'create_roommessage'
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