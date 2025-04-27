module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('employee_attendance', 'attendance_type', {
      type: Sequelize.ENUM('regular', 'overtime'),
      defaultValue: 'regular',
      allowNull: false,
    })
    await queryInterface.addColumn('employee_attendance', 'overtime_proof', {
      type: Sequelize.STRING,
      allowNull: true,
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('employee_attendance', 'attendance_type')
    await queryInterface.removeColumn('employee_attendance', 'overtime_proof')
    // Optionally, drop ENUM type if your dialect requires it
    // await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_employee_attendance_attendance_type";')
  },
}
