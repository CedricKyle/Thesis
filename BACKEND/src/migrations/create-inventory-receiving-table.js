'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('inventory_receivings', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      receiving_id: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      request_id: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      supplier_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      received_by: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      receiving_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('inventory_receivings')
  },
}
