/**
 * RoomsController
 *
 * @module    :: Controller
 * @description :: Contains logic for handling requests.
 */

var path = require('path');

module.exports = {
  create: function create(req, res) {
    if (!res.locals.template) res.locals.template = res.locals.model + '/' + 'create';

    var _ = req.we.utils._;

    if (!res.locals.data) res.locals.data = {};

     _.merge(res.locals.data, req.query);

    if (req.method === 'POST') {
      if (req.isAuthenticated()) req.body.creatorId = req.user.id;

      // set temp record for use in validation errors
      res.locals.data = req.query;
      _.merge(res.locals.data, req.body);

      return res.locals.Model.create(req.body)
      .then(function (record) {
        res.locals.data = record;
        res.created();
      }).catch(res.queryError);
    } else {
      res.locals.data = req.query;
      res.ok();
    }
  },

  /**
   * Find rooms, by default will find rooms where current user are in
   *
   * @param  {Object}   req
   * @param  {Object}   res
   * @param  {Function} next
   */
  find: function findAll(req, res, next) {

    res.locals.query.include = [{
      model: req.we.db.models.user , as: 'members', where: {
        id: req.user.id
      }
    }];

    return res.locals.Model.findAndCountAll(res.locals.query)
    .then(function (record) {
      if (!record) return next();

      res.locals.metadata.count = record.count;
      res.locals.data = record.rows;

      res.ok();
    }).catch(res.queryError);
  },

  findOne: function findOne(req, res, next) {
    if (!res.locals.data) return next();

    res.locals.data.haveAccess(req.user, function (err, have) {
      if (err) return res.serverError(err);
      if (!have) return res.forbidden();

      if (!req.isAuthenticated())
        return res.ok();

      req.we.db.models.rooms_members.findOne({
        where: {
          userId: req.user.id,
          roomId: res.locals.id
        }
      }).then(function  (membership){
        res.locals.data.membership = membership;
      }).catch(res.queryError);
    });
  },

  /**
   * Edit / update one room
   * Only admin users can update room
   *
   * @param  {Object} req
   * @param  {Object} res
   */
  edit: function edit(req, res) {
    if (!res.locals.template) res.locals.template = res.local.model + '/' + 'edit';

    var record = res.locals.data;

    if (!record) return res.notFound();

    record.isAdmin(req.user, function (err, isAdmin) {
      if (err) return res.serverError(err);
      if (!isAdmin) return res.forbidden();

      if (req.we.config.updateMethods.indexOf(req.method) > -1) {

        record.updateAttributes(req.body)
        .then(function() {
          res.locals.data = record;
          return res.updated();
        }).catch(res.queryError);
      } else {
        res.ok();
      }
    });
  },
  /**
   * Delete one room
   * Only admin users can delete room
   *
   * @param  {Object} req
   * @param  {Object} res
   */
  delete: function deletePage(req, res) {
    if (!res.locals.template)
      res.locals.template = res.local.model + '/' + 'delete';

    var record = res.locals.data;
    if (!record) return res.notFound();

    record.isAdmin(req.user, function (err, isAdmin) {
      if (err) return res.serverError(err);
      if (!isAdmin) return res.forbidden();

      res.locals.deleteMsg = res.locals.model+'.delete.confirm.msg';

      if (req.method === 'POST' || req.method === 'DELETE') {
        record.destroy().then(function() {
          res.locals.deleted = true;
          return res.deleted();
        }).catch(res.queryError);
      } else {
        return res.ok();
      }
    });
  },

  inviteMember: function (req ,res) {
    if (!req.isAuthenticated()) return res.forbidden();

    req.we.db.models.room.findById(req.params.roomId)
    .then(function (room) {
      if (!room) return res.notFound();
      room.haveAccess(req.user, function(err, have) {
        if (err) return res.serverError();
        if (!have) return res.forbidden();


        req.we.db.models.user.findById(req.params.userId)
        .then(function (user) {
          room.hasMember(user).then(function (have){
            if (have) return res.badRequest();

            room.addInvite(user).then(function(){
              // TODO add notification

              res.ok();
            }).catch(res.queryError);
          }).catch(res.queryError);

        }).catch(res.queryError);
      });
    }).catch(res.queryError);
  },

  acceptMembership: function (req ,res) {
    if (!req.isAuthenticated()) return res.forbidden();

    req.we.db.models.room.findById(req.params.roomId)
    .then(function (room) {
      if (!room) return res.notFound();

      room.hasInvite(req.user).then(function (invite) {
        if (!invite) return res.notFound();

        room.removeInvite(req.user).then(function() {
          room.addMember(req.user).then(function() {

            // TODO add notification

            res.ok();
          }).catch(req.queryError);
        }).catch(req.queryError);
      }).catch(req.queryError);
    }).catch(res.queryError);
  },

  /**
   * Remove one member from room, need be room admin
   *
   * @param  {Object} req
   * @param  {Object} res
   */
  removeMember: function (req ,res) {
    if (!req.isAuthenticated()) return res.forbidden();
    // load the room
    req.we.db.models.room.findById(req.params.roomId)
    .then(function (room) {
      if (!room) return res.notFound();
      // check if current user is admin
      room.isAdmin(req.user, function (err, isAdmin) {
        if(err) return res.serverError(err);
        if(!isAdmin) return res.forbidden();
        // load the user
        req.we.db.models.user.findById(req.params.userId)
        .then(function (user){
          if (!user) return res.notFound();
          // check if user to remove is member
          room.hasMember(user).then(function (have){
            if (!have) return res.notFound();

            room.removeMember(user).then(function() {
              // TODO send a socket.io event to alert this exit

              return res.ok();
            }).catch(res.queryError);
          }).catch(res.queryError);

        }).catch(res.queryError);
      });
    }).catch(res.queryError);
  },

  leave: function (req ,res) {
    if (!req.isAuthenticated()) return res.forbidden();

    req.we.db.models.room.findById(req.params.roomId)
    .then(function (room) {
      if (!room) return res.notFound();
      // check if user is in room
      room.hasMember(req.user).then(function (have){
        if (!have) return res.notFound();
        // then remove the user from room
        room.removeMember(req.user).then(function(){
          // TODO send a socket.io event to alert connected room members

          res.ok();
        }).catch(req.queryError);
      });
    }).catch(res.queryError);
  },

  findMembers: function(req, res) {
    req.we.db.models.room.findById(req.params.roomId)
    .then(function (room) {
      if (!room) return res.notFound();

      room.haveAccess(req.user, function (err, have) {
        if (err) return res.serverError();
        if (!have) return res.forbidden();

        room.getMembers().then(function(members){
          res.locals.data = members;

          room.getMembersCount().then(function(count){
            res.locals.metadata.count = count;
            return res.ok();
          }).catch(res.queryError);// getMembersCount

        }).catch(res.queryError);// getMembers
      });
    }).catch(res.queryError); // findById
  },

  roomIframe: function roomIframe(req, res) {
    if (!res.locals.data) return res.notFound();

    var we = req.we;

    res.locals.title = res.locals.data.name;
    res.locals.jsonRecord = JSON.stringify(res.locals.data.toJSON());

    if (!req.user || !req.user.toJSON) {
      res.locals.currentUserJsonRecord = JSON.stringify(req.user);
    } else {
      res.locals.currentUserJsonRecord = JSON.stringify(req.user.toJSON());
    }

    res.locals.showTitle = req.query.showTitle === 'true';

    res.locals.height = Number(req.query.height) || 300;

    res.locals.isAuthenticated = req.isAuthenticated();

    if (req.user && req.user.language) {
      res.locals.locale = req.user.language;
    } else {
      res.locals.locale = we.config.i18n.defaultLocale;
    }

    res.locals.layout = false;
    res.render(path.resolve(__dirname, '..', 'templates/room.hbs'));
  }
};
