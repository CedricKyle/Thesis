import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAttendanceLogic } from './useAttendanceLogic'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'

export function useAttendanceForm() {
  const { calculateHours, determineStatus } = useAttendanceLogic()
  const employeeStore = useEmployeeStore()
  const { employees } = storeToRefs(employeeStore)

  const newAttendance = ref({
    employeeName: '',
    department: '',
    signIn: '',
    signOut: '',
    date: '',
  })

  const formErrors = ref({})
  const departments = [
    'HR Department',
    'Finance Department',
    'Sales Department',
    'Supply Chain Department',
    'CRM Department',
  ]
  const validateForm = () => {
    formErrors.value = {}
    let isValid = true

    // Required fields validation
    if (!newAttendance.value.department) {
      formErrors.value.department = 'Department is required'
      isValid = false
    }

    if (!newAttendance.value.employeeName) {
      formErrors.value.employeeName = 'Employee is required'
      isValid = false
    } else {
      const employeeExists = employees.value.some(
        (emp) => emp.full_name === newAttendance.value.employeeName,
      )
      if (!employeeExists) {
        formErrors.value.employeeName = 'Selected employee does not exist'
        isValid = false
      }
    }

    if (!newAttendance.value.signIn) {
      formErrors.value.signIn = 'Sign in time is required'
      isValid = false
    }

    // For date, only check if it's not empty
    if (!newAttendance.value.date) {
      formErrors.value.date = 'Date is required'
      isValid = false
    }

    // Time validation if both sign in and sign out are provided
    if (newAttendance.value.signIn && newAttendance.value.signOut) {
      const [inHours, inMinutes] = newAttendance.value.signIn.split(':')
      const [outHours, outMinutes] = newAttendance.value.signOut.split(':')

      const inTime = parseInt(inHours) * 60 + parseInt(inMinutes)
      const outTime = parseInt(outHours) * 60 + parseInt(outMinutes)

      if (outTime <= inTime) {
        formErrors.value.signOut = 'Sign out time must be after sign in time'
        isValid = false
      }
    }

    return isValid
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
    employees,
  }
}
