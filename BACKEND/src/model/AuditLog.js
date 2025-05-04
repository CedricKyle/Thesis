module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define(
    'AuditLog',
    {
      payroll_id: DataTypes.INTEGER,
      user_id: DataTypes.INTEGER,
      employee_id: DataTypes.STRING(20),
      action: DataTypes.STRING,
      remarks: DataTypes.TEXT,
      created_at: DataTypes.DATE,
    },
    {
      tableName: 'audit_logs',
      timestamps: false,
    },
  )

  // Add associate method
  AuditLog.associate = (models) => {
    AuditLog.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' })
    AuditLog.belongsTo(models.Employee, {
      foreignKey: 'employee_id',
      targetKey: 'employee_id',
      as: 'employee',
    })
    AuditLog.belongsTo(models.Employee, {
      foreignKey: 'user_id',
      targetKey: 'employee_id',
      as: 'actor',
    })
    AuditLog.belongsTo(models.Payroll, { foreignKey: 'payroll_id', as: 'payroll' })
  }

  return AuditLog
}
