module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize')
  const BranchOperationInventory = sequelize.define(
    'BranchOperationInventory',
    {
      branch_id: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
      item_code: { type: DataTypes.STRING(20), primaryKey: true, allowNull: false },
      branch_name: { type: DataTypes.STRING(100), allowNull: false },
      item_name: { type: DataTypes.STRING(100), allowNull: false },
      category: { type: DataTypes.STRING(50), allowNull: false },
      quantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      unit: { type: DataTypes.STRING(20), allowNull: false },
      reorder_point: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 },
      last_updated: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
      last_distribution_id: { type: DataTypes.STRING, allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      tableName: 'branch_operation_inventory',
      underscored: true,
      paranoid: false,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  )
  return BranchOperationInventory
}
