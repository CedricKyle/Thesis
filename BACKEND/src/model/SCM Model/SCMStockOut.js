const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const InventoryStockOut = sequelize.define(
    'InventoryStockOut',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      item_code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        references: { model: 'inventory', key: 'item_code' },
      },
      quantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      unit: { type: DataTypes.STRING(20), allowNull: false },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_DATE'),
      },
      reason: { type: DataTypes.STRING(100), allowNull: false },
      remarks: { type: DataTypes.STRING(255), allowNull: true },
      document: { type: DataTypes.STRING, allowNull: true },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
    },
    {
      tableName: 'inventory_stock_outs',
      timestamps: false,
    },
  )
  return InventoryStockOut
}
