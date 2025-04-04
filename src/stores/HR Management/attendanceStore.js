import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'

export const useAttendanceStore = defineStore('attendance', () => {
  // State
  const attendanceRecords = ref([])
  const error = ref(null)
  const currentPage = ref(1)
  const itemsPerPage = ref(8)
  const searchQuery = ref('')
  const sortBy = ref('id')
  const sortDesc = ref(false)
  const selectedDate = ref(new Date().toISOString().split('T')[0])

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

      const newRecord = {
        id: generateId(),
        employeeId: record.employeeId,
        name: record.name,
        department: record.department,
        date: new Date(record.date),
        signIn: record.signIn,
        signOut: record.signOut,
        workingHours: calculateWorkingHours(record.signIn, record.signOut),
        status: calculateStatus(record.signIn),
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
  function calculateWorkingHours(signIn, signOut) {
    if (!signIn || !signOut) return '0'

    const [inHours, inMinutes] = signIn.split(':')
    const [outHours, outMinutes] = signOut.split(':')

    const inTime = parseInt(inHours) * 60 + parseInt(inMinutes)
    const outTime = parseInt(outHours) * 60 + parseInt(outMinutes)

    const diffMinutes = outTime - inTime
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60

    return `${hours}.${minutes.toString().padStart(2, '0')}`
  }

  function calculateStatus(signIn) {
    if (!signIn) return 'Absent'

    const [hours, minutes] = signIn.split(':')
    const signInTime = parseInt(hours) * 60 + parseInt(minutes)
    const startTime = 8 * 60 // 8:00 AM

    if (signInTime <= startTime) return 'Present'
    if (signInTime <= startTime + 15) return 'Late'
    return 'Late'
  }

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
  }
})
