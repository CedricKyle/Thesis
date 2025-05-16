const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const ProductionFinishedGood = sequelize.define(
    'ProductionFinishedGood',
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
      item_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      produced_qty: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      unit: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      batch_no: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      expiry_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      image: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'production_finished_goods',
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    },
  )

  return ProductionFinishedGood
}
