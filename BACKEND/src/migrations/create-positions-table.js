'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('positions', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      position_title: { type: Sequelize.STRING, allowNull: false },
      department: { type: Sequelize.STRING, allowNull: false },
      branch: { type: Sequelize.STRING, allowNull: false, defaultValue: 'Main Office' },
      rate_per_hour: { type: Sequelize.FLOAT, allowNull: false },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('positions')
  },
}
