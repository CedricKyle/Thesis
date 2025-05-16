const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const InventoryReceivingItem = sequelize.define(
    'InventoryReceivingItem',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      receiving_id: {
        type: DataTypes.STRING(20),
        allowNull: false,
        references: { model: 'inventory_receivings', key: 'receiving_id' },
      },
      item_code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        references: { model: 'inventory', key: 'item_code' },
      },
      item_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      quantity_received: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      unit: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      unit_cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      total_cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
    },
    {
      tableName: 'inventory_receiving_items',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
    },
  )

  return InventoryReceivingItem
}
