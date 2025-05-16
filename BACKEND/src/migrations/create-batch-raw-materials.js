'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('batch_raw_materials', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      batch_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      inventory_item_code: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      quantity_used: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
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

    // Add indexes
    await queryInterface.addIndex('batch_raw_materials', ['batch_id'])
    await queryInterface.addIndex('batch_raw_materials', ['inventory_item_code'])
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('batch_raw_materials')
  },
}
