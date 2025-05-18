module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize')

  const BranchDistributionRequest = sequelize.define(
    'branch_distribution_request',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      request_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      branch_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      branch_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'fulfilled', 'canceled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      created_by: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      requested_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      approved_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      rejected_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      processed_by: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      processed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      process_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      fulfilled_by: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      fulfilled_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'branch_distribution_requests',
      underscored: true,
      paranoid: true, // Soft delete support
      timestamps: false, // Disable timestamps completely
      hooks: {
        // Log when model is synced with database
        afterSync: () => {
          console.log('BranchDistributionRequest model synced with database');
        }
      }
    }
  )

  return BranchDistributionRequest
} 