const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const ProductPriceHistory = sequelize.define(
    'ProductPriceHistory',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      product_id: { type: DataTypes.INTEGER, allowNull: false },
      old_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      new_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      changed_by: { type: DataTypes.STRING(100), allowNull: false },
      reason: { type: DataTypes.STRING(255), allowNull: true },
      changed_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
    },
    {
      tableName: 'product_price_histories',
      timestamps: false,
    },
  )
  return ProductPriceHistory
}
