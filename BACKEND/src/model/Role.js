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
        defaultValue: '[]',
        get() {
          const raw = this.getDataValue('permissions')
          try {
            return typeof raw === 'string' ? JSON.parse(raw) : Array.isArray(raw) ? raw : []
          } catch (e) {
            console.error('Error parsing permissions:', e)
            return []
          }
        },
        set(value) {
          let valueToStore = value
          if (Array.isArray(value)) {
            valueToStore = JSON.stringify(value)
          } else if (typeof value === 'string') {
            // Validate if it's a valid JSON string
            try {
              JSON.parse(value)
              valueToStore = value
            } catch (e) {
              valueToStore = '[]'
            }
          } else {
            valueToStore = '[]'
          }
          this.setDataValue('permissions', valueToStore)
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

  Role.associate = (models) => {
    Role.hasMany(models.Employee, { foreignKey: 'role_id', as: 'employees' })
  }

  return Role
}
