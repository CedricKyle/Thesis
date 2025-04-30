'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('employees', 'position_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'positions',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('employees', 'position_id')
  },
}
