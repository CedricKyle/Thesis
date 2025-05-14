'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('scm_requests', 'payment_status', {
      type: Sequelize.ENUM('For Release', 'Released'),
      defaultValue: 'For Release',
    })
    await queryInterface.addColumn('scm_requests', 'released_by', {
      type: Sequelize.STRING(20),
      allowNull: true,
      references: { model: 'employees', key: 'employee_id' },
    })
    await queryInterface.addColumn('scm_requests', 'released_at', {
      type: Sequelize.DATE,
      allowNull: true,
    })
    await queryInterface.addColumn('scm_requests', 'receipt_url', {
      type: Sequelize.STRING(255),
      allowNull: true,
    })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('scm_requests', 'payment_status')
    await queryInterface.removeColumn('scm_requests', 'released_by')
    await queryInterface.removeColumn('scm_requests', 'released_at')
    await queryInterface.removeColumn('scm_requests', 'receipt_url')
  },
}
