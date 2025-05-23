'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('inventory_stock_outs', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      item_code: {
        type: Sequelize.STRING(20),
        allowNull: false,
        references: { model: 'inventory', key: 'item_code' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      quantity: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      unit: { type: Sequelize.STRING(20), allowNull: false },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_DATE'),
      },
      reason: { type: Sequelize.STRING(100), allowNull: false },
      remarks: { type: Sequelize.STRING(255), allowNull: true },
      document: { type: Sequelize.STRING, allowNull: true },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('inventory_stock_outs')
  },
}
