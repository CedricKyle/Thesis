'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('roles', {
      id: {
        type: Sequelize.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      role_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        collate: 'utf8mb4_general_ci',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        collate: 'utf8mb4_general_ci',
      },
      department: {
        type: Sequelize.STRING(100),
        allowNull: false,
        collate: 'utf8mb4_general_ci',
      },
      permissions: {
        type: Sequelize.TEXT('long'),
        allowNull: true,
        collate: 'utf8mb4_bin', // Using binary collation for JSON data
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        onUpdate: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    })

    // Add any necessary indexes
    await queryInterface.addIndex('roles', ['role_name'], {
      unique: true,
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('roles')
  },
}
