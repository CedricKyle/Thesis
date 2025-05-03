const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const Payroll = sequelize.define(
    'Payroll',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      employee_id: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      month: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      quarter: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      week: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      payroll_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      days_present: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      total_hours_worked: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      regular_hour_pay: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      days_absent: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      absent_deduction: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      overtime_pay: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      tardiness_deduction: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      overtime_hours: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      tardiness_hours: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      allowance: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      bonus: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      paid_holiday: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      deduction: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      gross_pay: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      salary_before_tax: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      net_pay: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      tax_deduction: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      remarks: {
        type: DataTypes.TEXT,
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
      tableName: 'payrolls',
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    },
  )

  Payroll.associate = (models) => {
    Payroll.belongsTo(models.Employee, {
      as: 'employee',
      foreignKey: 'employee_id',
      targetKey: 'employee_id',
    })
    Payroll.hasMany(models.PayrollDeduction, {
      as: 'deductions',
      foreignKey: 'payroll_id',
    })
  }

  return Payroll
}
