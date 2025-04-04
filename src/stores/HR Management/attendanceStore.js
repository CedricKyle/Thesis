import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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

  async function addRecord(record) {
    try {
      const newRecord = {
        id: generateId(),
        ...record,
        date: new Date(record.date),
        createdAt: new Date(),
      }
      attendanceRecords.value.push(newRecord)
      saveToLocalStorage()
      return newRecord
    } catch (error) {
      setError('Failed to add record')
      throw error
    }
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
    localStorage.setItem('attendanceRecords', JSON.stringify(attendanceRecords.value))
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
