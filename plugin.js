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
      'find_room': {
        'title': 'Find room',
        'description': 'Find and findAll rooms'
      },
      'create_room': {
        'title': 'Create room',
        'description': 'Create one room'
      },
      'update_room': {
        'title': 'Update room',
        'description': 'Update one room'
      },
      'delete_room': {
        'title': 'Delete room',
        'description': 'Delete one room'
      },
      'create_roommessage': {
        'title': 'Create roommessage',
        'description': 'Create one room message'
      }
    }
  });
  // ser plugin routes
  plugin.setRoutes({
    // 'get /messenger/start': {
    //   controller    : 'message',
    //   action        : 'start',
    //   model         : 'message',
    //   responseType  : 'json',
    //   permission    : 'use_messenger'
    // },
    'get /message': {
      controller    : 'message',
      action        : 'find',
      model: 'message',
      responseType  : 'json',
      permission    : 'use_messenger'
    },
    'put /message/:id': {
      controller    : 'message',
      action        : 'update',
      model: 'message',
      responseType  : 'json',
      permission    : 'use_messenger'
    },
    'get /message/:id': {
      controller    : 'message',
      action        : 'findOne',
      model: 'message',
      responseType  : 'json',
      permission    : 'use_messenger'
    },
    'post /message': {
      controller    : 'message',
      action        : 'createRecord',
      model         : 'message',
      responseType  : 'json',
      permission    : 'use_messenger'
    },
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
    'get /widget/messenger/:id([0-9]+)': {
      controller    : 'message',
      model         : 'user',
      action        : 'contactBoxIframe',
      loadRecord    :  true,
      permission    : 'use_messenger'
    },

    // -- ROOM
    'get /room': {
      controller    : 'room',
      action        : 'find',
      model         : 'room',
      permission    : 'find_room'
    },
    'get /room/:id([0-9]+)': {
      controller    : 'room',
      model         : 'room',
      action        : 'findOne',
      permission    : 'find_room'
    },
    'post /room': {
      controller    : 'room',
      action        : 'create',
      model         : 'room',
      permission    : 'create_room'
    },
    'put /room/:id([0-9]+)': {
      controller    : 'room',
      model         : 'room',
      action        : 'update',
      permission    : 'update_room'
    },
    'delete /room/:id([0-9]+)': {
      controller    : 'room',
      model         : 'room',
      action        : 'destroy',
      permission    : 'delete_room'
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
    }
  });

  plugin.events.on('we:after:load:socket.io', require('./lib/we-after-load-socket.io'));

  return plugin;
};