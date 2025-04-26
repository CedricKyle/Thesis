const { Employee, EmployeeAttendance, sequelize } = require('../src/model/Index.js')

async function getDateRangeArray(start, end) {
  const arr = []
  let dt = new Date(start)
  while (dt <= new Date(end)) {
    arr.push(dt.toISOString().split('T')[0])
    dt.setDate(dt.getDate() + 1)
  }
  return arr
}

async function backfillAbsences(startDate, endDate) {
  const employees = await Employee.findAll({ where: { deleted_at: null } })
  const dateRange = await getDateRangeArray(startDate, endDate)

  for (const emp of employees) {
    for (const date of dateRange) {
      const existing = await EmployeeAttendance.findOne({
        where: { employee_id: emp.employee_id, date, deleted_at: null },
      })
      if (!existing) {
        await EmployeeAttendance.create({
          employee_id: emp.employee_id,
          date,
          status: 'Absent',
          approval_status: 'Pending',
          working_hours: 0,
          overtime_hours: 0,
        })
        console.log(`Inserted absent for ${emp.employee_id} on ${date}`)
      }
    }
  }
  console.log('Backfill complete')
  process.exit(0)
}

// Usage: node backfillAbsences.js 2024-04-01 2024-04-30
const [, , start, end] = process.argv
if (!start || !end) {
  console.error('Usage: node backfillAbsences.js YYYY-MM-DD YYYY-MM-DD')
  process.exit(1)
}
backfillAbsences(start, end).catch((err) => {
  console.error(err)
  process.exit(1)
})
