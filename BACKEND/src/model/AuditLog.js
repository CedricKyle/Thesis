module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define(
    'AuditLog',
    {
      payroll_id: DataTypes.INTEGER,
      user_id: DataTypes.INTEGER,
      action: DataTypes.STRING,
      remarks: DataTypes.TEXT,
      created_at: DataTypes.DATE,
    },
    {
      tableName: 'audit_logs',
      timestamps: false,
    },
  )
  return AuditLog
}
