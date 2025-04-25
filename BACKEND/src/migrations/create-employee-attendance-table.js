module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('employee_attendance', {
      id: {
        type: Sequelize.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      employee_id: {
        type: Sequelize.STRING(20),
        allowNull: false,
        references: {
          model: 'employees',
          key: 'employee_id',
        },
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      time_in: {
        type: Sequelize.TIME,
        allowNull: true,
      },
      time_out: {
        type: Sequelize.TIME,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('Present', 'Late', 'Absent', 'On Leave'),
        defaultValue: 'Absent',
      },
      working_hours: {
        type: Sequelize.DECIMAL(4, 2),
        allowNull: true,
      },
      overtime_hours: {
        type: Sequelize.DECIMAL(4, 2),
        defaultValue: 0,
      },
      approval_status: {
        type: Sequelize.ENUM('Pending', 'Approved', 'Rejected'),
        defaultValue: 'Pending',
      },
      approved_by: {
        type: Sequelize.STRING(20),
        allowNull: true,
        references: {
          model: 'employees',
          key: 'employee_id',
        },
      },
      approved_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('employee_attendance')
  },
}
