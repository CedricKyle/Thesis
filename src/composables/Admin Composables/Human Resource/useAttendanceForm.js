import { ref } from 'vue'
import { useAttendanceLogic } from './useAttendanceLogic'

export function useAttendanceForm() {
  const { calculateHours, determineStatus } = useAttendanceLogic()

  const newAttendance = ref({
    employeeName: '',
    signIn: '',
    signOut: '',
    date: '',
    department: '',
  })

  const formErrors = ref({})
  const departments = ['HR', 'Finance', 'Sales', 'Supply Chain', 'CRM']
  const validateForm = () => {
    formErrors.value = {}
    let isValid = true

    if (!newAttendance.value.employeeName?.trim()) {
      formErrors.value.employeeName = 'Employee name is required'
      isValid = false
    }

    // Required field validation
    const requiredFields = {
      date: 'Date',
      signIn: 'Sign in time',
      signOut: 'Sign out time',
      department: 'Department',
    }

    Object.entries(requiredFields).forEach(([field, label]) => {
      if (!newAttendance.value[field]?.trim()) {
        formErrors.value[field] = `${label} is required`
        isValid = false
      }
    })

    // Time validation
    if (newAttendance.value.signIn && newAttendance.value.signOut) {
      const isValidTime = validateTimeOrder(newAttendance.value.signIn, newAttendance.value.signOut)
      if (!isValidTime) {
        formErrors.value.signOut = 'Sign out time must be after sign in time'
        isValid = false
      }
    }

    return isValid
  }

  const validateTimeOrder = (signIn, signOut) => {
    const [inHours, inMinutes] = signIn.split(':')
    const [outHours, outMinutes] = signOut.split(':')

    const inTime = parseInt(inHours) * 60 + parseInt(inMinutes)
    const outTime = parseInt(outHours) * 60 + parseInt(outMinutes)

    return outTime > inTime
  }

  const resetForm = () => {
    newAttendance.value = {
      employeeName: '',
      signIn: '',
      signOut: '',
      date: '',
      department: '',
    }
    formErrors.value = {}
  }

  return {
    newAttendance,
    formErrors,
    departments,
    validateForm,
    resetForm,
  }
}
