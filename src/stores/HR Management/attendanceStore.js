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

    // Create a map of existing attendance records
    const attendanceMap = new Map(
      attendanceRecords.value
        .filter((record) => record.employee_id === reportFilters.value.employeeId)
        .map((record) => [new Date(record.date).toDateString(), record]),
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

  // Actions
  const addRecord = async (attendanceData) => {
    try {
      // Generate a new ID for the record
      const newId = generateId()

      // Create the new record with all required fields
      const newRecord = {
        id: newId,
        full_name: attendanceData.full_name,
        employee_id: attendanceData.employee_id,
        department: attendanceData.department,
        date: new Date(attendanceData.date),
        signIn: attendanceData.signIn || '-',
        signOut: attendanceData.signOut || '-',
        workingHours: calculateHours(attendanceData.signIn, attendanceData.signOut) || '-',
        status: determineStatus(attendanceData.signIn),
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

  async function deleteRecord(id) {
    try {
      attendanceRecords.value = attendanceRecords.value.filter((r) => r.id !== id)
      saveToLocalStorage()
    } catch (error) {
      console.error('Error deleting record:', error)
      throw error
    }
  }

  function loadRecords() {
    const savedRecords = localStorage.getItem('attendanceRecords')
    if (savedRecords) {
      const records = JSON.parse(savedRecords)
      attendanceRecords.value = records.map((record) => ({
        ...record,
        date: new Date(record.date),
        status: determineStatus(record.signIn),
        workingHours: calculateHours(record.signIn, record.signOut),
      }))
    }
  }

  function saveToLocalStorage() {
    try {
      localStorage.setItem('attendanceRecords', JSON.stringify(attendanceRecords.value))
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
  }
})
