
/**
 * Users invited to room
 *
 * @module      :: Model
 */
module.exports = function Model(we) {
  return {
    definition: {
      status: {
        type: we.db.Sequelize.STRING,
        defaultValue: 'send',
        allowNull: false,
        isIn: [ ['send', 'ignored'] ]
      }
    }
  };
};