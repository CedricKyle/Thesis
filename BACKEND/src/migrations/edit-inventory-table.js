module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('inventory_products', 'price', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    })
    await queryInterface.addColumn('inventory_products', 'status', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'active',
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('inventory_products', 'price')
    await queryInterface.removeColumn('inventory_products', 'status')
  },
}
