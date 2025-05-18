'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('branch_operation_inventory', {
      branch_id: { type: Sequelize.INTEGER, primaryKey: true, allowNull: false },
      item_code: { type: Sequelize.STRING(20), primaryKey: true, allowNull: false },
      branch_name: { type: Sequelize.STRING(100), allowNull: false },
      item_name: { type: Sequelize.STRING(100), allowNull: false },
      category: { type: Sequelize.STRING(50), allowNull: false },
      quantity: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      unit: { type: Sequelize.STRING(20), allowNull: false },
      reorder_point: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 10 },
      last_updated: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      last_distribution_id: { type: Sequelize.STRING, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('branch_operation_inventory')
  },
}
