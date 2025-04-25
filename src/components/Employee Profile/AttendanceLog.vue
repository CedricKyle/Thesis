<script setup>
import { ref, onMounted } from 'vue'
import { useAttendanceLogic } from '@/composables/Admin Composables/Human Resource/useAttendanceLogic'

const props = defineProps({
  employeeId: {
    type: String,
    required: true,
  },
})

const attendanceLogs = ref([])
const isLoading = ref(true)
const { calculateHours } = useAttendanceLogic()

const loadAttendanceLogs = async () => {
  isLoading.value = true
  try {
    // Call your API to get attendance logs
    // const logs = await attendanceStore.getEmployeeAttendanceLogs(props.employeeId)
    // attendanceLogs.value = logs
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
    <h2 class="text-xl font-semibold mb-4">Attendance History</h2>

    <div v-if="isLoading" class="text-center py-4">Loading attendance logs...</div>

    <div v-else-if="attendanceLogs.length === 0" class="text-center py-4 text-gray-500">
      No attendance records found
    </div>

    <div v-else class="space-y-4">
      <div v-for="log in attendanceLogs" :key="log.id" class="border-b pb-4">
        <div class="flex justify-between items-center">
          <div class="text-sm">
            <p class="font-medium">
              {{
                new Date(log.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              }}
            </p>
            <p class="text-gray-600">
              Time In: {{ log.signIn || 'Not recorded' }}
              <span class="mx-2">|</span>
              Time Out: {{ log.signOut || 'Not recorded' }}
            </p>
            <p class="text-gray-600">
              Working Hours: {{ calculateHours(log.signIn, log.signOut) || '-' }}
            </p>
          </div>
          <div>
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
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
