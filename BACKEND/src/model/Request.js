const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const Request = sequelize.define(
    'Request',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      item: { type: DataTypes.STRING, allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false },
      remarks: { type: DataTypes.TEXT, allowNull: true },
      finance_remarks: { type: DataTypes.TEXT, allowNull: true },
      finance_rejected_remarks: { type: DataTypes.TEXT, allowNull: true },
      finance_on_hold_remarks: { type: DataTypes.TEXT, allowNull: true },
      status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Pending' },
      date_requested: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      requested_by: { type: DataTypes.STRING, allowNull: false }, // employee_id
      department: { type: DataTypes.STRING, allowNull: true }, // for main office
      branch_id: { type: DataTypes.INTEGER, allowNull: true }, // for branch
      approved_by: { type: DataTypes.STRING, allowNull: true },
      date_approved: { type: DataTypes.DATE, allowNull: true },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      requestor_rejection_remarks: { type: DataTypes.TEXT, allowNull: true },

      // --- NEW FIELDS FOR WORKFLOW/AUDIT ---
      status_history: { type: DataTypes.TEXT, allowNull: true },

      scm_approved_by: { type: DataTypes.STRING, allowNull: true },
      scm_approved_at: { type: DataTypes.DATE, allowNull: true },
      scm_remarks: { type: DataTypes.TEXT, allowNull: true },

      finance_approved_by: { type: DataTypes.STRING, allowNull: true },
      finance_approved_at: { type: DataTypes.DATE, allowNull: true },

      procurement_received_by: { type: DataTypes.STRING, allowNull: true },
      procurement_received_at: { type: DataTypes.DATE, allowNull: true },
      procurement_remarks: { type: DataTypes.TEXT, allowNull: true },

      scm_released_by: { type: DataTypes.STRING, allowNull: true },
      scm_released_at: { type: DataTypes.DATE, allowNull: true },
      release_remarks: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      tableName: 'requests',
      timestamps: false,
      paranoid: false,
    },
  )

  Request.associate = (models) => {
    Request.belongsTo(models.Employee, {
      foreignKey: 'requested_by',
      targetKey: 'employee_id',
      as: 'requester',
    })
    // Optional: branch association if you have a Branch model
  }

  return Request
}
