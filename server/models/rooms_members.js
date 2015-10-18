/**
 * Members of room association room
 *
 * @module      :: Model
 */
module.exports = function Model(we) {
  return {
    definition: {
      isAdmin: {
        type: we.db.Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      }
    }
  }
}