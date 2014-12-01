/**
 * Routes
 *
 * Sails uses a number of different strategies to route requests.
 * Here they are top-to-bottom, in order of precedence.
 *
 * For more information on routes, check out:
 * http://sailsjs.org/#documentation
 */



/**
 * (1) Core middleware
 *
 * Middleware included with `app.use` is run first, before the router
 */


/**
 * (2) Static routes
 *
 * This object routes static URLs to handler functions--
 * In most cases, these functions are actions inside of your controllers.
 * For convenience, you can also connect routes directly to views or external URLs.
 *
 */

module.exports.routes = {
  //  -- MESSENGER

  'get /messenger/start': {
      controller    : 'message',
      action        : 'start'
  },

  // TODO use sails.js blueprint for set routes
  'get /api/v1/message/:id?': {
      controller    : 'message',
      action        : 'find'
  },

  'post /api/v1/message': {
      controller    : 'message',
      action        : 'createRecord'
  },

  // Return a list of messages between authenticated user and :uid user
  'get /messenger/messages/with-user/:uid?': {
      controller    : 'message',
      action        : 'messagesWithUser'
  },

  // Return messages without toIds and roomIds
  'get /messenger/messages/public': {
      controller    : 'message',
      action        : 'getPublicMessages'
  },

  // Send a message to show writing status
  'post /messenger/user/writing': {
      controller    : 'message',
      action        : 'emitIamWriting'
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
      controller    : 'rooms',
      action        : 'userAdd'
  },

  // remove user from room
  'delete /rooms/users/:id?': {
      controller    : 'rooms',
      action        : 'userRemove'
  }

};
