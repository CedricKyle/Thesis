import { ref, computed } from 'vue'

export function useAttendanceLogic() {
  // Time constants
  const TIME_CONSTANTS = {
    WORK_START: 8 * 60, // 8:00 AM = 480 minutes
    GRACE_PERIOD: 8 * 60 + 15, // 8:15 AM = 495 minutes
    STANDARD_END: 17 * 60, // 5:00 PM = 1020 minutes
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
    // Return empty string if either signIn or signOut is empty/undefined
    if (!signIn || !signOut || signIn.trim() === '' || signOut.trim() === '') {
      return '-'
    }

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
    // Only mark as absent if there's no sign-in time
    if (!signIn || signIn.trim() === '') return 'Absent'

    const [hours, minutes] = signIn.split(':')
    const signInTimeInMinutes = parseInt(hours) * 60 + parseInt(minutes)

    console.log('Time check:', {
      signIn,
      signInTimeInMinutes,
      gracePeriod: TIME_CONSTANTS.GRACE_PERIOD,
      isWithinGrace: signInTimeInMinutes <= TIME_CONSTANTS.GRACE_PERIOD,
    })

    // Case 1: Sign-in within grace period (up to 8:15 AM)
    if (signInTimeInMinutes <= TIME_CONSTANTS.GRACE_PERIOD) {
      console.log('Should be Present - within grace period')
      return 'Present'
    }

    // Case 2: Sign-in after grace period (will be marked as Late instead of Absent)
    console.log('Should be Late - after grace period')
    return 'Late'
  }

  return {
    formatDate,
    calculateHours,
    determineStatus,
    TIME_CONSTANTS,
  }
}
