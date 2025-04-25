const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const Role = sequelize.define(
    'Role',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      role_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      department: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      permissions: {
        type: DataTypes.TEXT,
        allowNull: false,
        get() {
          const raw = this.getDataValue('permissions')
          try {
            // Handle both string array "[1,2,3]" and regular array formats
            return typeof raw === 'string' ? JSON.parse(raw) : raw
          } catch (e) {
            console.error('Error parsing permissions:', e)
            return []
          }
        },
        set(value) {
          // Ensure we always store as a string
          this.setDataValue(
            'permissions',
            typeof value === 'string' ? value : JSON.stringify(value),
          )
        },
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'roles',
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    },
  )

  return Role
}
