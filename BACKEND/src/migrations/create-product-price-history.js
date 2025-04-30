module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('product_price_histories', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'inventory_products',
          key: 'id',
        },
      },
      old_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      new_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      changed_by: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      reason: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      changed_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    })

    // Add foreign key constraint
    await queryInterface.addConstraint('product_price_histories', {
      fields: ['product_id'],
      type: 'foreign key',
      name: 'fk_price_history_product',
      references: {
        table: 'inventory_products',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('product_price_histories')
  },
}
