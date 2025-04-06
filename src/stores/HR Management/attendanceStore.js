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

  // Add new getters for reports
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
        .filter((record) => record.employeeId === reportFilters.value.employeeId)
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

          const inTime = parseInt(inHours) * 60 + parseInt(inMinutes)
          const outTime = parseInt(outHours) * 60 + parseInt(outMinutes)

          // Only calculate hours if sign out is after sign in
          if (outTime > inTime) {
            workingHours = (outTime - inTime) / 60
          }
        }

        allDates.push({
          ...existingRecord,
          date: new Date(currentDate).toLocaleDateString(),
          workingHours: parseFloat(workingHours.toFixed(2)),
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
          employeeId: reportFilters.value.employeeId,
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
    const totalHours = records.reduce((sum, record) => {
      return sum + (Number(record.workingHours) || 0)
    }, 0)

    const presentDays = records.filter((r) => r.status === 'Present').length
    const lateDays = records.filter((r) => r.status === 'Late').length
    const absentDays = records.filter((r) => r.status === 'Absent').length
    const onLeaveDays = records.filter((r) => r.status === 'On Leave').length

    return {
      totalDays,
      totalHours: totalHours.toFixed(2),
      presentDays,
      lateDays,
      absentDays,
      onLeaveDays,
      averageHoursPerDay: (totalHours / (presentDays + lateDays)).toFixed(2) || '0.00',
    }
  })

  // Actions
  async function addRecord(record) {
    try {
      console.log('Record received:', record)

      if (!record.employeeId || !record.name) {
        throw new Error('Employee information is required')
      }

      // Check for duplicate attendance
      const existingRecord = attendanceRecords.value.find(
        (att) =>
          att.employeeId === record.employeeId &&
          new Date(att.date).toISOString().split('T')[0] ===
            new Date(record.date).toISOString().split('T')[0],
      )

      if (existingRecord) {
        throw new Error('Attendance record already exists for this employee on this date')
      }

      const status = determineStatus(record.signIn)
      const workingHours = calculateHours(record.signIn, record.signOut)

      const newRecord = {
        id: generateId(),
        employeeId: record.employeeId,
        name: record.name,
        department: record.department,
        date: new Date(record.date),
        signIn: record.signIn,
        signOut: record.signOut,
        workingHours: workingHours,
        status: status,
        createdAt: new Date(),
      }

      console.log('New record to be added:', newRecord)

      attendanceRecords.value.push(newRecord)
      saveToLocalStorage()
      return newRecord
    } catch (error) {
      console.error('Failed to add record:', error)
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
        record.employeeId === employeeId
      )
    })
  }

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
