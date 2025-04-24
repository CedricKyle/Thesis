'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('employees', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    })

    await queryInterface.addColumn('emergency_contacts', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    })

    await queryInterface.addColumn('roles', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('employees', 'deleted_at')
    await queryInterface.removeColumn('emergency_contacts', 'deleted_at')
    await queryInterface.removeColumn('roles', 'deleted_at')
  },
}
