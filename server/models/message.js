/**
 * Message
 *
 * @module      :: Model
 * @description :: All messages is send to one room
 *
 */
module.exports = function Model(we) {
  var model = {
    definition: {
      content: {
        type: we.db.Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: we.db.Sequelize.STRING,
        defaultsTo: 'salved'
      },
      read: {
        type: we.db.Sequelize.BOOLEAN,
        defaultValue: false
      }
    },

    associations: {
      creator:  {
        type: 'belongsTo',
        model: 'user'
      },
      room: {
        type: 'belongsTo',
        model: 'room'
      }
    },

    options: {
      classMethods: {},
      instanceMethods: {
        /**
         *et url path instance method
         *
         * @return {String} url path
         */
        getUrlPath: function getUrlPath() {
          return we.router.urlTo(
            this.$modelOptions.name.singular + '.findOne', [this.roomId, this.id]
          );
        }
      },
      hooks: {
        beforeCreate: function(record, options, next) {
          // set record status do salved
          if (record.status === 'sending') {
            record.status = 'salved';
          }
          next(null, record);
        },
        afterCreate: function(record, options, next) {
          // socket.io now is avaible or started
          if (!we.io || !we.io.sockets) return next();
          // send to subscribed users
          we.io.sockets.in('room:' + record.roomId)
          .emit( 'room:message:created', {
            message: record
          });
          next();
        }
      }
    }
  }
  return model;
}