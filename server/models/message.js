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
      fromId: {
        type: we.db.Sequelize.BIGINT,
        allowNull: false
      },
      // send to user id
      toId: {
        type: we.db.Sequelize.BIGINT,
      },
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

    options: {
      classMethods: {},
      hooks: {
        beforeCreate: function(record, options, next) {
          // sanitize
          we.sanitizer.sanitizeAllAttr(record);
          // set record status do salved
          if (record.status === 'sending') {
            record.status = 'salved';
          }
          next(null, record);
        },
        beforeUpdate: function(record, options, next) {
          we.sanitizer.sanitizeAllAttr(record);
          next(null, record);
        },
      }
    }
  }
  return model;
}