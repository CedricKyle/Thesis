import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'
import { useAttendanceLogic } from '@/composables/Admin Composables/Human Resource/useAttendanceLogic'

export const useAttendanceStore = defineStore('attendance', () => {
  const { determineStatus, calculateHours } = useAttendanceLogic()

  // State
  const attendanceRecords = ref([])
  const error = ref(null)
  const currentPage = ref(1)
  const itemsPerPage = ref(8)
  const searchQuery = ref('')
  const sortBy = ref('id')
  const sortDesc = ref(false)
  const selectedDate = ref(new Date().toISOString().split('T')[0])

  // Add new state for reports
  const reportFilters = ref({
    startDate: '',
    endDate: '',
    department: '',
    employeeId: '',
  })

  // Add a new state property for report data
  const reportData = ref([])

  // Add these new state properties after the existing ones
  const todayAttendance = ref(null)
  const isProcessing = ref(false)

  // Getters
  const filteredRecords = computed(() => {
    let records = [...attendanceRecords.value]

    // Filter by selected date first
    records = records.filter((record) => {
      const recordDate = new Date(record.date).toISOString().split('T')[0]
      return recordDate === selectedDate.value
    })

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      records = records.filter(
        (record) =>
          record.name.toLowerCase().includes(query) ||
          record.department.toLowerCase().includes(query),
      )
    }

    records.sort((a, b) => {
      const comparison = sortBy.value === 'id' ? a.id - b.id : a.name.localeCompare(b.name)
      return sortDesc.value ? -comparison : comparison
    })

    return records
  })

  const paginatedRecords = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value
    const end = start + itemsPerPage.value
    return filteredRecords.value.slice(start, end)
  })

  const totalPages = computed(() => Math.ceil(filteredRecords.value.length / itemsPerPage.value))

  const stats = computed(() => {
    const records = filteredRecords.value
    return {
      present: records.filter((r) => r.status === 'Present').length,
      late: records.filter((r) => r.status === 'Late').length,
      absent: records.filter((r) => r.status === 'Absent').length,
      onLeave: records.filter((r) => r.status === 'On Leave').length,
    }
  })

  const chartData = computed(() => ({
    labels: ['Present', 'Absent', 'Late', 'On Leave'],
    datasets: [
      {
        data: [stats.value.present, stats.value.absent, stats.value.late, stats.value.onLeave],
        backgroundColor: ['#466114', '#ef4444', '#F87A14', '#866135'],
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  }))

  // Modify the getAttendanceReport computed property
  const getAttendanceReport = computed(() => {
    if (
      !reportFilters.value.startDate ||
      !reportFilters.value.endDate ||
      !reportFilters.value.employeeId
    ) {
      return []
    }

    const startDate = new Date(reportFilters.value.startDate)
    const endDate = new Date(reportFilters.value.endDate)

    // Filter to only include approved records
    const approvedRecords = attendanceRecords.value.filter(
      (record) =>
        record.approvalStatus === 'Approved' &&
        record.employee_id === reportFilters.value.employeeId,
    )

    const attendanceMap = new Map(
      approvedRecords.map((record) => [new Date(record.date).toDateString(), record]),
    )

    // Generate array of all dates in range
    const allDates = []
    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      const dateString = currentDate.toDateString()
      const existingRecord = attendanceMap.get(dateString)

      if (existingRecord) {
        // Calculate working hours for present/late records
        let workingHours = 0
        if (existingRecord.signIn && existingRecord.signOut) {
          const [inHours, inMinutes] = existingRecord.signIn.split(':').map(Number)
          const [outHours, outMinutes] = existingRecord.signOut.split(':').map(Number)

          const inTime = inHours * 60 + inMinutes
          const outTime = outHours * 60 + outMinutes

          // Only calculate hours if sign out is after sign in
          if (outTime > inTime) {
            workingHours = ((outTime - inTime) / 60).toFixed(2)
          }
        }

        allDates.push({
          ...existingRecord,
          date: new Date(currentDate).toLocaleDateString(),
          workingHours: workingHours || 0,
          status: existingRecord.status || determineStatus(existingRecord.signIn),
        })
      } else {
        // Create absent record if no attendance found
        allDates.push({
          date: new Date(currentDate).toLocaleDateString(),
          signIn: '-',
          signOut: '-',
          workingHours: 0,
          status: 'Absent',
          employee_id: reportFilters.value.employeeId,
        })
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return allDates
  })

  const reportSummary = computed(() => {
    if (getAttendanceReport.value.length === 0) return null

    const records = getAttendanceReport.value
    const totalDays = records.length
    let totalHours = 0
    let presentDays = 0
    let lateDays = 0
    let absentDays = 0
    let onLeaveDays = 0
    let totalOvertime = 0

    records.forEach((record) => {
      // Calculate total hours and count days
      if (record.signIn !== '-' && record.signOut !== '-') {
        const [inHours, inMinutes] = record.signIn.split(':').map(Number)
        const [outHours, outMinutes] = record.signOut.split(':').map(Number)

        const inTime = inHours * 60 + inMinutes
        const outTime = outHours * 60 + outMinutes

        if (outTime > inTime) {
          const hours = (outTime - inTime) / 60
          totalHours += hours

          // Calculate overtime (if worked more than 8 hours)
          if (hours > 8) {
            totalOvertime += hours - 8
          }
        }
      }

      // Count status
      switch (record.status) {
        case 'Present':
          presentDays++
          break
        case 'Late':
          lateDays++
          break
        case 'Absent':
          absentDays++
          break
        case 'On Leave':
          onLeaveDays++
          break
      }
    })

    return {
      'Total Days': totalDays,
      'Total Hours': totalHours.toFixed(2),
      'Present Days': presentDays,
      'Late Days': lateDays,
      'Absent Days': absentDays,
      'On Leave Days': onLeaveDays,
      'Average Hours/Day': (totalHours / (presentDays + lateDays) || 0).toFixed(2),
      'Total Overtime': Math.round(totalOvertime * 10) / 10,
    }
  })

  // Add this helper function at the top of the store
  const checkExistingAttendance = (employeeId, date) => {
    // Convert both dates to YYYY-MM-DD format for comparison
    const targetDate = new Date(date).toISOString().split('T')[0]

    const existingRecord = attendanceRecords.value.find((record) => {
      const recordDate = new Date(record.date).toISOString().split('T')[0]
      return (
        record.employee_id === employeeId &&
        recordDate === targetDate &&
        !record.id.toString().startsWith('absent-')
      )
    })

    // If no record exists or only an 'absent' record exists, allow new entry
    return existingRecord || null
  }

  // Add this helper function to check if a date is from a previous day
  const isFromPreviousDay = (date) => {
    const today = new Date()
    const recordDate = new Date(date)
    return recordDate.toDateString() !== today.toDateString()
  }

  // Add this function to handle daily reset
  const resetDailyAttendance = () => {
    try {
      // Get today's date at midnight for comparison
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Check each record and mark as absent if it's pending from previous day
      attendanceRecords.value = attendanceRecords.value.map((record) => {
        const recordDate = new Date(record.date)
        recordDate.setHours(0, 0, 0, 0)

        // If record is from a previous day and still pending, mark as absent
        if (recordDate < today && record.approvalStatus === 'Pending') {
          return {
            ...record,
            status: 'Absent',
            signIn: '-',
            signOut: '-',
            workingHours: '-',
            approvalStatus: 'Approved', // Auto-approve as absent
            approvedBy: 'System',
            approvedAt: new Date().toISOString(),
          }
        }
        return record
      })

      // Reset todayAttendance if it's from previous day
      if (todayAttendance.value && isFromPreviousDay(todayAttendance.value.date)) {
        todayAttendance.value = null
      }

      // Save the updated records
      saveToLocalStorage()
    } catch (error) {
      console.error('Error resetting daily attendance:', error)
    }
  }

  // Actions
  const addRecord = async (attendanceData) => {
    try {
      // Check for existing attendance
      const existingRecord = checkExistingAttendance(
        attendanceData.employee_id,
        attendanceData.date,
      )

      if (existingRecord && !existingRecord.id?.toString().startsWith('absent-')) {
        throw new Error('Attendance record already exists for this employee on the selected date')
      }

      // Generate a new ID for the record
      const newId = generateId()

      // Calculate working hours and overtime
      let workingHours = '-'
      let overtime = 0

      if (attendanceData.signIn && attendanceData.signOut) {
        const [inHours, inMinutes] = attendanceData.signIn.split(':').map(Number)
        const [outHours, outMinutes] = attendanceData.signOut.split(':').map(Number)

        const inTotalMinutes = inHours * 60 + inMinutes
        const outTotalMinutes = outHours * 60 + outMinutes
        const diffMinutes = outTotalMinutes - inTotalMinutes

        if (diffMinutes > 0) {
          const hours = Math.floor(diffMinutes / 60)
          const minutes = diffMinutes % 60
          workingHours = `${hours}:${minutes.toString().padStart(2, '0')}`

          // Calculate overtime if worked more than 8 hours
          if (diffMinutes > 480) {
            // 8 hours = 480 minutes
            overtime = ((diffMinutes - 480) / 60).toFixed(2)
          }
        }
      }

      // Create the new record with all required fields
      const newRecord = {
        id: newId,
        full_name: attendanceData.full_name,
        employee_id: attendanceData.employee_id,
        department: attendanceData.department,
        date: new Date(attendanceData.date),
        signIn: attendanceData.signIn || '-',
        signOut: attendanceData.signOut || '-',
        workingHours: workingHours,
        overtime: overtime,
        status: determineStatus(attendanceData.signIn),
      }

      // If there's an existing 'absent' record, remove it
      if (existingRecord?.id?.toString().startsWith('absent-')) {
        attendanceRecords.value = attendanceRecords.value.filter((r) => r.id !== existingRecord.id)
      }

      // Update the local state
      attendanceRecords.value = [...attendanceRecords.value, newRecord]

      // Save to localStorage
      saveToLocalStorage()

      return newRecord
    } catch (error) {
      console.error('Error adding attendance record:', error)
      throw error
    }
  }

  // Helper functions
  function generateId() {
    return attendanceRecords.value.length > 0
      ? Math.max(...attendanceRecords.value.map((r) => r.id)) + 1
      : 1
  }

  function setError(message) {
    error.value = message
    setTimeout(() => {
      error.value = null
    }, 3000)
  }

  const deleteRecord = async (recordId) => {
    try {
      // Get current records
      const currentRecords = attendanceRecords.value

      // Get the record before deletion
      const recordToDelete = currentRecords.find((record) => record.id === recordId)
      if (!recordToDelete) {
        throw new Error('Record not found')
      }

      // Store employee info for re-entry
      const employeeId = recordToDelete.employee_id
      const recordDate = new Date(recordToDelete.date).toISOString().split('T')[0]

      // Remove the record
      attendanceRecords.value = currentRecords.filter((record) => record.id !== recordId)

      // Reset today's attendance if needed
      const today = new Date().toISOString().split('T')[0]
      if (recordDate === today) {
        todayAttendance.value = null
      }

      // Update localStorage
      saveToLocalStorage()

      return {
        success: true,
        employeeId,
        date: recordDate,
        message: 'Attendance record deleted successfully',
      }
    } catch (error) {
      console.error('Error deleting attendance record:', error)
      throw new Error('Failed to delete attendance record')
    }
  }

  function loadRecords() {
    try {
      const savedRecords = localStorage.getItem('attendanceRecords')
      if (savedRecords) {
        const records = JSON.parse(savedRecords)
        attendanceRecords.value = records.map((record) => ({
          ...record,
          date: new Date(record.date),
          status: determineStatus(record.signIn),
          workingHours: calculateHours(record.signIn, record.signOut),
          // Ensure approval status is preserved
          approvalStatus: record.approvalStatus || 'Pending',
          approvedBy: record.approvedBy || null,
          approvedAt: record.approvedAt || null,
        }))
      }
    } catch (error) {
      console.error('Error loading records:', error)
      attendanceRecords.value = []
    }
  }

  function saveToLocalStorage() {
    try {
      const recordsToSave = attendanceRecords.value.map((record) => ({
        ...record,
        date: record.date instanceof Date ? record.date.toISOString() : record.date,
      }))
      localStorage.setItem('attendanceRecords', JSON.stringify(recordsToSave))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
      throw error
    }
  }

  function handleSort(column) {
    if (sortBy.value === column) {
      sortDesc.value = !sortDesc.value
    } else {
      sortBy.value = column
      sortDesc.value = false
    }
  }

  async function updateRecord(id, updates) {
    try {
      const index = attendanceRecords.value.findIndex((r) => r.id === id)
      if (index !== -1) {
        attendanceRecords.value[index] = {
          ...attendanceRecords.value[index],
          ...updates,
        }
        saveToLocalStorage()
      }
    } catch (error) {
      setError('Failed to update record')
      throw error
    }
  }

  function resetState() {
    attendanceRecords.value = []
    currentPage.value = 1
    searchQuery.value = ''
    sortBy.value = 'id'
    sortDesc.value = false
    selectedDate.value = new Date().toISOString().split('T')[0]
    saveToLocalStorage()
  }

  // Add new actions for reports
  function setReportFilters(filters) {
    reportFilters.value = {
      ...reportFilters.value,
      ...filters,
    }
  }

  function getAttendanceByDateRange(startDate, endDate, employeeId) {
    return attendanceRecords.value.filter((record) => {
      const recordDate = new Date(record.date)
      return (
        recordDate >= new Date(startDate) &&
        recordDate <= new Date(endDate) &&
        record.employee_id === employeeId
      )
    })
  }

  // Modify the resetReportFilters function
  function resetReportFilters() {
    reportFilters.value = {
      startDate: '',
      endDate: '',
      department: '',
      employeeId: '',
    }
  }

  // Add these new actions
  const recordTimeIn = async (employeeId) => {
    isProcessing.value = true
    try {
      // Check and reset if needed
      resetDailyAttendance()

      const today = new Date().toISOString().split('T')[0]

      // Check for existing attendance
      const existingRecord = checkExistingAttendance(employeeId, new Date())
      if (existingRecord && existingRecord.signIn !== '-') {
        throw new Error('Already timed in for today')
      }

      const currentTime = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })

      // Get employee details
      const employeeStore = useEmployeeStore()
      const employee = employeeStore.employees.find((emp) => emp.employee_id === employeeId)

      if (!employee) {
        throw new Error('Employee not found')
      }

      // Create new attendance record
      const newRecord = {
        id: generateId(),
        employee_id: employeeId,
        full_name: employee.full_name,
        department: employee.department,
        date: new Date(),
        signIn: currentTime,
        signOut: '-',
        workingHours: '-',
        status: determineStatus(currentTime),
        approvalStatus: 'Pending',
        approvedBy: null,
        approvedAt: null,
      }

      // Remove any existing records for today
      attendanceRecords.value = attendanceRecords.value.filter((record) => {
        const recordDate = new Date(record.date).toISOString().split('T')[0]
        return !(recordDate === today && record.employee_id === employeeId)
      })

      // Add new record and update localStorage
      attendanceRecords.value.push(newRecord)
      todayAttendance.value = { ...newRecord }
      saveToLocalStorage()

      // Force a refresh of the attendance table
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('attendance-updated'))
      }

      return newRecord
    } catch (error) {
      throw error
    } finally {
      isProcessing.value = false
    }
  }

  const recordTimeOut = async (employeeId) => {
    isProcessing.value = true
    try {
      // Check and reset if needed
      resetDailyAttendance()

      const today = new Date().toISOString().split('T')[0]
      const currentTime = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })

      // Find today's attendance record
      const recordIndex = attendanceRecords.value.findIndex(
        (record) =>
          record.employee_id === employeeId &&
          new Date(record.date).toISOString().split('T')[0] === today,
      )

      if (recordIndex === -1) {
        throw new Error('No time in record found for today')
      }

      const existingRecord = attendanceRecords.value[recordIndex]

      if (existingRecord.signOut !== '-') {
        throw new Error('Already timed out for today')
      }

      // Calculate working hours and overtime
      const [inHours, inMinutes] = existingRecord.signIn.split(':').map(Number)
      const [outHours, outMinutes] = currentTime.split(':').map(Number)

      const inTotalMinutes = inHours * 60 + inMinutes
      const outTotalMinutes = outHours * 60 + outMinutes
      const workedMinutes = outTotalMinutes - inTotalMinutes

      // Regular work day is 8 hours (480 minutes)
      const regularMinutes = 480
      const overtime =
        workedMinutes > regularMinutes ? ((workedMinutes - regularMinutes) / 60).toFixed(2) : 0

      // Format working hours
      const hours = Math.floor(workedMinutes / 60)
      const minutes = workedMinutes % 60
      const workingHours = `${hours}:${minutes.toString().padStart(2, '0')}`

      // Update the record
      const updatedRecord = {
        ...existingRecord,
        signOut: currentTime,
        workingHours: workingHours,
        overtime: overtime,
        status: determineStatus(existingRecord.signIn),
        approvalStatus: 'Pending',
      }

      // Update in the array
      attendanceRecords.value[recordIndex] = updatedRecord
      todayAttendance.value = { ...updatedRecord }

      // Save to localStorage
      saveToLocalStorage()

      return updatedRecord
    } catch (error) {
      throw error
    } finally {
      isProcessing.value = false
    }
  }

  const getTodayAttendance = async (employeeId) => {
    try {
      // Check and reset if needed
      resetDailyAttendance()

      const today = new Date().toISOString().split('T')[0]
      const record = attendanceRecords.value.find(
        (record) =>
          record.employee_id === employeeId &&
          new Date(record.date).toISOString().split('T')[0] === today,
      )

      // Make sure we're including all approval details
      todayAttendance.value = record
        ? {
            ...record,
            approvalStatus: record.approvalStatus || 'Pending',
            approvedBy: record.approvedBy || null,
            approvedAt: record.approvedAt || null,
          }
        : null

      return todayAttendance.value
    } catch (error) {
      console.error("Error getting today's attendance:", error)
      throw error
    }
  }

  const getEmployeeAttendanceLogs = async (employeeId, limit = 30) => {
    try {
      // Get records for the employee, sorted by date descending
      const logs = attendanceRecords.value
        .filter((record) => record.employee_id === employeeId)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, limit)

      return logs
    } catch (error) {
      console.error('Error getting attendance logs:', error)
      throw error
    }
  }

  // Add this new function in the store
  const clearTodayAttendance = async (employeeId) => {
    try {
      const today = new Date().toISOString().split('T')[0]

      // Filter out today's attendance for the specific employee
      attendanceRecords.value = attendanceRecords.value.filter((record) => {
        const recordDate = new Date(record.date).toISOString().split('T')[0]
        return !(recordDate === today && record.employee_id === employeeId)
      })

      // Reset today's attendance
      todayAttendance.value = null

      // Save to localStorage
      saveToLocalStorage()
    } catch (error) {
      console.error("Error clearing today's attendance:", error)
      throw error
    }
  }

  // Add new function for attendance approval
  const approveAttendance = async (recordId, approverDetails) => {
    try {
      console.log('Received approver details (detailed):', {
        name: approverDetails.name,
        userId: approverDetails.userId,
        timestamp: approverDetails.timestamp,
      })

      const index = attendanceRecords.value.findIndex((r) => r.id === recordId)
      if (index === -1) {
        throw new Error('Attendance record not found')
      }

      const updatedRecord = {
        ...attendanceRecords.value[index],
        approvalStatus: 'Approved',
        approvedBy: approverDetails.name,
        approvedAt: approverDetails.timestamp,
      }
      console.log('Record being saved (detailed):', {
        id: updatedRecord.id,
        approvalStatus: updatedRecord.approvalStatus,
        approvedBy: updatedRecord.approvedBy,
        approvedAt: updatedRecord.approvedAt,
      })

      // Update the state
      attendanceRecords.value[index] = updatedRecord

      // Update todayAttendance if this is today's record
      if (todayAttendance.value && todayAttendance.value.id === recordId) {
        todayAttendance.value = { ...updatedRecord }
        console.log('Updated todayAttendance (detailed):', {
          approvalStatus: todayAttendance.value.approvalStatus,
          approvedBy: todayAttendance.value.approvedBy,
          approvedAt: todayAttendance.value.approvedAt,
        })
      }

      saveToLocalStorage()
      return updatedRecord
    } catch (error) {
      console.error('Error approving attendance:', error)
      throw error
    }
  }

  const canReenterAttendance = (employeeId, date) => {
    const targetDate = new Date(date).toISOString().split('T')[0]
    const today = new Date().toISOString().split('T')[0]

    // Only allow re-entry for today's attendance
    if (targetDate !== today) {
      return false
    }

    // Check if there's no existing active record
    const existingRecord = attendanceRecords.value.find((record) => {
      const recordDate = new Date(record.date).toISOString().split('T')[0]
      return (
        record.employee_id === employeeId &&
        recordDate === targetDate &&
        !record.id.toString().startsWith('absent-')
      )
    })

    return !existingRecord
  }

  return {
    // State
    attendanceRecords,
    error,
    currentPage,
    itemsPerPage,
    searchQuery,
    sortBy,
    sortDesc,
    selectedDate,

    // Getters
    filteredRecords,
    paginatedRecords,
    totalPages,
    stats,
    chartData,

    // Actions
    addRecord,
    deleteRecord,
    loadRecords,
    handleSort,
    updateRecord,
    resetState,

    // Add new returns
    reportFilters,
    getAttendanceReport,
    reportSummary,
    setReportFilters,
    getAttendanceByDateRange,
    resetReportFilters,

    // Add these new returns
    todayAttendance,
    isProcessing,
    recordTimeIn,
    recordTimeOut,
    getTodayAttendance,
    getEmployeeAttendanceLogs,
    clearTodayAttendance,

    // Add new function for attendance approval
    approveAttendance,

    // Add this new function to handle daily reset
    resetDailyAttendance,

    // Add this new function to check if an employee can re-enter attendance
    canReenterAttendance,
  }
})
