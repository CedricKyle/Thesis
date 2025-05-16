'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('deliveries', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      request_id: {
        type: Sequelize.STRING(20),
        allowNull: false,
        references: {
          model: 'scm_requests',
          key: 'request_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      supplier: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      items: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      delivery_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('Pending', 'Received', 'Canceled'),
        allowNull: false,
        defaultValue: 'Pending',
      },
      received_by: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      received_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      receipt_url: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      canceled_by: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      canceled_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      cancel_reason: {
        type: Sequelize.STRING(255),
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
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('deliveries')
  },
}
