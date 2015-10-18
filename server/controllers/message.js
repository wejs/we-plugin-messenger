/**
 * MessengerController
 *
 *
 * @module		:: Controller
 * @description	:: Contains logic for handling requests.
 */

module.exports = {
  find: function findRecords(req, res, next) {
    req.we.db.models.room.findById(req.params.roomId)
    .then(function (room) {
      if (!room) return next();
      // check if current user are member of this room
      room.haveAccess(req.user, function (err, can) {
        if (err) return res.serverError(err);
        if (!can) return res.forbidden();

        res.locals.query.where = {
          $or: [
            { roomId: room.id },
            { roomId: null }
          ]
        };

        req.we.db.models.message.findAll(res.locals.query)
        .then(function (messages) {
          req.we.db.models.message.count({
            where: res.locals.query.where
          }).then(function (count) {
            return res.send({
              message: messages,
              meta: { count: count }
            });
          });
        }).catch(res.queryError);
      });
    }).catch(res.queryError);
  },

  findOne: function findOneRecord(req, res, next) {
    if (!res.locals.data) return next();

    var message  = res.locals.data;
    // this message not is inside this current group
    if (message.room.id != req.params.roomId) return next();
    // check if have access
    message.room.haveAccess(req.user, function (err, r) {
      if (err) return res.serverError(err);
      if (!r) return res.forbidden();
      return res.ok();
    });
  },

  /**
   * Get contact list
   * TODO add suport to friends and roons
   */
  getContactList: function (req, res) {
    if(!req.isAuthenticated()) return res.forbidden();
    var we = req.getWe();
    var contactList = [];

    // get contact/friend list from online users
    // TODO implement contact list
    req.we.utils._.forEach(we.onlineusers, function(onlineuser) {
      if (onlineuser.sockets.length) {
        if(req.user.id != onlineuser.user.idInProvider){
          contactList.push(onlineuser.user);
        }
      }
    });

    // TODO change this response to array
    res.send(contactList);
  },

  /**
   * Create one message inside one room
   *
   * @requires User authenticated
   */
  create: function (req, res) {
    if ( !req.isAuthenticated() ) return res.forbidden();

    req.we.db.models.room.findById(req.params.roomId)
    .then(function (room){
      if (!room) return res.notFound();
      // check access
      room.haveAccess(req.user, function (err, have) {
        if (err) return res.serverError(err);
        if (!have) return res.forbidden();

        var message = {
          content: req.body.content,
          creatorId: req.user.id,
          roomId: req.body.roomId
        };

        // roomId is required
        if ( !message.roomId ) {
          res.addMessage('error', 'messenger.roomId.required', {
            type: 'validation', field: 'roomId', rule: 'required'
          });
          return res.badRequest();
        }

        req.we.db.models.message.create(message)
        .then(function createMessageToContact(newMessage) {
          res.locals.data = newMessage;
          return res.created();
        }).catch(res.serverError);
      });
    }).catch(res.queryError);
  },

  /**
   * I am writing!
   * Socket.io
   * Send 'user:writing' event
   */
  emitIamWriting: function (req, res) {
    if(!req.isAuthenticated()) return res.forbidden();
    var we = req.getWe();
    var toUserId = req.body.toUserId;
    var toRoom = req.body.toRoom;
    // var toGlobal = req.param('global');

    if (!toUserId && !toRoom) {
      return res.badRequest();
    }

    if(toUserId){
      //var fromUserId = socket.handshake.session.passport.user;

      we.io.sockets.in('user_' + toUserId).emit(
        'user:writing',
        {
          user: {
            id: req.user.id
          }
        }
      );
    }

    // TODO
    // if (toRoom) {}

    // if(toGlobal){
    //   //res.send(200,'');
    //   // TODO change to send to friends
    //   sails.io.sockets.in('global').emit('user:writing', {
    //     user: req.user
    //   });
    // }

    res.send(200,'');
  },

  contactListIframe: function(req, res) {
    if (!req.isAuthenticated()) return res.forbidden();

    var we = req.getWe();

    res.locals.authenticatedJSONRecord = JSON.stringify(req.user.toJSON());

    res.locals.height = Number(req.query.height) || 225;
    res.locals.height -= 45;


    res.locals.isAuthenticated = req.isAuthenticated();

    if (req.user && req.user.language) {
      res.locals.locale = req.user.language;
    } else {
      res.locals.locale = we.config.i18n.defaultLocale;
    }

    res.locals.layout = false;
    res.locals.template = 'messenger/list';
    res.view();
  },

  contactBoxIframe: function roomIframe(req, res) {
    if (!res.locals.data) return res.notFound();
    if (!req.isAuthenticated()) return res.badRequest();
    if (req.user === res.locals.data.id) return res.badRequest();

    var we = req.getWe();

    res.locals.title = res.locals.data.displayName;

    res.locals.currentUserJsonRecord = JSON.stringify(req.user.toJSON());
    res.locals.jsonRecord = JSON.stringify(res.locals.data.toJSON());

    res.locals.height = Number(req.query.height) || 225;

    res.locals.isAuthenticated = req.isAuthenticated();

    if (req.user && req.user.language) {
      res.locals.locale = req.user.language;
    } else {
      res.locals.locale = we.config.i18n.defaultLocale;
    }

    res.locals.layout = false;
    res.locals.template = 'messenger/private';
    res.view();
  },
  // cant update a message
  edit: function(req, res) {
    return res.notFound();
  },
  // cant delete a message
  delete: function(req, res) {
    return res.notFound();
  }
};
