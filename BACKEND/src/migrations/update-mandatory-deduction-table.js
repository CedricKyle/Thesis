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
        comment: 'Name of mandatory deduction (SSS, PhilHealth, Pag-IBIG)',
      },
      deduction_type: {
        type: Sequelize.ENUM('SSS', 'PHILHEALTH', 'PAGIBIG'),
        allowNull: false,
        comment: 'Type of government mandatory deduction',
      },
      salary_range_from: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Starting salary bracket',
      },
      salary_range_to: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Ending salary bracket',
      },
      percentage_rate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        comment: 'Percentage rate for this salary bracket',
      },
      employer_share: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        comment: 'Employer contribution percentage',
      },
      employee_share: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        comment: 'Employee contribution percentage',
      },
      minimum_contribution: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Minimum contribution amount if applicable',
      },
      maximum_contribution: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Maximum contribution amount if applicable',
      },
      effective_date: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'When this rate becomes effective',
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When this rate expires',
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
