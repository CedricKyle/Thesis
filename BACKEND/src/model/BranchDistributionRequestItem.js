module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize')

  const BranchDistributionRequestItem = sequelize.define(
    'branch_distribution_request_item',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      request_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'branch_distribution_requests',
          key: 'request_id',
        },
      },
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      product_code: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      product_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      unit: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      fulfilled_quantity: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
    },
    {
      tableName: 'branch_distribution_request_items',
      underscored: true,
      timestamps: true,
      createdAt: false,
      updatedAt: false,
      hooks: {
        afterSync: () => {
          console.log('BranchDistributionRequestItem model synced with database');
        }
      }
    }
  )

  return BranchDistributionRequestItem
} 