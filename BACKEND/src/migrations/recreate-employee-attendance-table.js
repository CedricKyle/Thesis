module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop the old table if it exists
    await queryInterface.dropTable('employee_attendance')

    // Create the new table
    await queryInterface.createTable('employee_attendance', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      employee_id: {
        type: Sequelize.STRING(20),
        allowNull: false,
        references: { model: 'employees', key: 'employee_id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      schedule_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'employee_schedules', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      start_time: {
        type: Sequelize.TIME,
        allowNull: true,
      },
      end_time: {
        type: Sequelize.TIME,
        allowNull: true,
      },
      hours_worked: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
      },
      regular_hours: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
      },
      overtime_hours: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
      },
      late_minutes: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      absent: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      tardiness_deduction: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      absent_deduction: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      holiday_pay: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      overtime_proof: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      approval_status: {
        type: Sequelize.ENUM('Pending', 'Approved', 'Rejected'),
        defaultValue: 'Pending',
      },
      approved_by: {
        type: Sequelize.STRING(150),
        allowNull: true,
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
      updated_at: {
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
