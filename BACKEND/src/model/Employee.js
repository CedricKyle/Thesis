const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const Employee = sequelize.define(
    'Employee',
    {
      id: {
        type: DataTypes.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      employee_id: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      first_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      middle_name: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      last_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      full_name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      department: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      position_id: {
        type: DataTypes.INTEGER(11),
        allowNull: true,
        references: { model: 'positions', key: 'id' },
      },
      date_of_hire: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      date_of_birth: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      gender: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      contact_number: {
        type: DataTypes.STRING(15),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      profile_image_path: {
        type: DataTypes.STRING(255),
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
      role_id: {
        type: DataTypes.INTEGER(11),
        allowNull: true,
        references: { model: 'roles', key: 'id' },
      },
    },
    {
      tableName: 'employees',
      timestamps: false,
      paranoid: false,
      createdAt: false,
      updatedAt: false,
      deletedAt: false,
    },
  )

  Employee.associate = (models) => {
    Employee.belongsTo(models.Role, {
      foreignKey: 'role_id',
      as: 'roleInfo',
    })
    Employee.belongsTo(models.Position, {
      foreignKey: 'position_id',
      as: 'positionInfo',
    })
  }

  return Employee
}
