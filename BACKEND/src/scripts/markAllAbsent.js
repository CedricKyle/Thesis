require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })

const { Employee, EmployeeAttendance, sequelize } = require('../model/Index')

console.log('DB_USER:', process.env.DB_USER)
console.log('DB_NAME:', process.env.DB_NAME)

async function markAllEmployeesAbsentForToday() {
  const today = new Date().toISOString().split('T')[0]
  const employees = await Employee.findAll({ where: { deleted_at: null } })

  for (const emp of employees) {
    // Check if already has a record for today
    const existing = await EmployeeAttendance.findOne({
      where: { employee_id: emp.employee_id, date: today, deleted_at: null },
    })
    if (!existing) {
      await EmployeeAttendance.create({
        employee_id: emp.employee_id,
        date: today,
        status: 'Absent',
        approval_status: 'Pending',
        working_hours: 0,
        overtime_hours: 0,
      })
    }
  }
  console.log('Marked all employees as absent for', today)
  process.exit(0)
}

markAllEmployeesAbsentForToday().catch((err) => {
  console.error(err)
  process.exit(1)
})
