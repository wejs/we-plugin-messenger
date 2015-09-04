/**
 * Messages
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 *
 */
module.exports = function Model(we) {
  var model = {
    definition: {
      creatorId: {
        type: we.db.Sequelize.BIGINT,
        allowNull: false
      },
      // room id used to send to multiples users
      roomId: {
        type: we.db.Sequelize.BIGINT
      },
      content: {
        type: we.db.Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: we.db.Sequelize.STRING,
        defaultsTo: 'salved'
      }
    },

    options: {
      classMethods: {},
      hooks: {
        beforeCreate: function(record, options, next) {
          // set record status do salved
          if (record.status === 'sending') {
            record.status = 'salved';
          }
          next(null, record);
        }
      }
    }
  }
  return model;
}