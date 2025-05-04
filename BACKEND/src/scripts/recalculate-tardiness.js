const { EmployeeAttendance, EmployeeSchedule, AvailableSchedule } = require('../model/Index')
const attendanceLogic = require('../utils/attendance-logic-calculator')
const { getEmployeeRatePerHour } = require('../utils/employee-utils')

async function recalculateAllTardiness() {
  const records = await EmployeeAttendance.findAll({
    where: { deleted_at: null },
    include: [
      {
        model: EmployeeSchedule,
        as: 'schedule',
        include: [{ model: AvailableSchedule, as: 'schedule' }],
      },
    ],
  })

  for (const record of records) {
    if (!record.start_time || !record.schedule) continue
    const scheduledStart = record.schedule.schedule.time_in
    const actualStart = record.start_time
    const late_minutes = attendanceLogic.calculateLateMinutes(scheduledStart, actualStart)

    // Get rate per hour
    const ratePerHour = await getEmployeeRatePerHour(record.employee_id)

    // Calculate tardiness deduction
    const tardinessDeduction = late_minutes > 0 ? ((late_minutes / 60) * ratePerHour).toFixed(2) : 0

    // Update record
    await record.update({
      late_minutes,
      tardiness_deduction: tardinessDeduction,
    })
  }

  console.log('Tardiness recalculation complete!')
  process.exit(0)
}

recalculateAllTardiness().catch((err) => {
  console.error(err)
  process.exit(1)
})
