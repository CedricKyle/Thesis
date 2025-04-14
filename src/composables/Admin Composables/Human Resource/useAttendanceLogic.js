import { ref, computed } from 'vue'

export function useAttendanceLogic() {
  // Time constants
  const TIME_CONSTANTS = {
    WORK_START: 8 * 60, // 8:00 AM = 480 minutes
    GRACE_PERIOD: 8 * 60 + 15, // 8:15 AM = 495 minutes
    STANDARD_END: 17 * 60, // 5:00 PM = 1020 minutes
    OVERTIME_THRESHOLD: 17 * 60 + 20, // 5:20 PM = 1040 minutes
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

  const calculateHours = (signIn, signOut) => {
    if (!signIn || !signOut || signIn === '-' || signOut === '-') return '-'

    const [inHours, inMinutes] = signIn.split(':').map(Number)
    const [outHours, outMinutes] = signOut.split(':').map(Number)

    const inTime = inHours * 60 + inMinutes
    const outTime = outHours * 60 + outMinutes

    if (outTime <= inTime) return '-'

    // Calculate regular working hours (up to 5:00 PM / 17:00)
    let regularMinutes = Math.min(outTime, TIME_CONSTANTS.STANDARD_END) - inTime
    regularMinutes = Math.max(0, regularMinutes) // Ensure non-negative

    // Calculate overtime (after 5:20 PM / 17:20)
    let overtimeMinutes = 0
    if (outTime > TIME_CONSTANTS.OVERTIME_THRESHOLD) {
      overtimeMinutes = outTime - TIME_CONSTANTS.STANDARD_END
    }

    // Format regular hours
    const regularHours = Math.floor(regularMinutes / 60)
    const regularMins = regularMinutes % 60

    // Format overtime hours
    const overtimeHours = Math.floor(overtimeMinutes / 60)
    const overtimeMins = overtimeMinutes % 60

    // Create the display string
    let displayString = `${regularHours}h ${regularMins}m`
    if (overtimeMinutes > 0) {
      displayString += ` + ${overtimeHours}h ${overtimeMins}m OT`
    }

    return displayString
  }

  const calculateOvertime = (signOut) => {
    if (!signOut || signOut.trim() === '') return 0

    const [hours, minutes] = signOut.split(':')
    const signOutTimeInMinutes = parseInt(hours) * 60 + parseInt(minutes)

    if (signOutTimeInMinutes > TIME_CONSTANTS.OVERTIME_THRESHOLD) {
      const overtimeMinutes = signOutTimeInMinutes - TIME_CONSTANTS.STANDARD_END
      return Math.round((overtimeMinutes / 60) * 10) / 10 // Convert to hours with 1 decimal place
    }
    return 0
  }

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
