const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const StockIn = sequelize.define(
    'StockIn',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      product_id: { type: DataTypes.INTEGER, allowNull: false },
      quantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      unit: { type: DataTypes.STRING(20), allowNull: false },
      date: { type: DataTypes.DATEONLY, allowNull: false },
      supplier: { type: DataTypes.STRING(100), allowNull: true },
      remarks: { type: DataTypes.STRING(255), allowNull: true },
      document: { type: DataTypes.STRING, allowNull: true },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
    },
    {
      tableName: 'stock_ins',
      timestamps: false,
    },
  )
  return StockIn
}
