import { ref, computed } from 'vue'

export function useAttendanceLogic() {
  // Time constants
  const TIME_CONSTANTS = {
    WORK_START: 8 * 60, // 8:00 AM in minutes
    GRACE_PERIOD: 8 * 60 + 15, // 8:15 AM in minutes
    ABSENT_THRESHOLD: 12 * 60, // 12:00 PM in minutes
    STANDARD_END: 17 * 60, // 5:00 PM in minutes
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
    const [inHours, inMinutes] = signIn.split(':')
    const [outHours, outMinutes] = signOut.split(':')

    const startTime = new Date(2024, 0, 1, inHours, inMinutes)
    const endTime = new Date(2024, 0, 1, outHours, outMinutes)
    const standardEndTime = new Date(2024, 0, 1, 17, 0)

    const actualEndTime = endTime > standardEndTime ? standardEndTime : endTime
    const diffInHours = (actualEndTime - startTime) / (1000 * 60 * 60)

    return `${Math.max(0, Math.round(diffInHours * 10) / 10)} hours`
  }

  const determineStatus = (signIn) => {
    const [hours, minutes] = signIn.split(':')
    const signInTimeInMinutes = parseInt(hours) * 60 + parseInt(minutes)

    if (signInTimeInMinutes <= TIME_CONSTANTS.WORK_START) return 'Present'
    if (signInTimeInMinutes <= TIME_CONSTANTS.GRACE_PERIOD) return 'Present'
    if (signInTimeInMinutes >= TIME_CONSTANTS.ABSENT_THRESHOLD) return 'Absent'
    return 'Late'
  }

  return {
    formatDate,
    calculateHours,
    determineStatus,
    TIME_CONSTANTS,
  }
}
