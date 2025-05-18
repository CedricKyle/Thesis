import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'
import { useAttendanceLogic } from '@/composables/Admin Composables/Human Resource/useAttendanceLogic'
import axios from '@/plugins/axios'
import { useAuthStore } from '@/stores/Authentication/authStore'
import { useEmployeeScheduleStore } from '@/stores/HR Management/employeeScheduleStore'

export const useAttendanceStore = defineStore('attendance', () => {
  const { determineStatus, calculateHours, calculateOvertime } = useAttendanceLogic()

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

  // Add this new state property
  const departmentAttendanceRaw = ref([])

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

    records.forEach((r) => {
      console.log('Record:', r.full_name, 'overtimeProof:', r.overtimeProof)
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

          // Regular work window: 8:00 AM to 5:00 PM (480 to 1020)
          const workStart = 8 * 60
          const workEnd = 17 * 60
          const breakStart = 17 * 60
          const otStart = 18 * 60

          // Calculate regular minutes worked (max between 8:00 and 17:00)
          let regularMinutes = Math.max(0, Math.min(outTime, workEnd) - Math.max(inTime, workStart))

          // Deduct 1 hour break if worked at least 5 hours (300 minutes)
          if (regularMinutes >= 300) {
            regularMinutes -= 60
          }

          // Overtime: only after 6:00 PM
          let overtimeMinutes = 0
          if (outTime > otStart) {
            overtimeMinutes = outTime - otStart
          }

          // Total hours
          const regularHours = Math.max(0, regularMinutes / 60)
          const overtimeHours = Math.max(0, overtimeMinutes / 60)

          workingHours = regularHours
          if (overtimeHours > 0) {
            workingHours += overtimeHours
          }
        }

        allDates.push({
          ...existingRecord,
          date: new Date(currentDate).toLocaleDateString(),
          workingHours:
            existingRecord.hours_worked != null
              ? Number(existingRecord.hours_worked).toFixed(2)
              : workingHours
                ? Number(workingHours).toFixed(2)
                : '0.00',
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
    let overtimeDays = 0
    let earliestTimeIn = null
    let latestTimeIn = null
    let statusCount = {}
    let bestStreak = 0
    let currentStreak = 0
    let perfectAttendanceDays = 0

    records.forEach((record) => {
      if (record.signIn !== '-' && record.signOut !== '-') {
        const [inHours, inMinutes] = record.signIn.split(':').map(Number)
        const [outHours, outMinutes] = record.signOut.split(':').map(Number)

        const inTime = inHours * 60 + inMinutes
        const outTime = outHours * 60 + outMinutes

        // Regular work window: 8:00 AM to 5:00 PM (480 to 1020)
        const workStart = 8 * 60
        const workEnd = 17 * 60
        const breakStart = 17 * 60
        const otStart = 18 * 60

        // Calculate regular minutes worked (max between 8:00 and 17:00)
        let regularMinutes = Math.max(0, Math.min(outTime, workEnd) - Math.max(inTime, workStart))

        // Deduct 1 hour break if worked at least 5 hours (300 minutes)
        if (regularMinutes >= 300) {
          regularMinutes -= 60
        }

        // Overtime: only after 6:00 PM
        let overtimeMinutes = 0
        if (outTime > otStart) {
          overtimeMinutes = outTime - otStart
        }

        // Total hours
        const regularHours = Math.max(0, regularMinutes / 60)
        const overtimeHours = Math.max(0, overtimeMinutes / 60)

        totalHours += regularHours
        if (overtimeHours > 0) {
          totalOvertime += overtimeHours
          overtimeDays++
        }

        // Earliest/Latest Time In
        if (!earliestTimeIn || inTime < earliestTimeIn) earliestTimeIn = inTime
        if (!latestTimeIn || inTime > latestTimeIn) latestTimeIn = inTime
      }

      // Status count
      statusCount[record.status] = (statusCount[record.status] || 0) + 1

      // Streaks
      if (record.status === 'Present' || record.status === 'Late') {
        currentStreak++
        if (currentStreak > bestStreak) bestStreak = currentStreak
      } else {
        currentStreak = 0
      }

      // Perfect attendance
      if (record.status === 'Present') perfectAttendanceDays++

      // Count status
      const dateObj = new Date(record.date)
      const dayOfWeek = dateObj.getDay() // 0=Sunday, 1=Monday, etc.
      const dayOffs = getEmployeeDayOff(record.employee_id)

      // If this day is a day off, skip absent count
      if (record.status === 'Absent' && dayOffs.includes(dayOfWeek)) {
        // Do not count as absent
        return
      }

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

    // Find most common status
    let mostCommonStatus = Object.entries(statusCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'

    // Format earliest/latest time in
    const formatTime = (minutes) => {
      if (minutes == null) return '-'
      const h = Math.floor(minutes / 60)
      const m = minutes % 60
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
    }

    return {
      'Total Days': totalDays,
      'Total Hours': totalHours.toFixed(2),
      'Present Days': presentDays,
      'Late Days': lateDays,
      'Absent Days': absentDays,
      'On Leave Days': onLeaveDays,
      'Average Hours/Day': (totalHours / (presentDays + lateDays) || 0).toFixed(2),
      'Total Overtime': Math.round(totalOvertime * 10) / 10,
      'Days with Overtime': overtimeDays,
      'Earliest Time In': formatTime(earliestTimeIn),
      'Latest Time In': formatTime(latestTimeIn),
      'Best Attendance Streak': bestStreak,
      'Most Common Status': mostCommonStatus,
      'Perfect Attendance Days': perfectAttendanceDays,
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

  // Helper to parse time string to minutes
  function parseTimeToMinutes(timeStr) {
    if (!timeStr) return 0
    const [h, m] = timeStr.split(':').map(Number)
    return h * 60 + m
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
      const timeInResponse = await axios.post('/api/attendance/time-in', timeInData)

      if (timeInResponse.data.success) {
        // Prepare the time-out data
        const timeOutData = {
          employee_id: attendanceData.employee_id,
          time_out: formatTime(attendanceData.time_out || attendanceData.signOut),
          date: attendanceData.date,
        }

        console.log('Time-out request data:', timeOutData)

        // Then do time out with the same date
        const timeOutResponse = await axios.post('/api/attendance/time-out', timeOutData)

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
      const response = await axios.delete(`/api/attendance/attendance/${recordId}`)

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
      const response = await axios.get('/api/attendance')

      if (response.data.success) {
        const allRecords = response.data.data
        const records = allRecords.map((record) => {
          // Default schedule times
          let scheduleTimeIn = '08:00:00'
          let scheduleTimeOut = '17:00:00'

          // Check for nested schedule (EmployeeSchedule -> AvailableSchedule)
          if (record.schedule && record.schedule.schedule) {
            scheduleTimeIn = record.schedule.schedule.time_in || scheduleTimeIn
            scheduleTimeOut = record.schedule.schedule.time_out || scheduleTimeOut
          } else if (record.schedule) {
            scheduleTimeIn = record.schedule.time_in || scheduleTimeIn
            scheduleTimeOut = record.schedule.time_out || scheduleTimeOut
          }

          // Fallback for full_name and department
          const full_name =
            record.full_name ||
            (record.employee && record.employee.full_name) ||
            (record.employee && record.employee.fullName) ||
            'Unknown'
          const department =
            record.department || (record.employee && record.employee.department) || 'Unknown'

          // Always map workingHours from hours_worked (backend), fallback to regular_hours, else '0.00'
          const workingHours =
            record.hours_worked != null
              ? Number(record.hours_worked).toFixed(2)
              : record.regular_hours != null
                ? Number(record.regular_hours).toFixed(2)
                : '0.00'

          return {
            ...record,
            scheduleTimeIn,
            scheduleTimeOut,
            signIn: record.start_time || '-',
            signOut: record.end_time || '-',
            workingHours, // <-- always present, always string
            overtimeHours:
              record.overtime_hours != null ? Number(record.overtime_hours).toFixed(2) : '0.00',
            status: record.status || (record.absent ? 'Absent' : 'Present'),
            approvalStatus: record.approval_status || 'Pending',
            overtimeProof: record.overtime_proof || null,
            attendanceType: record.attendance_type || 'regular',
            approved_by: record.approved_by || null,
            date: record.date,
            full_name,
            department,
          }
        })
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
        start_time: now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        date: now.toISOString().split('T')[0],
      }

      console.log('Sending time in data:', timeInData)

      const response = await axios.post('/api/attendance/time-in', timeInData)

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
        end_time: now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        date: now.toISOString().split('T')[0],
      }

      console.log('Sending time out data:', timeOutData)

      const response = await axios.post('/api/attendance/time-out', timeOutData)

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
  const approveAttendance = async (attendanceId, approverDetails = null) => {
    try {
      const authStore = useAuthStore()
      const currentUser = authStore.currentUser

      if (!currentUser) {
        throw new Error('No authenticated user found')
      }

      console.log('Current user from auth store:', currentUser)
      console.log('Current user ID:', currentUser.id)

      // Check if approver details were passed directly
      if (approverDetails && approverDetails.name) {
        console.log('Using provided approver details:', approverDetails)
      } else {
        // Get the employee store to access employee details
        const employeeStore = useEmployeeStore()
        console.log('Employee store employees count:', employeeStore.employees.length)

        // Use string comparison to find the employee
        const currentEmployee = employeeStore.employees.find(
          (emp) => String(emp.employee_id) === String(currentUser.id),
        )

        console.log('Found employee by ID:', currentEmployee)

        if (!currentEmployee) {
          throw new Error('Employee information not found')
        }

        approverDetails = {
          name: currentEmployee.full_name,
          userId: currentUser.id,
          timestamp: new Date().toISOString(),
        }
      }

      const response = await axios.post(`/api/attendance/${attendanceId}/approve`, {
        approved_by: approverDetails.name, // Use the provided or found name
      })

      if (response.data.success) {
        await loadRecords()
        return response.data.data
      }
    } catch (error) {
      console.error('Error in approveAttendance:', error)
      throw new Error(error.response?.data?.message || 'Failed to approve attendance')
    }
  }

  // Also add these missing functions that were referenced in the return object
  const fetchTodayAttendance = async (employeeId) => {
    try {
      const response = await axios.get('/api/attendance/today', {
        params: { employee_id: employeeId },
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
      const response = await axios.get(`/api/attendance/history/${employeeId}`)
      return response.data.success ? response.data.data : []
    } catch (error) {
      console.error('Error fetching attendance history:', error)
      throw error
    }
  }

  const getDepartmentAttendance = async (department, startDate, endDate) => {
    try {
      const response = await axios.get(
        `/api/attendance/department/${department}?start_date=${startDate}&end_date=${endDate}`,
      )
      return response.data.success ? response.data.data : []
    } catch (error) {
      console.error('Error fetching department attendance:', error)
      throw error
    }
  }

  const getMonthlyReport = async (employeeId) => {
    try {
      const response = await axios.get(`/api/attendance/monthly/${employeeId}`)
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

  const getDepartmentAttendanceReport = computed(() => {
    if (
      !reportFilters.value.startDate ||
      !reportFilters.value.endDate ||
      !reportFilters.value.department
    ) {
      return []
    }

    const startDate = new Date(reportFilters.value.startDate)
    const endDate = new Date(reportFilters.value.endDate)
    const department = reportFilters.value.department

    // Filter records for the department and date range
    return attendanceRecords.value.filter(
      (record) =>
        record.department === department &&
        new Date(record.date) >= startDate &&
        new Date(record.date) <= endDate &&
        record.approvalStatus === 'Approved',
    )
  })

  const departmentReportSummary = computed(() => {
    const records = getDepartmentAttendanceReport.value
    if (!records.length) return null

    let present = 0,
      late = 0,
      absent = 0,
      onLeave = 0,
      totalHours = 0

    records.forEach((record) => {
      const dateObj = new Date(record.date)
      const dayOfWeek = dateObj.getDay() // 0=Sunday, 1=Monday, etc.
      const dayOffs = getEmployeeDayOff(record.employee_id)

      // If this day is a day off, skip absent count
      if (record.status === 'Absent' && dayOffs.includes(dayOfWeek)) {
        // Do not count as absent
        return
      }

      switch (record.status) {
        case 'Present':
          present++
          break
        case 'Late':
          late++
          break
        case 'Absent':
          absent++
          break
        case 'On Leave':
          onLeave++
          break
      }
      totalHours += Number(record.workingHours || 0)
    })

    return {
      'Total Records': records.length,
      Present: present,
      Late: late,
      Absent: absent,
      'On Leave': onLeave,
      'Total Hours': totalHours.toFixed(2),
      'Average Hours/Day': (totalHours / records.length).toFixed(2),
    }
  })

  const departmentEmployeeSummaries = computed(() => {
    const records = getDepartmentAttendanceReport.value
    if (!records.length) return []

    // Always get the latest schedule store instance
    const scheduleStore = useEmployeeScheduleStore()

    function getEmployeeDayOff(employeeId) {
      const sched = scheduleStore.employeeSchedules.find((s) => s.employee_id === employeeId)
      if (!sched || !sched.dayOff) return []
      return sched.dayOff
        .split(',')
        .map((d) => Number(d.trim()))
        .filter((n) => !isNaN(n))
    }

    // Group by employee
    const summaryMap = {}
    records.forEach((rec) => {
      if (!summaryMap[rec.full_name]) {
        summaryMap[rec.full_name] = {
          name: rec.full_name,
          present: 0,
          late: 0,
          absent: 0,
          onLeave: 0,
          totalHours: 0,
          count: 0,
        }
      }
      const dayOffs = getEmployeeDayOff(rec.employee_id)
      const dayOfWeek = new Date(rec.date).getDay()
      if (rec.status === 'Absent' && dayOffs.includes(dayOfWeek)) {
        // Skip counting as absent
        return
      }
      switch (rec.status) {
        case 'Present':
          summaryMap[rec.full_name].present++
          break
        case 'Late':
          summaryMap[rec.full_name].late++
          break
        case 'Absent':
          summaryMap[rec.full_name].absent++
          break
        case 'On Leave':
          summaryMap[rec.full_name].onLeave++
          break
      }
      summaryMap[rec.full_name].totalHours += Number(rec.workingHours || 0)
      summaryMap[rec.full_name].count++
    })

    // Convert to array
    return Object.values(summaryMap).map((emp) => ({
      ...emp,
      avgHours: emp.count ? (emp.totalHours / emp.count).toFixed(2) : '0.00',
    }))
  })

  // Add this action to fetch and map department attendance
  const fetchDepartmentAttendance = async (department, startDate, endDate) => {
    try {
      // Validate dates
      if (!startDate || !endDate) {
        throw new Error('Start date and end date are required')
      }

      const formattedStartDate = new Date(startDate).toISOString().split('T')[0]
      const formattedEndDate = new Date(endDate).toISOString().split('T')[0]
      const depParam = department || 'ALL_DEPARTMENTS'

      const response = await axios.get(`/api/attendance/department/${depParam}`, {
        params: {
          start_date: formattedStartDate,
          end_date: formattedEndDate,
        },
      })

      if (!response.data.success) {
        console.warn('No attendance data returned:', response.data.message)
        departmentAttendanceRaw.value = []
        return []
      }

      // Map the response data to match the table component expectations
      departmentAttendanceRaw.value = (response.data.data || []).map((record) => ({
        id: record.id,
        employee_id: record.employee_id,
        full_name: record.full_name,
        department: record.department,
        date: record.date,
        signIn: record.signIn,
        signOut: record.signOut,
        workingHours: record.hoursWorked != null ? Number(record.hoursWorked).toFixed(2) : '0.00',
        status: record.status,
        approval_status: record.approval_status,
        overtime_hours: Number(record.overtime_hours || 0).toFixed(2),
        overtime_proof: record.overtime_proof,
      }))

      return departmentAttendanceRaw.value
    } catch (error) {
      console.error('Error fetching department attendance:', error)
      departmentAttendanceRaw.value = []
      throw error
    }
  }

  // Computed for mapped department attendance
  const mappedDepartmentAttendance = computed(() => departmentAttendanceRaw.value)

  const departmentFullSummary = computed(() => {
    const records = mappedDepartmentAttendance.value
    if (!records.length) return null

    let present = 0,
      late = 0,
      absent = 0,
      onLeave = 0,
      totalHours = 0

    records.forEach((record) => {
      const dateObj = new Date(record.date)
      const dayOfWeek = dateObj.getDay() // 0=Sunday, 1=Monday, etc.
      const dayOffs = getEmployeeDayOff(record.employee_id)

      // If this day is a day off, skip absent count
      if (record.status === 'Absent' && dayOffs.includes(dayOfWeek)) {
        // Do not count as absent
        return
      }

      switch (record.status) {
        case 'Present':
          present++
          break
        case 'Late':
          late++
          break
        case 'Absent':
          absent++
          break
        case 'On Leave':
          onLeave++
          break
      }
      totalHours += Number(record.workingHours || 0)
    })

    return {
      'Total Records': records.length,
      Present: present,
      Late: late,
      Absent: absent,
      'On Leave': onLeave,
      'Total Hours': totalHours.toFixed(2),
      'Average Hours/Day': (totalHours / records.length).toFixed(2),
    }
  })

  const departmentFullEmployeeSummaries = computed(() => {
    const records = mappedDepartmentAttendance.value
    if (!records.length) return []

    const summaryMap = {}
    records.forEach((rec) => {
      if (!summaryMap[rec.full_name]) {
        summaryMap[rec.full_name] = {
          name: rec.full_name,
          department: rec.department,
          present: 0,
          late: 0,
          absent: 0,
          onLeave: 0,
          totalHours: 0,
          count: 0,
        }
      }
      const dayOffs = getEmployeeDayOff(rec.employee_id)
      const dayOfWeek = new Date(rec.date).getDay()

      // Only count as absent if NOT a day off
      if (rec.status === 'Absent' && dayOffs.includes(dayOfWeek)) {
        return
      }

      switch (rec.status) {
        case 'Present':
          summaryMap[rec.full_name].present++
          break
        case 'Late':
          summaryMap[rec.full_name].late++
          break
        case 'Absent':
          summaryMap[rec.full_name].absent++
          break
        case 'On Leave':
          summaryMap[rec.full_name].onLeave++
          break
      }
      summaryMap[rec.full_name].totalHours += Number(rec.workingHours || 0)
      summaryMap[rec.full_name].count++
    })

    return Object.values(summaryMap).map((emp) => ({
      ...emp,
      avgHours: emp.count ? (emp.totalHours / emp.count).toFixed(2) : '0.00',
    }))
  })

  // Add this action to update an attendance record (including OT proof)
  const updateAttendanceRecord = async (id, updates) => {
    try {
      let config = {}
      let data = updates

      // If updates is FormData (for file upload), set content type
      if (updates instanceof FormData) {
        config.headers['Content-Type'] = 'multipart/form-data'
      }

      const response = await axios.put(`/api/attendance/${id}`, data, config)

      if (response.data.success) {
        await loadRecords()
        return response.data.data
      } else {
        throw new Error(response.data.message || 'Failed to update attendance record')
      }
    } catch (error) {
      console.error('Error updating attendance record:', error)
      throw error
    }
  }

  const rejectOvertime = async (attendanceId, remarks = '') => {
    try {
      const response = await axios.put(`/api/attendance/attendance/${attendanceId}/reject-ot`, {
        remarks,
      })
      if (response.data.success) {
        await loadRecords()
        return response.data.data
      } else {
        throw new Error(response.data.message || 'Failed to reject overtime')
      }
    } catch (error) {
      console.error('Error rejecting overtime:', error)
      throw error
    }
  }

  const approveOvertime = async (attendanceId) => {
    try {
      const authStore = useAuthStore()
      const currentUser = authStore.currentUser

      if (!currentUser) {
        throw new Error('No authenticated user found')
      }

      const response = await axios.put(`/api/attendance/attendance/${attendanceId}/approve-ot`, {
        ot_approved_by: currentUser.full_name,
      })
      if (response.data.success) {
        await loadRecords()
        return response.data.data
      } else {
        throw new Error(response.data.message || 'Failed to approve overtime')
      }
    } catch (error) {
      console.error('Error approving overtime:', error)
      throw error
    }
  }

  // Example: Get day off for an employee (replace with real logic)
  function getEmployeeDayOff(employeeId) {
    // Always get the latest store instance
    const scheduleStore = useEmployeeScheduleStore()
    const sched = scheduleStore.employeeSchedules.find((s) => s.employee_id === employeeId)
    if (!sched || !sched.dayOff) return []
    // Convert "0, 6" to [0, 6]
    return sched.dayOff
      .split(',')
      .map((d) => Number(d.trim()))
      .filter((n) => !isNaN(n))
  }

  const bulkApproveAttendance = async (ids) => {
    const authStore = useAuthStore()
    const currentUser = authStore.currentUser
    try {
      const response = await axios.post('/api/attendance/bulk-approve', {
        ids,
        approved_by: currentUser.full_name,
      })
      if (response.data.success) {
        await loadRecords()
        return response.data
      } else {
        throw new Error(response.data.message || 'Bulk approve failed')
      }
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Bulk approve failed')
    }
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

    // Add this new computed property
    getDepartmentAttendanceReport,

    // Add this new computed property
    departmentReportSummary,

    // Add this new computed property
    departmentEmployeeSummaries,

    // Add this new action
    fetchDepartmentAttendance,

    // Add this new computed property
    mappedDepartmentAttendance,

    // Add this new computed property
    departmentFullSummary,

    // Add this new computed property
    departmentFullEmployeeSummaries,

    // Add this new action
    updateAttendanceRecord,

    // Add this new action
    rejectOvertime,

    // Add this new action
    approveOvertime,

    // Add this new action
    bulkApproveAttendance,
  }
})
