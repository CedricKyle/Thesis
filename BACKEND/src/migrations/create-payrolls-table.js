module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('payrolls', {
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
      month: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      quarter: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      week: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      payroll_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      days_present: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      total_hours_worked: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      regular_hour_pay: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      days_absent: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      absent_deduction: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      overtime_pay: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      tardiness_deduction: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      status: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0, // 0 = Draft
      },
      allowance: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      bonus: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      paid_holiday: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      deduction: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      gross_pay: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      salary_before_tax: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      net_pay: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      tax_deduction: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      remarks: {
        type: Sequelize.TEXT,
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
    await queryInterface.dropTable('payrolls')
  },
}
