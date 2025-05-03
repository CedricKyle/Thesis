module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('payroll_deductions', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      payroll_id: { type: Sequelize.INTEGER, allowNull: false },
      deduction_type: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.STRING },
      amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      employee_share: { type: Sequelize.DECIMAL(10, 2) },
      employer_share: { type: Sequelize.DECIMAL(10, 2) },
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
    })
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('payroll_deductions')
  },
}
