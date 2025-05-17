const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const Supplier = sequelize.define(
    'Supplier',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      full_name: { type: DataTypes.STRING(100), allowNull: false },
      contact_number: { type: DataTypes.STRING(20), allowNull: false },
      supply_type: { type: DataTypes.STRING(100), allowNull: false },
    },
    {
      tableName: 'suppliers',
      underscored: true,
      timestamps: true,
      paranoid: true, // enables soft delete (archived)
    },
  )
  return Supplier
}
