const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const StockAdjustment = sequelize.define(
    'StockAdjustment',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      product_id: { type: DataTypes.INTEGER, allowNull: false },
      old_quantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      new_quantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      adjustment_type: { type: DataTypes.ENUM('increase', 'decrease', 'set'), allowNull: false },
      reason: { type: DataTypes.STRING, allowNull: false },
      remarks: { type: DataTypes.STRING },
      document: { type: DataTypes.STRING },
      user: { type: DataTypes.STRING, allowNull: false },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'stock_adjustments',
      timestamps: false,
      paranoid: true,
      deletedAt: 'deleted_at',
    },
  )

  // Association
  StockAdjustment.associate = (models) => {
    StockAdjustment.belongsTo(models.InventoryProduct, { foreignKey: 'product_id' })
  }

  return StockAdjustment
}
