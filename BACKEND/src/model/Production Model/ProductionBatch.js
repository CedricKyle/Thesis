const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const ProductionBatch = sequelize.define(
    'ProductionBatch',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      batch_number: {
        type: DataTypes.STRING(20),
        unique: true,
        allowNull: false,
      },
      product_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      primary_stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      secondary_stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      reorder_point: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      unit: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      production_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      expiry_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      production_manager: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('active', 'completed', 'cancelled'),
        defaultValue: 'active',
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
    },
    {
      tableName: 'production_batches',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  )

  return ProductionBatch
}
