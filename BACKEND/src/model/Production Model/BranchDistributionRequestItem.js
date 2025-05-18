module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize')
  const BranchDistributionRequestItem = sequelize.define(
    'BranchDistributionRequestItem',
    {
      request_id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
        references: { model: 'branch_distribution_requests', key: 'request_id' },
      },
      item_code: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
      item_name: { type: DataTypes.STRING, allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      unit: { type: DataTypes.STRING, allowNull: false },
      category: { type: DataTypes.STRING, allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      fulfilled_quantity: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    },
    {
      tableName: 'branch_distribution_request_items',
      underscored: true,
      timestamps: false,
    },
  )
  return BranchDistributionRequestItem
}
