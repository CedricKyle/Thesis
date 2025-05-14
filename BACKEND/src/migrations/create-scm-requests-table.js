'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('scm_requests', {
      id: {
        type: Sequelize.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      request_id: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      request_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      request_status: {
        type: Sequelize.ENUM('Pending', 'Approved', 'Rejected'),
        allowNull: false,
        defaultValue: 'Pending',
      },
      prepared_by: {
        type: Sequelize.STRING(20),
        allowNull: false,
        references: {
          model: 'employees',
          key: 'employee_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      approved_by: {
        type: Sequelize.STRING(20),
        allowNull: true,
        references: {
          model: 'employees',
          key: 'employee_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      total_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
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
    await queryInterface.dropTable('scm_requests')
  },
}
