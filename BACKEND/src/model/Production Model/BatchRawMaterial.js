const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const BatchRawMaterial = sequelize.define(
    'BatchRawMaterial',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      batch_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      inventory_item_code: {
        // Reference to SCM inventory
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      quantity_used: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
    },
    {
      tableName: 'batch_raw_materials',
      timestamps: false,
    },
  )

  return BatchRawMaterial
}
