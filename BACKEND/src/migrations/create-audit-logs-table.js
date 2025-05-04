'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('audit_logs', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      payroll_id: { type: Sequelize.INTEGER, allowNull: false },
      user_id: { type: Sequelize.INTEGER, allowNull: false },
      action: { type: Sequelize.STRING(50), allowNull: false }, // e.g., 'submit', 'approve', 'reject', 'edit'
      remarks: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('audit_logs')
  },
}
