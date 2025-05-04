'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // First, drop the existing table
      await queryInterface.dropTable('employee_schedules')

      // Then create the table with the correct structure
      await queryInterface.createTable('employee_schedules', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        employee_id: {
          type: Sequelize.STRING(20),
          allowNull: false,
          references: {
            model: 'employees',
            key: 'employee_id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        schedule_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'available_schedules',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        remarks: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
        },
        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
      })

      // Add indexes for better performance
      await queryInterface.addIndex('employee_schedules', ['employee_id'])
      await queryInterface.addIndex('employee_schedules', ['schedule_id'])

      return Promise.resolve()
    } catch (error) {
      return Promise.reject(error)
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Drop the table in the down migration
      await queryInterface.dropTable('employee_schedules')

      // Recreate the table with the old structure
      await queryInterface.createTable('employee_schedules', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        employee_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'employees',
            key: 'id',
          },
        },
        schedule_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'available_schedules',
            key: 'id',
          },
        },
        remarks: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
      })

      return Promise.resolve()
    } catch (error) {
      return Promise.reject(error)
    }
  },
}
