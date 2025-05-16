'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('deliveries', 'paid_status', {
      type: Sequelize.ENUM('Unpaid', 'Paid'),
      allowNull: false,
      defaultValue: 'Unpaid',
      after: 'receipt_url', // adjust as needed
    })
    await queryInterface.addColumn('deliveries', 'paid_at', {
      type: Sequelize.DATE,
      allowNull: true,
      after: 'paid_status',
    })
    await queryInterface.addColumn('deliveries', 'paid_by', {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'paid_at',
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('deliveries', 'paid_by')
    await queryInterface.removeColumn('deliveries', 'paid_at')
    await queryInterface.removeColumn('deliveries', 'paid_status')
    // Remove ENUM type if needed (for MySQL/Postgres)
    if (queryInterface.sequelize.options.dialect === 'mysql') {
      await queryInterface.sequelize.query('ALTER TABLE deliveries DROP COLUMN paid_status;')
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_deliveries_paid_status";')
    }
  },
}
