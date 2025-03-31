import { ref, computed } from 'vue'

// Make the store singleton to share state across components
const attendanceRecords = ref([])

export const useAttendanceStore = () => {
  // Generate unique ID
  const generateId = () => {
    return attendanceRecords.value.length > 0
      ? Math.max(...attendanceRecords.value.map((r) => r.id)) + 1
      : 1
  }

  // Add record
  const addRecord = async (record) => {
    try {
      const newRecord = {
        id: generateId(),
        ...record,
        date: new Date(record.date),
        createdAt: new Date(),
      }
      attendanceRecords.value.push(newRecord)

      // Save to localStorage for persistence
      localStorage.setItem('attendanceRecords', JSON.stringify(attendanceRecords.value))
      return newRecord
    } catch (error) {
      console.error('Error adding record:', error)
      throw error
    }
  }

  // Delete record
  const deleteRecord = async (id) => {
    try {
      attendanceRecords.value = attendanceRecords.value.filter((r) => r.id !== id)
      // Update localStorage
      localStorage.setItem('attendanceRecords', JSON.stringify(attendanceRecords.value))
    } catch (error) {
      console.error('Error deleting record:', error)
      throw error
    }
  }

  // Load initial data
  const loadRecords = () => {
    const savedRecords = localStorage.getItem('attendanceRecords')
    if (savedRecords) {
      // Convert date strings back to Date objects
      const records = JSON.parse(savedRecords)
      attendanceRecords.value = records.map((record) => ({
        ...record,
        date: new Date(record.date),
      }))
    }
  }

  // Stats computation
  const stats = computed(() => {
    const present = attendanceRecords.value.filter((r) => r.status === 'Present').length
    const late = attendanceRecords.value.filter((r) => r.status === 'Late').length
    const absent = attendanceRecords.value.filter((r) => r.status === 'Absent').length
    const onLeave = attendanceRecords.value.filter((r) => r.status === 'On Leave').length

    return {
      present,
      late,
      absent,
      onLeave,
    }
  })

  // Chart data computation
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

  return {
    attendanceRecords,
    addRecord,
    deleteRecord,
    loadRecords,
    stats,
    chartData,
  }
}
