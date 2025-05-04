module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('employee_attendance', 'status', {
      type: Sequelize.STRING(20),
      allowNull: true,
      after: 'end_time', // or wherever you want it
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('employee_attendance', 'status')
  },
}
