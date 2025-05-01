'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop existing table
    await queryInterface.dropTable('employee_deductions')

    // Create new table with updated structure
    return queryInterface.createTable('employee_deductions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      salary_range_from: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      salary_range_to: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      rate: {
        // New field
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      is_percentage: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      deduction_type: {
        type: Sequelize.ENUM('MANDATORY'),
        allowNull: false,
      },
      frequency: {
        type: Sequelize.ENUM('MONTHLY'),
        allowNull: false,
      },
      effective_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATE,
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
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable('employee_deductions')
  },
}
