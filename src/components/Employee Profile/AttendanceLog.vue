<script setup>
import { ref, onMounted } from 'vue'
import { useAttendanceLogic } from '@/composables/Admin Composables/Human Resource/useAttendanceLogic'
import { useAttendanceStore } from '@/stores/HR Management/attendanceStore'

const props = defineProps({
  employeeId: {
    type: String,
    required: true,
  },
})

const attendanceLogs = ref([])
const isLoading = ref(true)
const todayAttendance = ref(null)
const { calculateHours } = useAttendanceLogic()
const attendanceStore = useAttendanceStore()

const filterOption = ref('today') // default
const filterOptions = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
]

const getStartOfWeek = (date) => {
  const d = new Date(date)
  const day = d.getDay() || 7 // Sunday is 0, make it 7
  if (day !== 1) d.setHours(-24 * (day - 1))
  d.setHours(0, 0, 0, 0)
  return d
}

const getStartOfMonth = (date) => {
  const d = new Date(date)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

const loadAttendanceLogs = async () => {
  isLoading.value = true
  try {
    await attendanceStore.loadRecords()
    const logs = await attendanceStore.getEmployeeAttendanceLogs(props.employeeId, 100)
    let filtered = []

    const now = new Date()
    if (filterOption.value === 'today') {
      const todayStr = now.toISOString().split('T')[0]
      filtered = logs.filter((log) => log.date && log.date.startsWith(todayStr))
    } else if (filterOption.value === 'week') {
      const startOfWeek = getStartOfWeek(now)
      filtered = logs.filter((log) => {
        const logDate = new Date(log.date)
        return logDate >= startOfWeek && logDate <= now
      })
    } else if (filterOption.value === 'month') {
      const startOfMonth = getStartOfMonth(now)
      filtered = logs.filter((log) => {
        const logDate = new Date(log.date)
        return logDate >= startOfMonth && logDate <= now
      })
    }
    attendanceLogs.value = filtered

    todayAttendance.value = await attendanceStore.getTodayAttendance(props.employeeId)
  } catch (error) {
    console.error('Error loading attendance logs:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadAttendanceLogs()
})
</script>

<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h2 class="text-xl font-semibold mb-4 text-black">Attendance History</h2>

    <div class="mb-4 text-black">
      <h3 class="text-lg font-semibold mb-2">Today's Attendance</h3>
      <div v-if="isLoading" class="text-center py-2">Loading...</div>
      <div v-else-if="todayAttendance">
        <div
          class="p-3 rounded bg-gray-50 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
        >
          <div>
            <span class="font-medium">Status:</span>
            <span
              :class="{
                'badge-outline badge-success': todayAttendance.status === 'Present',
                'badge-outline badge-warning': todayAttendance.status === 'Late',
                'badge-outline badge-error': todayAttendance.status === 'Absent',
                'px-2 py-1 text-xs font-medium rounded-full': true,
              }"
            >
              {{ todayAttendance.status || 'N/A' }}
            </span>
          </div>
          <div>
            <span class="font-medium">Time In:</span>
            <span>{{ todayAttendance.signIn || todayAttendance.time_in || '-' }}</span>
            <span class="mx-2">|</span>
            <span class="font-medium">Time Out:</span>
            <span>{{ todayAttendance.signOut || todayAttendance.time_out || '-' }}</span>
          </div>
          <div>
            <span class="font-medium">Working Hours:</span>
            <span>{{
              calculateHours(
                todayAttendance.signIn || todayAttendance.time_in,
                todayAttendance.signOut || todayAttendance.time_out,
              ) || '-'
            }}</span>
          </div>
        </div>
      </div>
      <div v-else class="text-gray-500 text-sm">No attendance record for today.</div>
    </div>

    <div class="flex items-center gap-2 mb-2">
      <label class="font-medium text-sm text-black">Show:</label>
      <select
        v-model="filterOption"
        @change="loadAttendanceLogs"
        class="input-search input-sm border border-gray-300"
      >
        <option v-for="opt in filterOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
      <button class="btn-primaryStyle" @click="loadAttendanceLogs">Refresh</button>
    </div>

    <div v-if="isLoading" class="text-center py-4">Loading attendance logs...</div>

    <div v-else-if="attendanceLogs.length === 0" class="text-center py-4 text-gray-500">
      No attendance records found
    </div>

    <div v-else>
      <div class="overflow-x-auto text-black">
        <table class="min-w-full text-xs md:text-sm">
          <thead>
            <tr>
              <th class="px-2 py-1">Date</th>
              <th class="px-2 py-1">Time In</th>
              <th class="px-2 py-1">Time Out</th>
              <th class="px-2 py-1">Working Hours</th>
              <th class="px-2 py-1">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in attendanceLogs" :key="log.id">
              <td class="px-2 py-1">
                {{
                  new Date(log.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                }}
              </td>
              <td class="px-2 py-1">{{ log.signIn || 'Not recorded' }}</td>
              <td class="px-2 py-1">{{ log.signOut || 'Not recorded' }}</td>
              <td class="px-2 py-1">{{ calculateHours(log.signIn, log.signOut) || '-' }}</td>
              <td class="px-2 py-1">
                <span
                  :class="{
                    'px-2 py-1 text-xs font-medium rounded-full': true,
                    'badge-outline badge-success': log.status === 'Present',
                    'badge-outline badge-warning': log.status === 'Late',
                    'badge-outline badge-error': log.status === 'Absent',
                  }"
                >
                  {{ log.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
