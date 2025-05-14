const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const SCMRequest = sequelize.define(
    'SCMRequest',
    {
      id: {
        type: DataTypes.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      request_id: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      request_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
      request_status: {
        type: DataTypes.ENUM('Pending', 'Submitted', 'Approved', 'Rejected', 'Cancelled'),
        allowNull: false,
        defaultValue: 'Pending',
      },
      prepared_by: {
        type: DataTypes.STRING(20),
        allowNull: false,
        references: { model: 'employees', key: 'employee_id' },
      },
      approved_by: {
        type: DataTypes.STRING(20),
        allowNull: true,
        references: { model: 'employees', key: 'employee_id' },
      },
      total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
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
      tableName: 'scm_requests',
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: false,
      deletedAt: 'deleted_at',
    },
  )

  return SCMRequest
}
