module.exports = function(data) {
  var we = data.we;

  if( typeof we.io.onlineusers === 'undefined' ) we.io.onlineusers = {};

  we.io.sockets.on('connection', function(socket) {
    if (socket.user) {
      socket.on('messenger:start', function() {
        if(!socket.user) return;

        var userId = socket.user.id;

        var user;
        if ( socket.user.toJSON ) {
          user = socket.user.toJSON();
        } else {
          user = socket.user;
        }

        // save user data in online users cache
        if( typeof we.io.onlineusers[userId] === 'undefined' ) {
          user.messengerStatus = 'online';

          // save a the new socket connected on links users
          we.io.onlineusers[userId] = {
            user: user,
            sockets: []
          };

          we.io.onlineusers[userId].sockets.push(socket.id);

          // TODO change to send to friends
          we.io.sockets.in('global').emit('contact:connect', {
            status: 'connected',
            item: user
          });
        } else {
          we.io.onlineusers[userId].sockets.push(socket.id);
        }
        // join user exclusive room to allow others users send
        // mesages to this user
        socket.join('user_' + userId);
        // TODO change to userId friends room
        socket.join('global');
        // Public room
        // TODO make this dynamic and per user configurable
        socket.join('public');
        // Fetch all online to send as response
        // var usersOnline = _.reduce( we.io.onlineusers, function (prev, onlineUser) {
        //   if ( onlineUser.sockets.length && ( socket.user.id !== onlineUser.user.id ) ) {
        //     return prev.concat([onlineUser.user]);
        //   }
        //   return prev;
        // }, []);

        socket.emit('is:online', socket.user);
      })

      socket.on('messenger:stop', function() {
        if ( typeof we.io.onlineusers[socket.user.id] !== 'undefined' ) {

          if (we.io.onlineusers[socket.user.id]) {

            var index = we.io.onlineusers[socket.user.id].sockets.indexOf(socket.id);
            if (index >-1 ) we.io.onlineusers[socket.user.id].sockets.splice(index, 1);

            if (!we.io.onlineusers[socket.user.id].sockets.length)
              delete we.io.onlineusers[socket.user.id];
          }

          if (!we.io.onlineusers[socket.user.id]) {
            we.io.to('global').emit('contact:disconnect', {
              status: 'disconected',
              item: {
                id: socket.user.id
              }
            });
          }
        }

        socket.emit('is:offline', { id: socket.user.id });
      });

      socket.on('messenger:public:message:send', function(data) {
        var message = {};
        message.content = data.content;
        message.fromId = socket.user.id;

        return we.db.models.message.create(message)
        .then(function (newMessage) {
          // send to public room
          we.io.to('public').emit('messenger:public:message:created', {
            message: newMessage
          });
        }).catch(function(err) {
          we.log.error('Error on create public message', err);
        });
      });

      socket.on('messenger:private:message:send', function(data) {
        if (!data.toId) return;

        var message = {};

        message.content = data.content;
        message.fromId = socket.user.id;
        message.toId = data.toId;

        we.db.models.message.create(message)
        .then(function createMessageToContact(newMessage) {
          we.io.to('user_' + newMessage.toId)
          .emit('messenger:private:message:created', {
            message: newMessage
          });
        }).catch(function(err) {
          we.log.error('Error on create public message', err);
        });
      })
    }

    socket.on('messenger:room:subscribe', function(data) {
      if (!data.roomId) return we.log.warn('messenger:room:subscribe : roomId is required');

      we.db.models.room.find({
        where: { id: data.roomId}
      }).then(function(room) {
        if (!room)
          return we.log.warn('messenger:room:subscribe : room not found');

        var userId = null;
        if (socket.user) userId = socket.user.id;

        socket.join('room:' + data.roomId);
        if (socket.user) {
          socket.to('room:' + data.roomId).emit('messenger:room:user:joined', { id: userId});
        }
      }).catch(function (err) {
        we.log.error('error on messenger:room:subscribe: ', err);
      });
    });

    socket.on('messenger:room:unsubscribe', function(data) {
      if (!data.roomId) return we.log.warn('messenger:room:unsubscribe : roomId is required');

      var userId = null;
      if (socket.user) userId = socket.user.id;

      socket.leave('room:' + data.roomId);
      socket.to('room:' + data.roomId)
      .emit('messenger:room:user:left', { id: userId});
    });
  });

  return we.hooks.on('we:before:send:createdResponse', function(data, done) {
    if (data.res.locals.model !== 'roommessage') return done();
    if (data.res.locals.record.roomId) {
      we.io.to('room:' + data.res.locals.record.roomId)
      .emit('messenger:room:message:created', { roommessage: data.res.locals.record });
    } else {
      we.io.to('room:public')
      .emit('messenger:room:message:created', { roommessage: data.res.locals.record });
    }
    done();
  });
}