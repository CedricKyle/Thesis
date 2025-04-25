module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // First get all foreign key constraints for the approved_by column
      const [results] = await queryInterface.sequelize.query(`
        SELECT CONSTRAINT_NAME 
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE TABLE_NAME = 'employee_attendance' 
        AND COLUMN_NAME = 'approved_by' 
        AND REFERENCED_TABLE_NAME IS NOT NULL;
      `)

      // Drop each constraint found
      for (const result of results) {
        await queryInterface.sequelize.query(`
          ALTER TABLE employee_attendance 
          DROP FOREIGN KEY ${result.CONSTRAINT_NAME};
        `)
      }

      // Then modify the column
      await queryInterface.changeColumn('employee_attendance', 'approved_by', {
        type: Sequelize.STRING(150),
        allowNull: true,
      })

      return Promise.resolve()
    } catch (error) {
      return Promise.reject(error)
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Revert the column back to its original state
      await queryInterface.changeColumn('employee_attendance', 'approved_by', {
        type: Sequelize.STRING(20),
        allowNull: true,
        references: {
          model: 'employees',
          key: 'employee_id',
        },
      })

      return Promise.resolve()
    } catch (error) {
      return Promise.reject(error)
    }
  },
}
