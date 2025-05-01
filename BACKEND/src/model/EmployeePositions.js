const { DataTypes } = require('sequelize')
module.exports = (sequelize) => {
  const Position = sequelize.define(
    'Position',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      position_title: { type: DataTypes.STRING, allowNull: false },
      department: { type: DataTypes.STRING, allowNull: false },
      branch: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Main Office' },
      rate_per_hour: { type: DataTypes.FLOAT, allowNull: false },
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
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'positions',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      paranoid: true,
      deletedAt: 'deleted_at',
    },
  )
  return Position
}
