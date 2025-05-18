const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const BranchInventory = sequelize.define(
    'BranchInventory',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      branch_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      branch_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      item_code: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      item_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      unit: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      reorder_point: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10,
      },
      last_updated: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
      last_distribution_id: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
          model: 'branch_distribution_requests',
          key: 'request_id',
        },
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'branch_inventory',
      underscored: true,
      paranoid: false,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          unique: true,
          fields: ['branch_id', 'item_code'],
          name: 'branch_inventory_unique_item',
        },
      ],
    }
  )

  return BranchInventory
} 