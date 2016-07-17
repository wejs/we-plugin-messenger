module.exports = function(data) {
  var we = data.we;

  if( typeof we.io.onlineusers === 'undefined' ) we.io.onlineusers = {};

  we.io.sockets.on('connection', function (socket) {

    if (socket.user) {
      socket.on('messenger:start', function() {
        if(!socket.user) return;

        var userId = socket.user.id;
        var user = ( socket.user.toJSON() || socket.user );

        // save user data in online users cache
        if( typeof we.io.onlineusers[userId] === 'undefined' ) {
          user.messengerStatus = 'online';

          // save a the new socket connected on links users
          we.io.onlineusers[userId] = {
            user: user,
            sockets: []
          };

          we.io.onlineusers[userId].sockets.push(socket.id);
          we.db.models.contact.findUserContacts(userId)
          .then(function (contacts) {
            contacts.forEach(function(c) {
              var cId = c.to
              if (c.to == socket.user.id) cId = c.from
              we.io.sockets.to('user_'+cId).emit('contact:connect', { id: socket.user.id})
            })

            return null
          })
        } else {
          we.io.onlineusers[userId].sockets.push(socket.id)
        }

        socket.emit('is:online', socket.user)
      });

      socket.on('messenger:stop', function() {
        we.io.removeFromOnlineUsers(socket)
        socket.emit('is:offline', { id: socket.user.id })
      });
    }

    socket.on('room:subscribe', function(data) {
      if (!data.roomId) return we.log.warn('room:subscribe : roomId is required');

      we.db.models.room.find({
        where: { id: data.roomId}
      })
      .then(function (room) {
        if (!room) {
          we.log.warn('room:subscribe : room not found')
        } else {
          room.haveAccess(socket.user, function (err, have) {
            if (err) {
              we.log.error(err)
              return null
            }
            if (!have) return null

            var userId = null;
            if (socket.user) userId = socket.user.id

            socket.join('room:' + data.roomId)
            if (socket.user) {
              socket.to('room:' + data.roomId).emit('room:user:joined', { id: userId})
            }
          })
        }

        return null
      })
      .catch(function (err) {
        we.log.error('error on room:subscribe: ', err);
      });
    });

    socket.on('room:unsubscribe', function (data) {
      if (!data.roomId) return we.log.warn('room:unsubscribe : roomId is required');

      var userId = null;
      if (socket.user) userId = socket.user.id;

      we.db.models.room.find({
        where: { id: data.roomId}
      })
      .then(function (room) {
        if (!room) {
          we.log.warn('room:subscribe : room not found')
        } else {
          room.haveAccess(socket.user, function(err, have) {
            if (err) {
              we.log.error(err);
              return;
            }
            if (!have) return;


            socket.leave('room:' + data.roomId);
            socket.to('room:' + data.roomId)
            .emit('room:user:left', { id: userId});
          })
        }

        return null
      })
    })
  })
}