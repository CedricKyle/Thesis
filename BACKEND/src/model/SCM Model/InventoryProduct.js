const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const InventoryProduct = sequelize.define(
    'InventoryProduct',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(100), allowNull: false },
      category: { type: DataTypes.STRING(50), allowNull: false },
      unit: { type: DataTypes.STRING(20), allowNull: false },
      quantity: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
      max_quantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      expiry_date: { type: DataTypes.DATEONLY, allowNull: true },
      image: { type: DataTypes.STRING, allowNull: true },
      price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'active' },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'inventory_products',
      timestamps: false,
    },
  )
  return InventoryProduct
}
