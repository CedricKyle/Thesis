const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const EmployeeAttendance = sequelize.define(
    'EmployeeAttendance',
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
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      schedule_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'employee_schedules',
          key: 'id',
        },
      },
      start_time: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      end_time: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      hours_worked: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      regular_hours: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      overtime_hours: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      late_minutes: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      absent: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      tardiness_deduction: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      absent_deduction: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      holiday_pay: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      overtime_proof: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      approval_status: {
        type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
        defaultValue: 'Pending',
      },
      ot_approval_status: {
        type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
        allowNull: true,
        defaultValue: null,
      },
      ot_approved_by: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      ot_approved_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      approved_by: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      approved_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      ot_remarks: {
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
      status: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
    },
    {
      tableName: 'employee_attendance',
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    },
  )

  EmployeeAttendance.associate = (models) => {
    EmployeeAttendance.belongsTo(models.Employee, {
      as: 'employee',
      foreignKey: 'employee_id',
      targetKey: 'employee_id',
    })
    EmployeeAttendance.belongsTo(models.EmployeeSchedule, {
      foreignKey: 'schedule_id',
      as: 'schedule',
    })
    EmployeeAttendance.belongsTo(models.Employee, {
      foreignKey: 'approved_by',
      as: 'approver',
    })
  }

  return EmployeeAttendance
}
