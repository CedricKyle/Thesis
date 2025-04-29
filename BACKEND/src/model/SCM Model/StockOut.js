const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const StockOut = sequelize.define(
    'StockOut',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      product_id: { type: DataTypes.INTEGER, allowNull: false },
      quantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      unit: { type: DataTypes.STRING(20), allowNull: false },
      date: { type: DataTypes.DATEONLY, allowNull: false },
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
      tableName: 'stock_outs',
      timestamps: false,
    },
  )
  return StockOut
}
