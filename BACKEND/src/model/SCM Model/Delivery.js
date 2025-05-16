const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const Delivery = sequelize.define(
    'Delivery',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      request_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: { model: 'scm_requests', key: 'request_id' },
      },
      supplier: { type: DataTypes.STRING, allowNull: false },
      items: { type: DataTypes.JSON, allowNull: false },
      delivery_date: { type: DataTypes.DATE, allowNull: false },
      status: { type: DataTypes.ENUM('Pending', 'Received', 'Canceled'), defaultValue: 'Pending' },
      received_by: { type: DataTypes.STRING },
      received_at: { type: DataTypes.DATE },
      receipt_url: { type: DataTypes.STRING },
      canceled_by: { type: DataTypes.STRING },
      canceled_at: { type: DataTypes.DATE },
      cancel_reason: { type: DataTypes.STRING },
      paid_status: { type: DataTypes.ENUM('Unpaid', 'Paid'), defaultValue: 'Unpaid' },
      paid_at: { type: DataTypes.DATE },
      paid_by: { type: DataTypes.STRING },
    },
    {
      tableName: 'deliveries',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  )

  return Delivery
}
