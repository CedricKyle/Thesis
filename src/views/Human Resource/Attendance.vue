<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAttendanceStore } from '@/stores/HR Management/attendanceStore'
import { useAttendanceForm } from '@/composables/Admin Composables/Human Resource/useAttendanceForm'
import { useAttendanceLogic } from '@/composables/Admin Composables/Human Resource/useAttendanceLogic'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'
import AttendanceTable from '@/components/Admin Components/HR/AttendanceTable.vue'
import Toast from '@/components/Admin Components/HR/Toast.vue'
import AttendanceForm from '@/components/Admin Components/HR/AttendanceForm.vue'
import { useAuthStore } from '@/stores/Authentication/authStore'
import { Clock } from 'lucide-vue-next'

// Store initialization
const attendanceStore = useAttendanceStore()
const employeeStore = useEmployeeStore()
const authStore = useAuthStore()
const { attendanceRecords } = storeToRefs(attendanceStore)
const { employees } = storeToRefs(employeeStore)
const { addRecord, deleteRecord, loadRecords } = attendanceStore

// Form and logic setup
const { newAttendance, departments, resetForm } = useAttendanceForm(attendanceRecords)
const { formatDate, calculateHours, determineStatus } = useAttendanceLogic()

// State management
const state = ref({
  currentPage: 1,
  itemsPerPage: 8,
  searchQuery: '',
  sortBy: 'id',
  sortDesc: false,
  selectedDate: new Date().toISOString().split('T')[0],
  toast: {
    show: false,
    message: '',
    type: 'success',
  },
})

// Modal state management
const modalState = ref({
  view: false,
  delete: false,
  confirm: false,
  selectedRecord: null,
})

// Add these new refs for digital time in/out
const currentDateTime = ref(new Date())
const isProcessing = ref(false)

// Update the time every second
setInterval(() => {
  currentDateTime.value = new Date()
}, 1000)

// Formatted date and time computed properties
const formattedDate = computed(() => {
  return currentDateTime.value.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

const formattedTime = computed(() => {
  return currentDateTime.value.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
})

// Add these computed properties for time in/out button states
const canTimeIn = computed(() => {
  const attendance = attendanceStore.todayAttendance
  return !attendance || attendance.signIn === '-' || attendance.id?.toString().startsWith('absent-')
})

const canTimeOut = computed(() => {
  const attendance = attendanceStore.todayAttendance
  return (
    attendance &&
    attendance.signIn !== '-' &&
    attendance.signOut === '-' &&
    !attendance.id?.toString().startsWith('absent-')
  )
})

// Initialize data
onMounted(() => {
  loadRecords()
  employeeStore.loadEmployees()
})

// Toast handler
const showToast = (message, type = 'success') => {
  state.value.toast = { show: true, message, type }
  setTimeout(() => {
    state.value.toast.show = false
  }, 3000)
}

// Form handlers
const handleFormSubmit = (formData) => {
  console.log('Form data received:', formData)
  // Create a new object with the exact structure needed for the modal
  modalState.value.selectedRecord = {
    full_name: formData.full_name,
    department: formData.department,
    date: formData.date,
    signIn: formData.time_in, // Map time_in to signIn
    signOut: formData.time_out, // Map time_out to signOut
    employee_id: formData.employee_id,
  }
  modalState.value.confirm = true
}

const confirmAndSave = async () => {
  try {
    const attendanceData = {
      name: newAttendance.value.employeeName,
      employeeId: newAttendance.value.employeeId,
      department: newAttendance.value.department,
      date: newAttendance.value.date,
      signIn: newAttendance.value.signIn,
      signOut: newAttendance.value.signOut,
    }

    await addRecord(attendanceData)
    resetForm()
    modalState.value.confirm = false
    showToast('Attendance added successfully')

    newAttendance.value = {
      employeeName: '',
      employeeId: '',
      department: '',
      date: '',
      signIn: '',
      signOut: '',
    }
  } catch (error) {
    showToast(error.message || 'Failed to add attendance', 'error')
  }
}

// Record action handlers
const viewRecord = (record) => {
  modalState.value.selectedRecord = record
  modalState.value.view = true
}

const handleDelete = async (record) => {
  try {
    modalState.value.selectedRecord = record
    modalState.value.delete = true
  } catch (error) {
    console.error('Error preparing delete:', error)
    showToast('Failed to prepare delete operation', 'error')
  }
}

const confirmDelete = async () => {
  try {
    const record = modalState.value.selectedRecord
    if (!record) return

    await attendanceStore.deleteRecord(record.id)

    // Refresh the table data
    await tableRef.value?.refreshTableData()

    showToast('Attendance record deleted successfully', 'success')
    modalState.value.delete = false
    modalState.value.selectedRecord = null
  } catch (error) {
    console.error('Error deleting record:', error)
    showToast('Failed to delete attendance record', 'error')
  }
}

// Sorting handler
const handleSort = (column) => {
  if (state.value.sortBy === column) {
    state.value.sortDesc = !state.value.sortDesc
  } else {
    state.value.sortBy = column
    state.value.sortDesc = false
  }
}

// Computed properties
const filteredRecords = computed(() => {
  if (!attendanceRecords.value || !employees.value) return []

  const dateRecords = new Map(
    attendanceRecords.value
      .filter((record) => {
        const recordDate = new Date(record.date).toISOString().split('T')[0]
        return recordDate === state.value.selectedDate
      })
      .map((record) => [record.employee_id, record]),
  )

  let records = employees.value.map(
    (employee) =>
      dateRecords.get(employee.employee_id) || {
        id: `absent-${employee.employee_id}`,
        employee_id: employee.employee_id,
        full_name: employee.full_name,
        department: employee.department,
        date: new Date(state.value.selectedDate),
        signIn: '-',
        signOut: '-',
        workingHours: '-',
        status: 'Absent',
        createdAt: new Date(),
      },
  )

  if (state.value.searchQuery) {
    const query = state.value.searchQuery.toLowerCase()
    records = records.filter(
      (record) =>
        record.full_name.toLowerCase().includes(query) ||
        record.department.toLowerCase().includes(query),
    )
  }

  const sortField = state.value.sortBy
  const sortMultiplier = state.value.sortDesc ? -1 : 1

  return records.sort((a, b) => {
    const compareValue =
      sortField === 'full_name' || sortField === 'department'
        ? a[sortField].localeCompare(b[sortField])
        : 0
    return compareValue * sortMultiplier
  })
})

const paginatedRecords = computed(() => {
  const start = (state.value.currentPage - 1) * state.value.itemsPerPage
  return filteredRecords.value.slice(start, start + state.value.itemsPerPage)
})

const totalPages = computed(() =>
  Math.ceil(filteredRecords.value.length / state.value.itemsPerPage),
)

const handleAttendanceSubmit = async (attendanceData) => {
  try {
    console.log('Submitting attendance data:', attendanceData)

    if (!attendanceData || !attendanceData.employee_id) {
      showToast('Invalid attendance data', 'error')
      return
    }

    // Ensure consistent time format by adding seconds if not present
    const formatTime = (time) => {
      if (!time) return null
      return time.includes(':')
        ? time.split(':').length === 2
          ? `${time}:00`
          : time
        : `${time}:00`
    }

    // Create the attendance record with consistent format
    const record = {
      employee_id: attendanceData.employee_id,
      date: attendanceData.date,
      time_in: formatTime(attendanceData.time_in || attendanceData.signIn),
      time_out: formatTime(attendanceData.time_out || attendanceData.signOut),
    }

    console.log('Formatted record to submit:', record)

    await attendanceStore.addRecord(record)
    modalState.value.confirm = false
    showToast('Attendance added successfully')
    await loadRecords()
    resetForm()
  } catch (error) {
    console.error('Error saving attendance:', {
      message: error.message,
      response: error.response?.data,
      data: error.response?.config?.data,
    })
    showToast(error.message || 'Failed to add attendance', 'error')
  }
}

// Function to fetch updated records
const fetchAttendanceRecords = async () => {
  try {
    // Update your attendance records state here
    // This will automatically update the table due to reactivity
    await loadRecords()
  } catch (error) {
    console.error('Error fetching attendance records:', error)
    // Handle error
  }
}

// Add this helper function
const calculateWorkingHours = (record) => {
  if (
    !record ||
    !record.signIn ||
    !record.signOut ||
    record.signIn === '-' ||
    record.signOut === '-'
  ) {
    return '-'
  }

  // Parse hours and minutes
  const [inHours, inMinutes] = record.signIn.split(':').map(Number)
  const [outHours, outMinutes] = record.signOut.split(':').map(Number)

  // Calculate total minutes since start of day
  const totalMinutesIn = inHours * 60 + inMinutes
  const totalMinutesOut = outHours * 60 + outMinutes

  // Calculate difference in minutes
  const diffMinutes = totalMinutesOut - totalMinutesIn

  // Convert to hours and minutes
  const hours = Math.floor(diffMinutes / 60)
  const minutes = diffMinutes % 60

  // Calculate overtime (anything over 8 hours)
  const overtime = Math.max(0, hours - 8)
  const regularHours = hours >= 8 ? 8 : hours

  // Format the output
  if (overtime > 0) {
    return `${regularHours}:${minutes.toString().padStart(2, '0')} + ${overtime}:00 OT`
  }
  return `${hours}:${minutes.toString().padStart(2, '0')}`
}

const tableRef = ref(null)

const isHR = computed(() => {
  return (
    authStore.currentUser?.department === 'HR Department' ||
    authStore.currentUser?.role === 'Super Admin'
  )
})

// Add these methods for digital time in/out
const handleTimeIn = async () => {
  if (!authStore.currentUser?.id) {
    showToast('User information not found', 'error')
    return
  }

  isProcessing.value = true
  try {
    const result = await attendanceStore.recordTimeIn(authStore.currentUser.id)
    showToast(`Time In recorded successfully at ${formattedTime.value}`)
    await loadRecords() // Refresh the records
  } catch (error) {
    showToast(error.message || 'Failed to record Time In', 'error')
  } finally {
    isProcessing.value = false
  }
}

const handleTimeOut = async () => {
  if (!authStore.currentUser?.id) {
    showToast('User information not found', 'error')
    return
  }

  isProcessing.value = true
  try {
    const result = await attendanceStore.recordTimeOut(authStore.currentUser.id)
    showToast(`Time Out recorded successfully at ${formattedTime.value}`)
    await loadRecords() // Refresh the records
  } catch (error) {
    showToast(error.message || 'Failed to record Time Out', 'error')
  } finally {
    isProcessing.value = false
  }
}
</script>

<template>
  <div class="attendance-container">
    <Toast v-bind="state.toast" />

    <!-- Add Digital Time In/Out Section for Regular Employees -->
    <div v-if="!isHR" class="mb-8 bg-white p-6 rounded-lg shadow-lg border border-gray-200/50">
      <div class="flex flex-col items-center space-y-4">
        <!-- Date and Time Display -->
        <div class="text-center">
          <div class="text-3xl font-bold text-primaryColor">{{ formattedTime }}</div>
          <div class="text-gray-600">{{ formattedDate }}</div>
        </div>

        <!-- Time In/Out Buttons -->
        <div class="flex gap-4 mt-4">
          <button
            @click="handleTimeIn"
            :disabled="isProcessing || !canTimeIn"
            class="btn-primaryStyle flex items-center gap-2"
            :class="{ 'opacity-50 cursor-not-allowed': !canTimeIn }"
          >
            <Clock class="w-5 h-5" />
            <span v-if="isProcessing">Processing...</span>
            <span v-else>Time In</span>
          </button>

          <button
            @click="handleTimeOut"
            :disabled="isProcessing || !canTimeOut"
            class="btn-errorStyle flex items-center gap-2"
            :class="{ 'opacity-50 cursor-not-allowed': !canTimeOut }"
          >
            <Clock class="w-5 h-5" />
            <span v-if="isProcessing">Processing...</span>
            <span v-else>Time Out</span>
          </button>
        </div>

        <!-- Today's Attendance Status -->
        <div class="w-full max-w-md mt-6">
          <div class="bg-gray-50 p-4 rounded-lg">
            <h3 class="font-semibold mb-2">Today's Attendance</h3>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div class="text-gray-600">Time In:</div>
              <div>{{ attendanceStore.todayAttendance?.signIn || '-' }}</div>

              <div class="text-gray-600">Time Out:</div>
              <div>{{ attendanceStore.todayAttendance?.signOut || '-' }}</div>

              <div class="text-gray-600">Status:</div>
              <div
                :class="{
                  'text-green-600': attendanceStore.todayAttendance?.status === 'Present',
                  'text-yellow-600': attendanceStore.todayAttendance?.status === 'Late',
                  'text-red-600':
                    !attendanceStore.todayAttendance?.status ||
                    attendanceStore.todayAttendance?.status === 'Absent',
                }"
              >
                {{ attendanceStore.todayAttendance?.status || 'Not Recorded' }}
              </div>

              <div class="text-gray-600">Working Hours:</div>
              <div>{{ attendanceStore.todayAttendance?.workingHours || '-' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- HR View -->
    <div v-if="isHR" class="tabs tabs-border bg-primaryColor border border-gray-200/50 shadow-md">
      <!-- Attendance List Tab -->
      <input
        type="radio"
        name="my_tabs_2"
        class="tab"
        aria-label="Attendance List"
        checked="checked"
      />
      <div class="tab-content bg-white p-2">
        <div class="flex justify-between items-center gap-4 mb-4">
          <input
            type="date"
            v-model="state.selectedDate"
            class="input input-bordered input-sm w-auto !outline-none hover:shadow-md bg-white text-black border-primaryColor"
          />

          <label class="input-search input-sm">
            <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <g
                stroke-linejoin="round"
                stroke-linecap="round"
                stroke-width="2.5"
                fill="none"
                stroke="currentColor"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </g>
            </svg>
            <input v-model="state.searchQuery" type="search" required placeholder="Search" />
          </label>
        </div>

        <AttendanceTable
          ref="tableRef"
          :records="paginatedRecords"
          @view="viewRecord"
          @delete="handleDelete"
        />
      </div>

      <!-- Add Attendance Tab -->
      <input type="radio" name="my_tabs_2" class="tab" aria-label="Add Attendance" />
      <div class="tab-content bg-white p-10 min-h-[600px]">
        <AttendanceForm
          :departments="departments"
          @showConfirm="handleFormSubmit"
          @submit="handleAttendanceSubmit"
        />
      </div>
    </div>

    <!-- View Modal -->
    <dialog :open="modalState.view" class="modal">
      <div class="modal-box bg-white text-black">
        <h3 class="font-bold text-lg">Attendance Details</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        />

        <div v-if="modalState.selectedRecord">
          <template
            v-for="(value, key) in {
              Employee: modalState.selectedRecord.full_name,
              Date: formatDate(modalState.selectedRecord.date),
              'Sign In': modalState.selectedRecord.signIn,
              'Sign Out': modalState.selectedRecord.signOut,
              Department: modalState.selectedRecord.department,
              Status: modalState.selectedRecord.status,
              'Working Hours': modalState.selectedRecord.workingHours,
            }"
            :key="key"
          >
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">{{ key }}</div>
              <div>{{ value }}</div>
            </div>
          </template>
        </div>

        <div class="modal-action">
          <button class="btn-secondaryStyle" @click="modalState.view = false">Close</button>
        </div>
      </div>
    </dialog>

    <!-- Delete Modal -->
    <dialog :open="modalState.delete" class="modal">
      <div class="modal-box bg-white text-black">
        <h3 class="font-bold text-lg">Confirm Delete</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        />

        <div class="py-4">
          <p class="mb-4">Are you sure you want to delete this attendance record?</p>

          <!-- Show record details -->
          <div v-if="modalState.selectedRecord" class="bg-gray-50 p-4 rounded-md">
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div class="text-gray-500">Employee:</div>
              <div>{{ modalState.selectedRecord.full_name }}</div>

              <div class="text-gray-500">Date:</div>
              <div>{{ formatDate(modalState.selectedRecord.date) }}</div>

              <div class="text-gray-500">Department:</div>
              <div>{{ modalState.selectedRecord.department }}</div>

              <div class="text-gray-500">Status:</div>
              <div>{{ modalState.selectedRecord.status }}</div>
            </div>
          </div>
        </div>

        <div class="modal-action">
          <button class="btn-errorStyle" @click="confirmDelete">Delete</button>
          <button class="btn-secondaryStyle" @click="modalState.delete = false">Cancel</button>
        </div>
      </div>
    </dialog>

    <!-- Add Confirmation Modal -->
    <dialog :open="modalState.confirm" class="modal">
      <div class="modal-box bg-white text-black">
        <h3 class="font-bold text-lg">Confirm Attendance</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        />

        <div v-if="modalState.selectedRecord" class="pt-4 flex flex-col gap-2">
          <div class="flex flex-row">
            <div class="w-40 text-gray-500">Employee</div>
            <div>{{ modalState.selectedRecord.full_name }}</div>
          </div>
          <div class="flex flex-row">
            <div class="w-40 text-gray-500">Department</div>
            <div>{{ modalState.selectedRecord.department }}</div>
          </div>
          <div class="flex flex-row">
            <div class="w-40 text-gray-500">Date</div>
            <div>{{ modalState.selectedRecord.date }}</div>
          </div>
          <div class="flex flex-row">
            <div class="w-40 text-gray-500">Time In</div>
            <div>{{ modalState.selectedRecord.signIn || modalState.selectedRecord.time_in }}</div>
          </div>
          <div class="flex flex-row">
            <div class="w-40 text-gray-500">Time Out</div>
            <div>{{ modalState.selectedRecord.signOut || modalState.selectedRecord.time_out }}</div>
          </div>
          <div class="flex flex-row">
            <div class="w-40 text-gray-500">Working Hours</div>
            <div>
              {{ calculateWorkingHours(modalState.selectedRecord) }}
            </div>
          </div>
        </div>

        <div class="modal-action">
          <button
            @click="handleAttendanceSubmit(modalState.selectedRecord)"
            class="btn-primaryStyle"
          >
            Confirm
          </button>
          <button class="btn-secondaryStyle" @click="modalState.confirm = false">Cancel</button>
        </div>
      </div>
    </dialog>
  </div>
</template>

<style scoped>
/* Add these styles */
.btn-primaryStyle:disabled,
.btn-errorStyle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ... rest of your existing styles ... */
</style>
