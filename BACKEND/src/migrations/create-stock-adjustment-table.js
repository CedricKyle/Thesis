'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('stock_adjustments', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'inventory_products', // Make sure this matches your products table name
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      old_quantity: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      new_quantity: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      adjustment_type: { type: Sequelize.ENUM('increase', 'decrease', 'set'), allowNull: false },
      reason: { type: Sequelize.STRING, allowNull: false },
      remarks: { type: Sequelize.STRING },
      document: { type: Sequelize.STRING },
      user: { type: Sequelize.STRING, allowNull: false },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('stock_adjustments')
  },
}
