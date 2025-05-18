module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize')
  const BranchDistributionRequest = sequelize.define(
    'BranchDistributionRequest',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      request_id: { type: DataTypes.STRING, allowNull: false, unique: true },
      branch_id: { type: DataTypes.INTEGER, allowNull: false },
      branch_name: { type: DataTypes.STRING, allowNull: false },
      remarks: { type: DataTypes.TEXT, allowNull: true },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'fulfilled', 'canceled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      requested_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      approved_at: { type: DataTypes.DATE, allowNull: true },
      rejected_at: { type: DataTypes.DATE, allowNull: true },
      rejection_reason: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      tableName: 'branch_distribution_requests',
      underscored: true,
      timestamps: false,
    },
  )
  return BranchDistributionRequest
}
