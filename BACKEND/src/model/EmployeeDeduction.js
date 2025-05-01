const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const EmployeeDeduction = sequelize.define(
    'EmployeeDeduction',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      deduction_type: {
        type: DataTypes.ENUM('SSS', 'PHILHEALTH', 'PAGIBIG'),
        allowNull: false,
      },
      salary_range_from: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      salary_range_to: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      percentage_rate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      employer_share: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      employee_share: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      minimum_contribution: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      maximum_contribution: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      effective_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'employee_deductions',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      paranoid: true,
      deletedAt: 'deleted_at',
    },
  )
  return EmployeeDeduction
}
