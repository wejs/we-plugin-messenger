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
  // ser plugin routes
  plugin.setRoutes({
    'get /messenger/start': {
      controller    : 'message',
      action        : 'start',
      model         : 'message',
      responseType  : 'json',
      permission    : 'use_messenger'
    },
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
      permission    : 'use_messenger'
    },
    // Return messages without toIds and roomIds
    'get /messenger/messages/public': {
      controller    : 'message',
      action        : 'getPublicMessages',
      model         : 'message',
      responseType  : 'json',
      permission    : 'use_messenger'
    },
    // Send a message to show writing status
    'post /messenger/user/writing': {
      controller    : 'message',
      action        : 'emitIamWriting',
      model         : 'message',
      responseType  : 'json',
      permission    : 'use_messenger'
    },
    // -- ROOMS
    // 'get /rooms/:id?': {
    //     controller    : 'rooms',
    //     action        : 'index'
    // },
    // 'post /rooms': {
    //     controller    : 'rooms',
    //     action        : 'create'
    // },
    // 'put /rooms/:id?': {
    //     controller    : 'rooms',
    //     action        : 'update'
    // },
    // 'delete /rooms/:id?': {
    //     controller    : 'rooms',
    //     action        : 'destroy'
    // },

    // // get users in one room
    // 'get /rooms/users/': {
    //     controller    : 'rooms',
    //     action        : 'usersGet'
    // },
    // add user in room
    'post /rooms/users/:id?': {
      controller    : 'room',
      action        : 'userAdd',
      responseType  : 'json',
      permission    : 'use_messenger'
    },
    // remove user from room
    'delete /rooms/users/:id?': {
      controller    : 'room',
      action        : 'userRemove',
      responseType  : 'json',
      permission    : 'use_messenger'
    }

  });

  return plugin;
};