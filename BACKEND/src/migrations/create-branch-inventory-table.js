'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('branch_inventory', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      branch_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      branch_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      item_code: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      item_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      category: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      quantity: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      unit: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      reorder_point: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 10,
      },
      last_updated: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      last_distribution_id: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'branch_distribution_requests',
          key: 'request_id',
        },
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
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
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    })

    // Add a unique composite index for branch_id and item_code
    await queryInterface.addIndex('branch_inventory', ['branch_id', 'item_code'], {
      unique: true,
      name: 'branch_inventory_unique_item',
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('branch_inventory')
  },
} 