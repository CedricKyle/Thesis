const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const InventoryReceiving = sequelize.define(
    'InventoryReceiving',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      receiving_id: {
        type: DataTypes.STRING(20),
        unique: true,
        allowNull: false,
      },
      request_id: {
        type: DataTypes.STRING(20),
        allowNull: true,
        references: { model: 'scm_requests', key: 'request_id' },
      },
      supplier_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      received_by: {
        type: DataTypes.STRING(20),
        allowNull: false,
        references: { model: 'employees', key: 'employee_id' },
      },
      receiving_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
      remarks: {
        type: DataTypes.TEXT,
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
      tableName: 'inventory_receivings',
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: false,
      deletedAt: 'deleted_at',
    },
  )

  return InventoryReceiving
}
