const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const Leave = sequelize.define(
    'Leave',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      employee_id: { type: DataTypes.STRING(20), allowNull: false },
      date_from: { type: DataTypes.DATEONLY, allowNull: false },
      date_to: { type: DataTypes.DATEONLY, allowNull: false },
      type: { type: DataTypes.STRING(50), allowNull: false },
      status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'Pending' },
      is_paid: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      remarks: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      tableName: 'leaves',
      underscored: true,
      timestamps: true,
      paranoid: true,
    },
  )
  

  return Leave
}
