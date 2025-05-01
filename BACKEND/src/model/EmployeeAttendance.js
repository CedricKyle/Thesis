const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const EmployeeAttendance = sequelize.define(
    'EmployeeAttendance',
    {
      id: {
        type: DataTypes.INTEGER(11),
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
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      time_in: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      time_out: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('Present', 'Late', 'Absent', 'On Leave'),
        defaultValue: 'Absent',
      },
      working_hours: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: true,
      },
      overtime_hours: {
        type: DataTypes.DECIMAL(4, 2),
        defaultValue: 0,
      },
      attendance_type: {
        type: DataTypes.ENUM('regular', 'overtime'),
        defaultValue: 'regular',
        allowNull: false,
      },
      overtime_proof: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      approval_status: {
        type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
        defaultValue: 'Pending',
      },
      approved_by: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      approved_at: {
        type: DataTypes.DATE,
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
      tableName: 'employee_attendance',
      timestamps: false,
      paranoid: false,
      createdAt: false,
      updatedAt: false,
      deletedAt: false,
    },
  )

  EmployeeAttendance.associate = (models) => {
    EmployeeAttendance.belongsTo(models.Employee, {
      foreignKey: 'employee_id',
      as: 'employee',
    })
    EmployeeAttendance.belongsTo(models.Employee, {
      foreignKey: 'approved_by',
      as: 'approver',
    })
  }

  return EmployeeAttendance
}
