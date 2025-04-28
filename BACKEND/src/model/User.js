const { DataTypes } = require('sequelize')
const bcrypt = require('bcrypt')

module.exports = (sequelize) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      employee_id: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: {
            msg: 'Please provide a valid email address',
          },
          notNull: {
            msg: 'Email address is required',
          },
          notEmpty: {
            msg: 'Email address cannot be empty',
          },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'Password is required',
          },
          notEmpty: {
            msg: 'Password cannot be empty',
          },
          len: {
            args: [6, 100],
            msg: 'Password must be between 6 and 100 characters long',
          },
        },
      },
    },
    {
      tableName: 'users',
      timestamps: false,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            user.password = await bcrypt.hash(user.password, 10)
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            user.password = await bcrypt.hash(user.password, 10)
          }
        },
      },
    },
  )

  // Instance method to check password
  User.prototype.validatePassword = async function (password) {
    return bcrypt.compare(password, this.password)
  }

  // Method to return safe user data (excluding password)
  User.prototype.toJSON = function () {
    const values = { ...this.get() }
    delete values.password
    return values
  }

  // Static method to safely create a user
  User.createUser = async function (userData) {
    try {
      const user = await this.create(userData)
      return user.toJSON()
    } catch (error) {
      // Enhanced error handling
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new Error('Email or Employee ID already exists')
      }
      if (error.name === 'SequelizeValidationError') {
        throw new Error(error.errors[0].message)
      }
      throw error
    }
  }

  // Static method to find user by email (safely)
  User.findByEmail = async function (email) {
    const user = await this.findOne({
      where: { email },
      include: [
        {
          association: 'employee',
          attributes: ['first_name', 'last_name', 'role_id'],
        },
      ],
    })
    return user ? user.toJSON() : null
  }

  return User
}
