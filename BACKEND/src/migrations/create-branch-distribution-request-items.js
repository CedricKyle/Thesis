'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('branch_distribution_request_items', {
      request_id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      item_code: { type: Sequelize.STRING, primaryKey: true, allowNull: false },
      item_name: { type: Sequelize.STRING, allowNull: false },
      quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      unit: { type: Sequelize.STRING, allowNull: false },
      category: { type: Sequelize.STRING, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      fulfilled_quantity: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
    })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('branch_distribution_request_items')
  },
}
