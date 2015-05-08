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
       * CreatorId
       */
      creator: {
        type: we.db.Sequelize.BIGINT,
        allowNull: false
      }
    },

    options: {
      classMethods: {}
    }
  }
  return model;
}
