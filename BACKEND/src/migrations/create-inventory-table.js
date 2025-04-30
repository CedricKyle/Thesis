module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('inventory_products', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      category: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      unit: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      quantity: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },
      max_quantity: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      expiry_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      image: {
        type: Sequelize.STRING,
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
    await queryInterface.dropTable('inventory_products')
  },
}
