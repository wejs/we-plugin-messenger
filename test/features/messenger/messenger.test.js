var assert = require('assert');
var request = require('supertest');
var helpers = require('we-test-tools').helpers;
var stubs = require('we-test-tools').stubs;
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
          if (err) throw err;

          salvedUser = result.salvedUser;
          salvedUserPassword = result.salvedUserPassword;
          authenticatedRequest = result.authenticatedRequest;
          authToken = result.token;

          we.db.models.accesstoken.create({
            userId: salvedUser.id, tokenType: 'passportToken'
          }).then(function (token){

            client = ioClient.connect(connectUrl, {
              transports: ['websocket'],
              'force new connection': true,
              query: 'authToken=' + token.token
            });

            client.once('connect', function () {
              done();
            });

          }).catch(done);
        });
      },
      function connectUser2(done) {
        helpers.createAndLoginUser(function (err, result) {
          if (err) throw err;

          salvedUser2 = result.salvedUser;
          salvedUserPassword2 = result.salvedUserPassword;
          authenticatedRequest2 = result.authenticatedRequest;
          authToken2 = result.token;

          we.db.models.accesstoken.create({
            userId: salvedUser2.id, tokenType: 'passportToken'
          }).then(function (token){
            client2 = ioClient.connect(connectUrl,  {
              transports: ['websocket'],
              'force new connection': true,
              query: 'authToken=' + token.token
            });
            client2.once('connect', function () {
              done();
            });
          }).catch(done);
        });
      }
    ], done);
  });

  describe('privateRoom', function() {
    var salvedRooms = [];
    before(function (done) {
      var rooms = [
        stubs.roomStub(), stubs.roomStub(), stubs.roomStub(), stubs.roomStub()
      ];
      async.each(rooms, function (room, next) {
        room.creatorId = salvedUser.id;
        room.type = 'private';
        we.db.models.room.create(room).then(function (r) {
          salvedRooms.push(r);
          next();
        }).catch(next);
      }, done);
    });

    it ('get /room should get rooms list with private room created by same user', function(done) {
      var room = stubs.roomStub();
      room.type = 'private';
      room.creatorId = salvedUser.id;
      we.db.models.room.create(room).then(function (r) {
        authenticatedRequest.get('/room')
        .set('Accept', 'application/json')
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          assert(res.body.room);
          var found = false;
          res.body.room.forEach(function (sr){
            if (sr.id == r.id) found = true;
          });

          assert(found, 'private room not found in response');
          // should
          done();
        });
      });
    });

    it ('get /room should get rooms list without the private room created by user1', function(done) {
      var room = stubs.roomStub();
      room.type = 'private';
      room.creatorId = salvedUser.id;
      we.db.models.room.create(room).then(function (r) {
        authenticatedRequest2.get('/room')
        .set('Accept', 'application/json')
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          assert(res.body.room);
          res.body.room.forEach(function (sr){
            assert(sr.id != r.id);
          });
          // should
          done();
        });
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
    it ('get /room/:id should return forbidden for user how dont are in this room', function(done){
      var room = salvedRooms[0];
      authenticatedRequest2.get('/room/'+ room.id)
      .set('Accept', 'application/json')
      .expect(403)
      .end(function (err) {
        if (err) throw err;
        done();
      });
    });
    it ('update /room/:id should update one room if user is manager', function(done) {
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

    it ('update /room/:id should return forbidden if user not is manager', function(done) {
      var room = salvedRooms[0];
      var newRoomName = 'new room Name';
      authenticatedRequest2.put('/room/'+ room.id)
      .send({ name: newRoomName })
      .set('Accept', 'application/json')
      .expect(403)
      .end(function (err) {
        if (err) throw err;
        done();
      });
    });

    it ('post /room/:id/message should create one message', function(done){
      var room = salvedRooms[0];
      var message = stubs.messageStub(room.id);
      authenticatedRequest.post('/room/'+room.id+'/message')
      .send(message)
      .set('Accept', 'application/json')
      .expect(201)
      .end(function (err, res) {
        if (err) throw err;

        assert(res.body.message);
        assert( _.isArray(res.body.message) , 'message not is array');
        assert(res.body.meta);
        assert(res.body.message[0].id);
        assert.equal(res.body.message[0].content, message.content);

        done();
      });
    });
    it ('get /room/:id/message should get messages list in room', function (done) {
      var room = salvedRooms[0];
      authenticatedRequest.get('/room/'+room.id+'/message')
      .set('Accept', 'application/json')
      .expect(200)
      .end(function (err, res) {
        if (err) throw err;

        assert(res.body.message);
        assert( _.isArray(res.body.message) , 'message not is array');
        assert(res.body.meta.count > 0);
        done();
      });
    });

    it ('post /room/:id/message should return forbidden for user how dont are in room', function(done) {
      var room = salvedRooms[1];
      var message = stubs.messageStub(room.id);
      message.roomId = room.id;

      authenticatedRequest2.post('/room/'+room.id+'/message')
      .send(message)
      .set('Accept', 'application/json')
      .expect(403)
      .end(function (err) {
        if (err) throw err;
        done();
      });
    });

    it ('user 1 should invite user2 to room and user 2 accept', function(done) {
      var room = salvedRooms[0];

      authenticatedRequest.post('/room/'+room.id+'/member/'+salvedUser2.id+ '/invite')
      .set('Accept', 'application/json')
      .expect(200)
      .end(function (err, res) {
        if (err) throw err;
        room.hasInvite(salvedUser2).then(function (have){
          assert(have);

          authenticatedRequest2.post('/room/'+room.id+'/member/accept')
          .set('Accept', 'application/json')
          .expect(200)
          .end(function (err, res) {
            if (err) throw err;

            room.hasMember(salvedUser2).then(function(isMember){
              assert(isMember);
              // cleanup
              room.removeMember(salvedUser2).then(function(){
                done();
              }).catch(done);
            }).catch(done);
          });
        }).catch(done);
      });
    });

    it ('get /room/:id/members should return mebers list for member', function (done) {
      var room = salvedRooms[1];

      authenticatedRequest.get('/room/'+room.id+'/member')
      .set('Accept', 'application/json')
      .expect(200)
      .end(function (err, res) {
        if (err) throw err;

        assert(res.body.user);

        // TODO check if all users is members

        done();
      });
    });
  });

  describe('publicRoom', function() {
    var salvedRooms = [];
    before(function (done) {
      var rooms = [
        stubs.roomStub(), stubs.roomStub(), stubs.roomStub(), stubs.roomStub()
      ];
      async.each(rooms, function (room, next) {
        room.creatorId = salvedUser.id;
        we.db.models.room.create(room).then(function (r) {
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

    it ('room:subscribe should send the user joined message ', function(done) {
      var room = salvedRooms[2];
      client.once('room:user:joined', function (data) {
        assert.equal(data.id, salvedUser2.id);
        done();
      });
      client.emit('room:subscribe', { roomId: room.id });
      client2.emit('room:subscribe', { roomId: room.id });
    });

    it ('room:unsubscribe', function(done) {
      var room = salvedRooms[2];
      client.emit('room:subscribe', { roomId: room.id });

      client2.once('room:user:left', function (data) {
        assert.equal(data.id, salvedUser.id);
        done();
      });

      client2.emit('room:subscribe', { roomId: room.id });
      client.emit('room:unsubscribe', { roomId: room.id });
    });

  });
});