const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const EmployeeSchedule = sequelize.define(
    'EmployeeSchedule',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      employee_id: {
        type: DataTypes.STRING(20),
        allowNull: false,
        references: {
          model: 'employees',
          key: 'employee_id',
        },
      },
      schedule_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'available_schedules',
          key: 'id',
        },
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
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'employee_schedules',
      timestamps: false,
      paranoid: true,
    },
  )

  // Define associations
  EmployeeSchedule.associate = (models) => {
    EmployeeSchedule.belongsTo(models.Employee, {
      foreignKey: 'employee_id',
      targetKey: 'employee_id',
      as: 'employee',
    })
    EmployeeSchedule.belongsTo(models.AvailableSchedule, {
      foreignKey: 'schedule_id',
      as: 'schedule',
    })
  }

  return EmployeeSchedule
}
