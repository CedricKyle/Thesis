'use strict'
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('leaves', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
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
      date_from: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      date_to: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      type: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'Pending',
      },
      is_paid: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE,
    })
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('leaves')
  },
}
