'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('requests', 'status_history', {
      type: Sequelize.TEXT,
      allowNull: true,
    })
    await queryInterface.addColumn('requests', 'scm_approved_by', {
      type: Sequelize.STRING,
      allowNull: true,
    })
    await queryInterface.addColumn('requests', 'scm_approved_at', {
      type: Sequelize.DATE,
      allowNull: true,
    })
    await queryInterface.addColumn('requests', 'scm_remarks', {
      type: Sequelize.TEXT,
      allowNull: true,
    })
    await queryInterface.addColumn('requests', 'finance_approved_by', {
      type: Sequelize.STRING,
      allowNull: true,
    })
    await queryInterface.addColumn('requests', 'finance_approved_at', {
      type: Sequelize.DATE,
      allowNull: true,
    })
    await queryInterface.addColumn('requests', 'procurement_received_by', {
      type: Sequelize.STRING,
      allowNull: true,
    })
    await queryInterface.addColumn('requests', 'procurement_received_at', {
      type: Sequelize.DATE,
      allowNull: true,
    })
    await queryInterface.addColumn('requests', 'procurement_remarks', {
      type: Sequelize.TEXT,
      allowNull: true,
    })
    await queryInterface.addColumn('requests', 'scm_released_by', {
      type: Sequelize.STRING,
      allowNull: true,
    })
    await queryInterface.addColumn('requests', 'scm_released_at', {
      type: Sequelize.DATE,
      allowNull: true,
    })
    await queryInterface.addColumn('requests', 'release_remarks', {
      type: Sequelize.TEXT,
      allowNull: true,
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('requests', 'status_history')
    await queryInterface.removeColumn('requests', 'scm_approved_by')
    await queryInterface.removeColumn('requests', 'scm_approved_at')
    await queryInterface.removeColumn('requests', 'scm_remarks')
    await queryInterface.removeColumn('requests', 'finance_approved_by')
    await queryInterface.removeColumn('requests', 'finance_approved_at')
    await queryInterface.removeColumn('requests', 'procurement_received_by')
    await queryInterface.removeColumn('requests', 'procurement_received_at')
    await queryInterface.removeColumn('requests', 'procurement_remarks')
    await queryInterface.removeColumn('requests', 'scm_released_by')
    await queryInterface.removeColumn('requests', 'scm_released_at')
    await queryInterface.removeColumn('requests', 'release_remarks')
  },
}
