/**
 * MessengerController
 *
 *
 * @module		:: Controller
 * @description	:: Contains logic for handling requests.
 */
var _ = require('lodash');

module.exports = {
  find: function findRecords(req, res) {
    if(!req.isAuthenticated()) return res.forbidden();
    var we = req.getWe();

    if (req.query.uid) {
      if (!Number(req.query.uid)) return res.badRequest();
      res.locals.query.where = {
        $or: [
          { fromId: req.query.uid, toId: req.user.id },
          { fromId: req.user.id, toId: req.query.uid }
        ]
      };
    } else {
      res.locals.query.where = {
        $or: [
          { fromId: null },
          { toId: null }
        ]
      };
    }
    we.db.models.message.findAll(res.locals.query)
    .then(function( messages) {
      we.db.models.message.count(res.locals.query)
      .then(function(count) {
        return res.send({
          message: messages,
          meta: {
            count: count
          }
        });
      });
    }).catch(res.serverError);
  },

  findOne: function findOneRecord(req, res, next) {
    if(!req.isAuthenticated()) return res.forbidden();
    var we = req.getWe();
    var id = req.params.id;
    if (!id || !Number(id)) return next();

    we.db.models.message.findOne(id)
    .then(function (message) {
      if (
        ( message.toId != req.user.id ) &&
        ( message.fromid != req.user.id )
      ) {
        // dont are to or from id
        return res.forbidden();
      }

      return res.send({
        message: message
      });
    }).catch(res.serverError);
  },

  /**
   * Return last messages between logged in user and :uid user
   */
  messagesWithUser: function (req,res){
    if(!req.isAuthenticated()) return res.forbidden();
    var we = req.getWe();
    var uid = req.params.uid;

    // return forbiden
    if(!uid) return res.notFound('No messages found');

    res.locals.query.where = {
      $or: [
        { fromId: req.params.uid,
          toId: req.user.id
        },
        {
          fromId: req.user.id,
          toId: req.params.uid
        }
      ]
    };

    we.db.models.message.find(res.locals.query.where)
    .then(function (messages) {
      // Found multiple messages!
      if (messages) {
        res.json({
          messages: messages
        });
      }
    }).catch(req.serverError);
  },

  /**
   * Return last messages between logged in user and :uid user
   */
  getPublicMessages: function (req, res) {
    var we = req.getWe();

    res.locals.query.where = {
      $or: [
        { fromId: null },
        { toId: null }
      ]
    };

    we.db.models.message.find(res.locals.query.where)
    .then(function (messages) {
      res.json({
        messages: messages
      });
    }).catch(res.serverError);
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
    _.forEach(we.onlineusers, function(onlineuser) {
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
   * Create one message
   *
   * @requires User authenticated
   */
  createRecord: function (req, res) {
    if ( !req.isAuthenticated() ) return res.forbidden();
    var we = req.getWe();

    var message = {};
    message.content = req.body.content;
    message.fromId = req.user.id;
    message.toId = req.body.toId;

    // public message
    if ( !message.toId ) {
      return we.db.models.message.create(message)
      .then(function (newMessage) {
        // send to public room
        we.io.sockets.in('public').emit(
          'receive:public:message',
          {
            message: newMessage
          }
        );
        return res.ok(newMessage);
      }).catch(res.serverError);
    }

    // to contact message
    // return Contact.getUsersRelationship(message.fromId, message.toId, function(err, contact) {
    // if (err) {
    //   sails.log.error('CreateMessage:Contact.getUsersRelationship:', err);
    //   return res.serverError();
    // }

    // // user dont are one contact
    // if (!contact || ( contact.status !== 'accepted' ) ) {
    //   return res.forbidden();
    // }

    we.db.models.message.create(message)
    .then(function createMessageToContact(newMessage) {
      var socketRoomName = 'user_' + newMessage.toId;

      we.io.sockets.in(socketRoomName).emit(
        'receive:message',
        {
          id: newMessage.id,
          verb: 'created',
          message: newMessage
        }
      );

      return res.ok(newMessage);
    }).catch(res.serverError);
    // });

  },

  update: function (req, res) {
    if(!req.isAuthenticated()) return res.forbidden();

    // Create `values` object (monolithic combination of all parameters)
    // But omit the blacklisted params (like JSONP callback param, etc.)
    var values = req.body;

    // Omit the path parameter `id` from values, unless it was explicitly defined
    // elsewhere (body/query):
    var idParamExplicitlyIncluded = ((req.body && req.body.id) || req.query.id);
    if (!idParamExplicitlyIncluded) delete values.id;

    delete values.createdAt;
    delete values.updatedAt;

    // Find and update the targeted record.
    //
    // (Note: this could be achieved in a single query, but a separate `findOne`
    //  is used first to provide a better experience for front-end developers
    //  integrating with the blueprint API.)
    Model.findOne(pk).exec(function found(err, matchingRecord) {

      if (err) return res.serverError(err);
      if (!matchingRecord) return res.notFound();

      Model.update(pk, values).exec(function updated(err, records) {

        // Differentiate between waterline-originated validation errors
        // and serious underlying issues. Respond with badRequest if a
        // validation error is encountered, w/ validation info.
        if (err) return res.negotiate(err);


        // Because this should only update a single record and update
        // returns an array, just use the first item.  If more than one
        // record was returned, something is amiss.
        if (!records || !records.length || records.length > 1) {
          req._sails.log.warn(
          util.format('Unexpected output from `%s.update`.', Model.globalId)
          );
        }

        var updatedRecord = records[0];

        // to contact message
        var socketRoomName = 'user_' + updatedRecord.fromId;
        // if has toId send the message in sails.js default responde format
        req._sails.io.sockets.in(socketRoomName).emit(
          'update:message',
          {
            id: updatedRecord.id,
            verb: 'updated',
            message: updatedRecord
          }
        );

        // public room
        res.ok(updatedRecord);
      });// </updated>
    }); // </found>
  },

  /**
   * Messages dont have a delete feature
   */
  destroy: function (req, res) {
    return res.notFound();
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
  }

};

// function createContactMessage (message){
//   Message.create(message).exec(function (error, newMessage){
//     if (error) {
//       console.log(error);
//       return res.send(500, {error: res.i18n('DB Error') });
//     }
//     // TODO add suport to rooms
//     if(message.toId){

//       var socketRoomName = 'user_' + newMessage.toId;
//       // if has toId send the message in sails.js default responde format
//       sails.io.sockets.in(socketRoomName).emit(
//         'message',
//         {
//           id: newMessage.id,
//           verb: 'created',
//           data: newMessage
//         }
//       );
//     } else {
//       // send to public room
//       sails.io.sockets.in('public').emit(
//         'receive:public:message',
//         {
//           message: newMessage
//         }
//       );
//     }
//     return res.send(newMessage);

//   });
// }
