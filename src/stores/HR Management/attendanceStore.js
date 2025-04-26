import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'
import { useAttendanceLogic } from '@/composables/Admin Composables/Human Resource/useAttendanceLogic'
import axios from 'axios'
import { useAuthStore } from '@/stores/Authentication/authStore'

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

  // API base URL
  const API_URL = '/api/attendance' // Add /api prefix

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
          record.full_name.toLowerCase().includes(query) ||
          record.department.toLowerCase().includes(query),
      )
    }

    records.sort((a, b) => {
      const comparison =
        sortBy.value === 'id' ? a.id - b.id : a.full_name.localeCompare(b.full_name)
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

  // Actions
  const addRecord = async (attendanceData) => {
    try {
      // Log the incoming data
      console.log('Attendance Data received:', attendanceData)

      // Validate required data
      if (!attendanceData.employee_id || !attendanceData.date) {
        throw new Error('Employee ID and date are required')
      }

      // Ensure time format is consistent
      const formatTime = (time) => {
        if (!time) return null
        return time.includes(':')
          ? time.split(':').length === 2
            ? `${time}:00`
            : time
          : `${time}:00`
      }

      // Prepare the time-in data
      const timeInData = {
        employee_id: attendanceData.employee_id,
        time_in: formatTime(attendanceData.time_in || attendanceData.signIn),
        date: attendanceData.date,
      }

      console.log('Time-in request data:', timeInData)

      // First do time in
      const timeInResponse = await axios.post('/api/attendance/time-in', timeInData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })

      if (timeInResponse.data.success) {
        // Prepare the time-out data
        const timeOutData = {
          employee_id: attendanceData.employee_id,
          time_out: formatTime(attendanceData.time_out || attendanceData.signOut),
          date: attendanceData.date,
        }

        console.log('Time-out request data:', timeOutData)

        // Then do time out with the same date
        const timeOutResponse = await axios.post('/api/attendance/time-out', timeOutData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })

        if (timeOutResponse.data.success) {
          await loadRecords()
          return timeOutResponse.data.data
        }
      }
    } catch (error) {
      // Log the detailed error
      console.error('Error adding attendance record:', {
        message: error.message,
        response: error.response?.data,
        data: error.response?.config?.data,
      })
      throw error
    }
  }

  const deleteRecord = async (recordId) => {
    try {
      const response = await axios.delete(`/api/attendance/attendance/${recordId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.data.success) {
        // Remove the record from the local state
        attendanceRecords.value = attendanceRecords.value.filter((record) => record.id !== recordId)

        // Clear today's attendance for the specific employee
        const deletedRecord = attendanceRecords.value.find((record) => record.id === recordId)
        if (deletedRecord) {
          await clearTodayAttendance(deletedRecord.employee_id)
        }

        // Reset the todayAttendance state for this employee
        if (todayAttendance.value?.id === recordId) {
          todayAttendance.value = null
        }

        return response.data
      }
    } catch (error) {
      console.error('Error deleting record:', error)
      if (error.response?.status === 404) {
        throw new Error('Attendance record not found')
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      } else {
        throw new Error('Failed to delete attendance record')
      }
    }
  }

  async function loadRecords() {
    try {
      const response = await axios.get('/api/attendance', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })

      if (response.data.success) {
        const employeeStore = useEmployeeStore()
        await employeeStore.loadEmployees()

        // Format time consistently
        const formatTime = (time) => {
          if (!time || time === '-') return '-'
          const timeParts = time.split(':')
          return timeParts.slice(0, 2).join(':') // Return HH:mm format
        }

        // Map the attendance records to include employee details
        const records = response.data.data.map((record) => ({
          id: record.id,
          employee_id: record.employee_id,
          full_name: record.employee?.full_name,
          department: record.employee?.department,
          signIn: formatTime(record.time_in),
          signOut: formatTime(record.time_out),
          workingHours: record.working_hours || 0,
          status: record.status || 'Absent',
          date: record.date,
          approvalStatus: record.approval_status || 'Pending',
        }))

        attendanceRecords.value = records
      }
    } catch (error) {
      console.error('Error loading records:', error)
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
  const recordTimeIn = async (employee_id, employeeData = null) => {
    isProcessing.value = true
    try {
      // Format current date and time
      const now = new Date()
      const timeInData = {
        employee_id: employee_id,
        time_in: now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        date: now.toISOString().split('T')[0],
      }

      console.log('Sending time in data:', timeInData)

      const response = await axios.post('/api/attendance/time-in', timeInData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })

      if (response.data.success) {
        // Map the response data to match the expected format
        const mappedData = {
          id: response.data.data.id,
          employee_id: response.data.data.employee_id,
          full_name: employeeData?.full_name || response.data.data.employee?.full_name,
          department: employeeData?.department || response.data.data.employee?.department,
          signIn: response.data.data.time_in,
          signOut: response.data.data.time_out || '-',
          time_in: response.data.data.time_in,
          time_out: response.data.data.time_out || '-',
          status: response.data.data.status,
          approvalStatus: response.data.data.approval_status || 'Pending',
          overtime: response.data.data.overtime_hours || 0,
          workingHours: response.data.data.working_hours || 0,
          approvedBy: response.data.data.approved_by || '-',
          approvedAt: response.data.data.approved_at || '-',
        }

        todayAttendance.value = mappedData
        await loadRecords()
        return mappedData
      }
    } catch (error) {
      console.error('Time in error:', error.response?.data || error)
      throw new Error(error.response?.data?.message || 'Failed to record time in')
    } finally {
      isProcessing.value = false
    }
  }

  const recordTimeOut = async (employee_id) => {
    isProcessing.value = true
    try {
      // Format current date and time
      const now = new Date()
      const timeOutData = {
        employee_id: employee_id,
        time_out: now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        date: now.toISOString().split('T')[0], // Add the date field
      }

      console.log('Sending time out data:', timeOutData)

      const response = await axios.post('/api/attendance/time-out', timeOutData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })

      if (response.data.success) {
        // Map the response data to match the expected format
        const mappedData = {
          id: response.data.data.id,
          employee_id: response.data.data.employee_id,
          signIn: response.data.data.time_in || '-',
          signOut: response.data.data.time_out || '-',
          time_in: response.data.data.time_in || '-',
          time_out: response.data.data.time_out || '-',
          status: response.data.data.status,
          approvalStatus: response.data.data.approval_status || 'Pending',
          overtime: response.data.data.overtime_hours || 0,
          workingHours: response.data.data.working_hours || 0,
          approvedBy: response.data.data.approved_by || '-',
          approvedAt: response.data.data.approved_at || '-',
        }

        todayAttendance.value = mappedData
        await loadRecords()
        return mappedData
      }
    } catch (error) {
      console.error('Time out error:', error.response?.data || error)
      throw new Error(error.response?.data?.message || 'Failed to record time out')
    } finally {
      isProcessing.value = false
    }
  }

  const getTodayAttendance = async (employee_id) => {
    try {
      if (!employee_id) {
        throw new Error('Employee ID is required')
      }

      const response = await axios.get('/api/attendance/today', {
        params: { employee_id },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })

      if (response.data.success) {
        const data = response.data.data
        todayAttendance.value = data
          ? {
              ...data,
              signIn: data.time_in || '-',
              signOut: data.time_out || '-',
              time_in: data.time_in || '-',
              time_out: data.time_out || '-',
              approvedBy: data.approved_by || '-',
              approvedAt: data.approved_at || '-',
            }
          : null
        return todayAttendance.value
      }
    } catch (error) {
      console.error("Error fetching today's attendance:", error)
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

      // Reset today's attendance if it belongs to this employee
      if (todayAttendance.value?.employee_id === employeeId) {
        todayAttendance.value = null
      }

      // Emit an event to notify components about the attendance change
      window.dispatchEvent(
        new CustomEvent('attendance-updated', {
          detail: { employeeId },
        }),
      )
    } catch (error) {
      console.error("Error clearing today's attendance:", error)
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

  // Add this function before the return statement
  const approveAttendance = async (attendanceId) => {
    try {
      const authStore = useAuthStore()
      const currentUser = authStore.currentUser

      if (!currentUser) {
        throw new Error('No authenticated user found')
      }

      // Get the employee store to access employee details
      const employeeStore = useEmployeeStore()
      const currentEmployee = employeeStore.employees.find(
        (emp) => emp.employee_id === currentUser.id,
      )

      if (!currentEmployee) {
        throw new Error('Employee information not found')
      }

      const response = await axios.post(
        `/api/attendance/${attendanceId}/approve`,
        {
          approved_by: currentEmployee.full_name, // Now storing full name
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } },
      )

      if (response.data.success) {
        await loadRecords()
        return response.data.data
      }
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to approve attendance')
    }
  }

  // Also add these missing functions that were referenced in the return object
  const fetchTodayAttendance = async (employeeId) => {
    try {
      const response = await axios.get('/api/attendance/today', {
        params: { employee_id: employeeId },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.data.success) {
        todayAttendance.value = response.data.data
        return response.data.data
      }
    } catch (error) {
      console.error("Error fetching today's attendance:", error)
      throw error
    }
  }

  const getAttendanceHistory = async (employeeId) => {
    try {
      const response = await axios.get(`/api/attendance/history/${employeeId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      return response.data.success ? response.data.data : []
    } catch (error) {
      console.error('Error fetching attendance history:', error)
      throw error
    }
  }

  const getDepartmentAttendance = async (department) => {
    try {
      const response = await axios.get(`/api/attendance/department/${department}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      return response.data.success ? response.data.data : []
    } catch (error) {
      console.error('Error fetching department attendance:', error)
      throw error
    }
  }

  const getMonthlyReport = async (employeeId) => {
    try {
      const response = await axios.get(`/api/attendance/monthly/${employeeId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      return response.data.success ? response.data.data : null
    } catch (error) {
      console.error('Error fetching monthly report:', error)
      throw error
    }
  }

  // Add this function to your store
  const resetDailyAttendance = () => {
    // Reset any daily attendance-related state
    todayAttendance.value = null
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

    // Add these new actions
    fetchTodayAttendance,
    getAttendanceHistory,
    getDepartmentAttendance,
    getMonthlyReport,

    // Add this new function
    resetDailyAttendance,

    // Add this new function
    canReenterAttendance,
  }
})
