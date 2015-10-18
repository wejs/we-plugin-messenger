/**
 * Rooms
 *
 * @module      :: Model
 * @description :: Rooms model
 *
 */
module.exports = function Model(we) {
  var model = {
    definition: {
      /**
       * Room name
       */
      name: {
        type: we.db.Sequelize.STRING,
        allowNull: false
      },
      /**
       * Room description
       */
      description: {
        type: we.db.Sequelize.TEXT
      },
      /**
       * Room type
       *
       * contact, private, restrict, public
       */
      type: {
        type: we.db.Sequelize.STRING,
        defaultValue: 'public',
        allowNull: false,
        isIn: [ ['contact', 'private', 'public'] ]
      },
      /**
       * CreatorId
       */
      creatorId: {
        type: we.db.Sequelize.BIGINT,
        allowNull: false
      }
    },

    associations: {
      members: {
        type: 'belongsToMany',
        model: 'user',
        inverse: 'rooms',
        through: 'rooms_members'
      }
    },

    options: {
      classMethods: {},
      instanceMethods: {
        haveAccess: function haveAccess(user, cb) {
          // have access if the room is a public room
          if (this.type == 'public') return cb(null, true);
          // if not is public need be logged in
          if (!user) return cb(null, false);
          // check if current user are member of this room
          this.hasMember(user).then(function(haveAccess){
            cb(null, haveAccess);
          }).catch(cb);
        },
        /**
         * Check if user is admin and return the membership
         *
         * @param  {Object}   user
         * @param  {Function} cb   callback
         */
        isAdmin: function isAdmin(user, cb) {
          // if not is public need be logged in
          if (!user) return cb(null, false);
          // check if current user are member of this room
          we.db.models.rooms_members.findOne({
            where: {
              roomId: this.id,
              userId: user.id
            }
          }).then(function (membership){
            if (!membership || !membership.isAdmin) return cb(null, false);
            cb(null, membership);
          }).catch(cb);
        }
      },

      hooks: {
        afterCreate: function(record, opts, next) {
          record.addMember(record.creatorId, { isAdmin: true })
          .then(function() {
            return next();
          }).catch(next);
        }
      }
    }
  }
  return model;
}
