const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const AvailableSchedule = sequelize.define(
    'AvailableSchedule',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      type: { type: DataTypes.STRING, allowNull: false },
      time_in: { type: DataTypes.STRING, allowNull: false },
      time_out: { type: DataTypes.STRING, allowNull: false },
      work_days: { type: DataTypes.JSON, allowNull: false }, // Array of days
      day_off: { type: DataTypes.JSON, allowNull: false }, // Array of days
      remarks: { type: DataTypes.STRING, allowNull: true },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'available_schedules',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      paranoid: true,
      deletedAt: 'deleted_at',
    },
  )
  return AvailableSchedule
}
