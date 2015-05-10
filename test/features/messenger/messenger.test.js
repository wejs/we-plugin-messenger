var assert = require('assert');
var request = require('supertest');
var helpers = require('../../helpers');
var stubs = require('../../stubs');
var ioClient = require('socket.io-client');
var async = require('async');
var _ = require('lodash');
var http;
var we;
var agent;

describe('messengerFeature', function() {
  var salvedUser, salvedUserPassword, authenticatedRequest, authToken, client;
  var salvedUser2, salvedUserPassword2, authenticatedRequest2, authToken2, client2;
  var connectUrl;

  before(function (done) {
    http = helpers.getHttp();
    agent = request.agent(http);

    we = helpers.getWe();
    we.config.acl.disabled = true;
    connectUrl = 'http://localhost:' + we.config.port;

    async.parallel([
      function connectUser(done){
        helpers.createAndLoginUser(function (err, result) {
          if (err) return done(err);

          salvedUser = result.salvedUser;
          salvedUserPassword = result.salvedUserPassword;
          authenticatedRequest = result.authenticatedRequest;
          authToken = result.token;

          client = ioClient.connect(connectUrl, {
            transports: ['websocket'],
            'force new connection': true,
            query: 'authToken=' + authToken
          });

          client.once('connect', function () {
            done();
          });
        });
      },
      function connectUser2(done){
        helpers.createAndLoginUser(function (err, result) {
          if (err) return done(err);

          salvedUser2 = result.salvedUser;
          salvedUserPassword2 = result.salvedUserPassword;
          authenticatedRequest2 = result.authenticatedRequest;
          authToken2 = result.token;

          client2 = ioClient.connect(connectUrl,  {
            transports: ['websocket'],
            'force new connection': true,
            query: 'authToken=' + authToken2
          });
          client2.once('connect', function () {
            done();
          });
        });
      }
    ], done);
  });

  describe('Messenger', function() {
    before(function (done) {
      async.parallel([
        function startClient1Messenger (done) {
          client.once('is:online', function (message) {
            assert.equal(message.messengerStatus, 'online');
            assert.equal(message.id, salvedUser.id);
            assert.equal(message.username, salvedUser.username);
            done();
          });
          client.emit('messenger:start');
        },
        function startClient2Messenger (done) {
          client2.once('is:online', function (message) {
            assert.equal(message.messengerStatus, 'online');
            assert.equal(message.id, salvedUser2.id);
            assert.equal(message.username, salvedUser2.username);
            done();
          });
          client2.emit('messenger:start');
        }
      ], done);
    });

    it ('messenger:public:message:send should send one message to public room', function(done) {
      var message = stubs.messageStub();
      client2.once('messenger:public:message:created', function (data) {
        assert(data.message.id);
        assert.equal(message.content, data.message.content);
        assert.equal(data.message.fromId, salvedUser.id);
        done();
      });
      client.emit('messenger:public:message:send', message);
    });

    it('get /message get public messages list', function(done) {
      authenticatedRequest.get('/message?limit=' + 10)
      .set('Accept', 'application/json')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        assert.equal(200, res.status);
        assert(res.body.message);
        assert( _.isArray(res.body.message) , 'message not is array');
        assert(res.body.meta);
        done();
      });
    });

    it ('messenger:private:message:send should send one message do salvedUser2', function(done) {
      var message = stubs.messageStub();
      client2.once('messenger:private:message:created', function (data) {
        assert(data.message.id);
        assert.equal(message.content, data.message.content);
        assert.equal(data.message.fromId, salvedUser.id);
        assert.equal(data.message.toId, salvedUser2.id);
        done();
      });
      message.toId = salvedUser2.id;
      client.emit('messenger:private:message:send', message);
    });

    it('get /message?uid=:userId get private messages list', function(done) {
      authenticatedRequest.get('/message?limit=10&uid='+salvedUser2.id)
      .set('Accept', 'application/json')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        assert.equal(200, res.status);
        assert(res.body.message);
        assert( _.isArray(res.body.message) , 'message not is array');
        assert(res.body.meta);

        res.body.message.forEach(function(m){
          assert( (salvedUser2.id === m.toId || salvedUser2 .id === m.fromId) );
          assert( (salvedUser.id === m.toId || salvedUser.id === m.fromId) );
        });

        done();
      });
    });

    it ('messenger:stop', function(done) {
      client.once('is:offline', function (message) {
        assert.equal(message.id, salvedUser.id);
        done();
      });
      client.emit('messenger:stop');
    });
  });

  describe('Chat', function() {
    var salvedRooms = [];
    before(function(done) {
      var rooms = [
        stubs.roomStub(), stubs.roomStub(), stubs.roomStub(), stubs.roomStub()
      ];
      async.each(rooms, function(room, next) {
        room.creatorId = salvedUser.id;
        we.db.models.room.create(room).then(function(r) {
          salvedRooms.push(r);
          next();
        }).catch(next);
      }, done);
    });

    it ('post /room should create one room', function(done){
      var room = stubs.roomStub();
      authenticatedRequest.post('/room')
      .send(room)
      .set('Accept', 'application/json')
      .expect(201)
      .end(function (err, res) {
        if (err) return done(err);

        assert(res.body.room);
        assert( _.isArray(res.body.room) , 'room not is array');
        assert(res.body.meta);
        assert(res.body.room[0].id);
        assert.equal(res.body.room[0].name, room.name);
        assert.equal(res.body.room[0].description, room.description);

        done();
      });
    });
    it ('get /room should get rooms list', function(done) {
      authenticatedRequest.get('/room')
      .set('Accept', 'application/json')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        assert(res.body.room);
        assert( _.isArray(res.body.room) , 'room not is array');
        assert(res.body.meta.count > 4);
        done();
      });
    });
    it ('get /room/:id should get one room', function(done){
      var room = salvedRooms[0];
      authenticatedRequest.get('/room/'+ room.id)
      .set('Accept', 'application/json')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        assert(res.body.room);
        assert( _.isArray(res.body.room) , 'room not is array');
        assert.equal(res.body.room[0].id, room.id);
        assert.equal(res.body.room[0].name, room.name);
        assert.equal(res.body.room[0].description, room.description);
        done();
      });
    });
    it ('update /room/:id should update one room', function(done) {
      var room = salvedRooms[0];
      var newRoomName = 'new room Name';
      authenticatedRequest.put('/room/'+ room.id)
      .send({
        name: newRoomName
      })
      .set('Accept', 'application/json')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        assert(res.body.room);
        assert( _.isArray(res.body.room) , 'room not is array');
        assert.equal(res.body.room[0].id, room.id);
        assert.equal(res.body.room[0].name, newRoomName);
        assert.equal(res.body.room[0].description, room.description);
        room.name = newRoomName;
        done();
      });
    });

    it ('delete /room/:id should delete one room');

    it ('post /roommessage should create one roommessage', function(done){
      var message = stubs.messageStub();
      authenticatedRequest.post('/roommessage')
      .send(message)
      .set('Accept', 'application/json')
      .expect(201)
      .end(function (err, res) {
        if (err) return done(err);

        assert(res.body.roommessage);
        assert( _.isArray(res.body.roommessage) , 'roommessage not is array');
        assert(res.body.meta);
        assert(res.body.roommessage[0].id);
        assert.equal(res.body.roommessage[0].content, message.content);

        done();
      });
    });
    it ('get /roommessage should get roommessage list', function(done) {
      authenticatedRequest.get('/roommessage')
      .set('Accept', 'application/json')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        assert(res.body.roommessage);
        assert( _.isArray(res.body.roommessage) , 'roommessage not is array');
        assert(res.body.meta.count > 0);
        done();
      });
    });

    it ('messenger:room:subscribe should send the user joined message ', function(done) {
      var room = salvedRooms[2];
      client.once('messenger:room:user:joined', function (data) {
        assert.equal(data.id, salvedUser2.id);
        done();
      });
      client.emit('messenger:room:subscribe', { roomId: room.id });
      client2.emit('messenger:room:subscribe', { roomId: room.id });
    });

    it ('messenger:room:subscribe should subscribe user1 in room and receive one message from user2', function(done) {
      var room = salvedRooms[1];
      var message = stubs.messageStub();
      message.roomId = room.id;

      client.once('messenger:room:message:created', function (data) {
        assert(data.roommessage.id);
        assert.equal(message.content, data.roommessage.content);
        assert.equal(data.roommessage.roomId, room.id);
        assert.equal(data.roommessage.creatorId, salvedUser2.id);
        done();
      });

      client.emit('messenger:room:subscribe', { roomId: room.id });

      authenticatedRequest2.post('/roommessage')
      .send(message)
      .set('Accept', 'application/json')
      .expect(201)
      .end(function (err, res) {
        if (err) return done(err);
        assert(res.body.roommessage);
        assert(res.body.meta);
        assert(res.body.roommessage[0].id);
        assert.equal(res.body.roommessage[0].content, message.content);
      });
    });

    it ('/roommessage?roomId=:roomId should get room messages');

    it ('messenger:room:unsubscribe', function(done) {
      var room = salvedRooms[2];
      client.emit('messenger:room:subscribe', { roomId: room.id });

      client2.once('messenger:room:user:left', function (data) {
        assert.equal(data.id, salvedUser.id);
        done();
      });

      client2.emit('messenger:room:subscribe', { roomId: room.id });
      client.emit('messenger:room:unsubscribe', { roomId: room.id });
    });
  });
});