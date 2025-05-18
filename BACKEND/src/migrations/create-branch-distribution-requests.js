'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('branch_distribution_requests', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      request_id: { type: Sequelize.STRING, allowNull: false, unique: true },
      branch_id: { type: Sequelize.INTEGER, allowNull: false },
      branch_name: { type: Sequelize.STRING, allowNull: false },
      remarks: { type: Sequelize.TEXT, allowNull: true },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'fulfilled', 'canceled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      requested_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      approved_at: { type: Sequelize.DATE, allowNull: true },
      rejected_at: { type: Sequelize.DATE, allowNull: true },
      rejection_reason: { type: Sequelize.TEXT, allowNull: true },
    })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('branch_distribution_requests')
  },
}
