require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })

const {
  Employee,
  EmployeeAttendance,
  EmployeeSchedule,
  AvailableSchedule,
} = require('../model/Index')

const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
dayjs.extend(utc)
dayjs.extend(timezone)


console.log('DB_USER:', process.env.DB_USER)
console.log('DB_NAME:', process.env.DB_NAME)

async function markScheduledEmployeesAbsentForToday() {
  const today = dayjs().tz('Asia/Manila').format('YYYY-MM-DD')
  const dayOfWeek = dayjs(today).tz('Asia/Manila').format('dddd')
  console.log('Today:', today)
  console.log('Day of Week:', dayOfWeek)
  const employees = await Employee.findAll({ where: { deleted_at: null } })

  for (const emp of employees) {
    // Get the employee's schedule assignment
    const empSchedule = await EmployeeSchedule.findOne({
      where: { employee_id: emp.employee_id, deleted_at: null },
      include: [{ model: AvailableSchedule, as: 'schedule' }],
    })
    if (!empSchedule || !empSchedule.schedule) continue

    // Parse work_days (may be JSON or array)
    let workDays = empSchedule.schedule.work_days
    if (typeof workDays === 'string') {
      try {
        workDays = JSON.parse(workDays)
      } catch {
        workDays = []
      }
    }
    if (!Array.isArray(workDays)) workDays = []

    // Check if today is a scheduled workday
    if (!workDays.includes(dayOfWeek)) continue

    // Check if already has a record for today
    const existing = await EmployeeAttendance.findOne({
      where: { employee_id: emp.employee_id, date: today, deleted_at: null },
    })
    if (!existing) {
      await EmployeeAttendance.create({
        employee_id: emp.employee_id,
        schedule_id: empSchedule.id,
        date: today,
        absent: true,
        status: 'Absent',
        approval_status: 'Pending',
        hours_worked: 0,
        regular_hours: 0,
        overtime_hours: 0,
      })
      console.log(`Marked absent: ${emp.employee_id} on ${today}`)
    }
  }
  console.log('Done marking absences for scheduled employees.')
  process.exit(0)
}

markScheduledEmployeesAbsentForToday().catch((err) => {
  console.error(err)
  process.exit(1)
})
