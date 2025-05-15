const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const SCMRequestItem = sequelize.define(
    'SCMRequestItem',
    {
      id: {
        type: DataTypes.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      request_id: {
        type: DataTypes.STRING(20),
        allowNull: false,
        references: { model: 'scm_requests', key: 'request_id' },
      },
      item_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      unit: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      unit_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      supply_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      created_at: {
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
      tableName: 'scm_request_items',
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: false,
      deletedAt: 'deleted_at',
    },
  )

  return SCMRequestItem
}
