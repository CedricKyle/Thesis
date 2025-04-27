import { ref, computed } from 'vue'

export function useAttendanceLogic() {
  // Time constants
  const TIME_CONSTANTS = {
    WORK_START: 8 * 60, // 8:00 AM = 480 minutes
    WORK_END: 17 * 60, // 5:00 PM = 1020 minutes
    OVERTIME_START: 18 * 60, // 6:00 PM = 1080 minutes
    GRACE_PERIOD: 8 * 60 + 15, // 8:15 AM = 495 minutes
    BREAK_START: 17 * 60, // 5:00 PM
    BREAK_END: 18 * 60, // 6:00 PM
  }

  // Utility functions
  const formatDate = (date) => {
    if (!date) return '-'

    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  // Calculate regular working hours (with 1-hour break auto-deducted if worked at least 5 hours)
  const calculateHours = (signIn, signOut) => {
    if (!signIn || !signOut || signIn === '-' || signOut === '-') return '-'

    const [inHours, inMinutes] = signIn.split(':').map(Number)
    const [outHours, outMinutes] = signOut.split(':').map(Number)

    const inTime = inHours * 60 + inMinutes
    const outTime = outHours * 60 + outMinutes

    if (outTime <= inTime) return '-'

    // Regular working time: 8:00 AM to 5:00 PM (9 hours), but auto-deduct 1 hour for break if worked at least 5 hours
    let regularMinutes =
      Math.min(outTime, TIME_CONSTANTS.WORK_END) - Math.max(inTime, TIME_CONSTANTS.WORK_START)
    regularMinutes = Math.max(0, regularMinutes)
    let regularHours = Math.floor(regularMinutes / 60)
    let regularMins = regularMinutes % 60

    // Deduct 1 hour for break if worked at least 5 hours
    if (regularMinutes >= 300) {
      regularHours -= 1
      if (regularMins < 0) {
        regularHours -= 1
        regularMins += 60
      }
    }

    // Overtime: only after 6:00 PM
    let overtimeMinutes = 0
    if (outTime >= TIME_CONSTANTS.OVERTIME_START) {
      overtimeMinutes = outTime - TIME_CONSTANTS.OVERTIME_START
    }

    let overtimeHours = Math.floor(overtimeMinutes / 60)
    let overtimeMins = overtimeMinutes % 60

    let displayString = `${regularHours}h ${regularMins}m`
    if (overtimeMinutes > 0) {
      displayString += ` + ${overtimeHours}h ${overtimeMins}m OT`
    }

    return displayString
  }

  // Calculate overtime in hours (only after 6:00 PM)
  const calculateOvertime = (signOut) => {
    if (!signOut || signOut.trim() === '') return 0
    const [hours, minutes] = signOut.split(':')
    const signOutTimeInMinutes = parseInt(hours) * 60 + parseInt(minutes)

    // Overtime only starts after 6:00 PM
    if (signOutTimeInMinutes >= TIME_CONSTANTS.OVERTIME_START) {
      const overtimeMinutes = signOutTimeInMinutes - TIME_CONSTANTS.OVERTIME_START
      return Math.round((overtimeMinutes / 60) * 10) / 10 // hours, 1 decimal
    }
    return 0
  }

  // Determine status for regular attendance
  const determineStatus = (signIn, signOut) => {
    // Handle absent case
    if (!signIn || signIn.trim() === '') return 'Absent'

    const [hours, minutes] = signIn.split(':')
    const signInTimeInMinutes = parseInt(hours) * 60 + parseInt(minutes)

    // Calculate overtime if signOut is provided
    const overtimeHours = calculateOvertime(signOut)
    const hasOvertime = overtimeHours > 0

    // Determine base status
    let status = 'Present'
    if (signInTimeInMinutes > TIME_CONSTANTS.GRACE_PERIOD) {
      status = 'Late'
    }

    // Append overtime if applicable
    if (hasOvertime) {
      status = `${status} + OT`
    }

    return status
  }

  return {
    formatDate,
    calculateHours,
    determineStatus,
    calculateOvertime,
    TIME_CONSTANTS,
  }
}
