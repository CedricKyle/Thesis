/**
 * PH Labor Law Constants
 */
const GRACE_PERIOD_MINUTES = 15
const BREAK_DEDUCTION_MINUTES = 60
const MIN_HOURS_FOR_BREAK = 5
const REGULAR_HOURS_PER_DAY = 8
const MAX_OVERTIME_HOURS = 12

/**
 * Calculate late minutes (tardiness)
 */
function calculateLateMinutes(scheduledIn, actualIn) {
  const [schedH, schedM] = scheduledIn.split(':').map(Number)
  const [inH, inM] = actualIn.split(':').map(Number)
  const scheduledMinutes = schedH * 60 + schedM
  const actualMinutes = inH * 60 + inM
  let late = Math.max(0, actualMinutes - scheduledMinutes)
  // Apply grace period
  return late > GRACE_PERIOD_MINUTES ? late : 0
}

/**
 * Calculate undertime (leaving early)
 */
function calculateUndertime(scheduledOut, actualOut) {
  const [schedH, schedM] = scheduledOut.split(':').map(Number)
  const [outH, outM] = actualOut.split(':').map(Number)
  const scheduledMinutes = schedH * 60 + schedM
  const actualMinutes = outH * 60 + outM
  return Math.max(0, scheduledMinutes - actualMinutes)
}

/**
 * Calculate total hours worked (with break deduction)
 */
function calculateHoursWorked(inTime, outTime) {
  const [inH, inM] = inTime.split(':').map(Number)
  const [outH, outM] = outTime.split(':').map(Number)
  let start = inH * 60 + inM
  let end = outH * 60 + outM
  if (end <= start) end += 24 * 60 // overnight
  let total = end - start
  if (total >= MIN_HOURS_FOR_BREAK * 60) total -= BREAK_DEDUCTION_MINUTES
  return (total / 60).toFixed(2)
}

/**
 * Calculate overtime hours
 */
function calculateOvertime(scheduledOut, actualOut) {
  const [schedH, schedM] = scheduledOut.split(':').map(Number)
  const [outH, outM] = actualOut.split(':').map(Number)
  const scheduledMinutes = schedH * 60 + schedM
  let actualMinutes = outH * 60 + outM

  // If actual out is before scheduled out, assume overnight shift
  if (actualMinutes < scheduledMinutes) {
    actualMinutes += 24 * 60
  }

  const overtime = Math.max(0, actualMinutes - scheduledMinutes)
  const overtimeHours = Math.min(overtime / 60, MAX_OVERTIME_HOURS)
  return overtimeHours.toFixed(2)
}

/**
 * Calculate deductions (tardiness, absences, undertime)
 * @param {number} lateMinutes
 * @param {number} undertimeMinutes
 * @param {number} absentDays
 * @param {number} ratePerHour
 */
function calculateDeductions(lateMinutes, undertimeMinutes, absentDays, ratePerHour) {
  const lateDeduction = (lateMinutes / 60) * ratePerHour
  const undertimeDeduction = (undertimeMinutes / 60) * ratePerHour
  const absentDeduction = absentDays * REGULAR_HOURS_PER_DAY * ratePerHour
  return {
    lateDeduction: lateDeduction.toFixed(2),
    undertimeDeduction: undertimeDeduction.toFixed(2),
    absentDeduction: absentDeduction.toFixed(2),
  }
}

/**
 * Calculate holiday pay (simple version, can be expanded)
 * @param {boolean} isHoliday
 * @param {number} hoursWorked
 * @param {number} ratePerHour
 */
function calculateHolidayPay(isHoliday, hoursWorked, ratePerHour) {
  if (!isHoliday) return 0
  // Regular holiday: 200% pay
  return (hoursWorked * ratePerHour * 2).toFixed(2)
}

// Night Differential: 10% extra for work between 22:00 and 06:00
function calculateNightDifferential(inTime, outTime, hoursWorked, ratePerHour) {
  // Convert times to minutes
  const [inH, inM] = inTime.split(':').map(Number)
  const [outH, outM] = outTime.split(':').map(Number)
  let start = inH * 60 + inM
  let end = outH * 60 + outM
  if (end <= start) end += 24 * 60 // overnight

  // Night diff window: 22:00 (1320) to 06:00 (360 next day)
  let nightMinutes = 0
  for (let min = start; min < end; min++) {
    let hour = (min / 60) % 24
    if (hour >= 22 || hour < 6) nightMinutes++
  }
  const nightHours = nightMinutes / 60
  const nightDiffPay = nightHours * ratePerHour * 0.1
  return {
    nightHours: nightHours.toFixed(2),
    nightDiffPay: nightDiffPay.toFixed(2),
  }
}

// Rest Day Pay
function calculateRestDayPay(isRestDay, isHoliday, hoursWorked, ratePerHour) {
  if (isRestDay && isHoliday) {
    // Rest day + regular holiday: 260%
    return (hoursWorked * ratePerHour * 2.6).toFixed(2)
  } else if (isRestDay) {
    // Rest day only: 130%
    return (hoursWorked * ratePerHour * 1.3).toFixed(2)
  }
  return 0
}

// Special Holiday Pay
function calculateSpecialHolidayPay(isSpecialHoliday, hoursWorked, ratePerHour) {
  if (!isSpecialHoliday) return 0
  // Special holiday: 130% if worked, 0 if not worked
  return (hoursWorked * ratePerHour * 1.3).toFixed(2)
}

module.exports = {
  calculateLateMinutes,
  calculateUndertime,
  calculateHoursWorked,
  calculateOvertime,
  calculateDeductions,
  calculateHolidayPay,
  calculateNightDifferential,
  calculateRestDayPay,
  calculateSpecialHolidayPay,
  // Add more as needed
}
