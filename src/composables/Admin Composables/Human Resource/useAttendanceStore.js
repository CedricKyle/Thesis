import { ref, computed } from 'vue'

const attendanceRecords = ref([])

export const useAttendanceStore = () => {
  // Compute statistics from attendance records
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

  // Compute chart data from stats
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
    stats,
    chartData,
  }
}
