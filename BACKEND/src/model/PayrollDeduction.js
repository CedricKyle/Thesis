module.exports = (sequelize, DataTypes) => {
  const PayrollDeduction = sequelize.define(
    'PayrollDeduction',
    {
      payroll_id: { type: DataTypes.INTEGER, allowNull: false },
      deduction_type: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.STRING },
      amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      employee_share: { type: DataTypes.DECIMAL(10, 2) },
      employer_share: { type: DataTypes.DECIMAL(10, 2) },
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
    },
    {
      tableName: 'payroll_deductions',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  )

  PayrollDeduction.associate = (models) => {
    PayrollDeduction.belongsTo(models.Payroll, { foreignKey: 'payroll_id' })
  }

  return PayrollDeduction
}
