<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAttendanceStore } from '@/stores/HR Management/attendanceStore'
import { useAttendanceForm } from '@/composables/Admin Composables/Human Resource/useAttendanceForm'
import { useAttendanceLogic } from '@/composables/Admin Composables/Human Resource/useAttendanceLogic'
import AttendanceTable from '@/components/Admin Components/HR/AttendanceTable.vue'
import Pagination from '@/components/Admin Components/HR/Pagination.vue'
import Toast from '@/components/Admin Components/HR/Toast.vue'
import AttendanceForm from '@/components/Admin Components/HR/AttendanceForm.vue'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'

// Store setup
const attendanceStore = useAttendanceStore()
const { attendanceRecords } = storeToRefs(attendanceStore)
const { addRecord, deleteRecord, loadRecords } = attendanceStore
const error = ref('')

// Form and logic setup
const { newAttendance, formErrors, departments, validateForm, resetForm } =
  useAttendanceForm(attendanceRecords)

const { formatDate, calculateHours, determineStatus } = useAttendanceLogic()

// State management
const state = ref({
  currentPage: 1,
  itemsPerPage: 8,
  searchQuery: '',
  sortBy: 'id',
  sortDesc: false,
  showConfirmModal: false,
  showViewModal: false,
  showDeleteModal: false,
  selectedRecord: null,
  selectedDate: new Date().toISOString().split('T')[0],
  toast: {
    show: false,
    message: '',
    type: 'success',
  },
})

// Employee store setup
const employeeStore = useEmployeeStore()
const { employees } = storeToRefs(employeeStore)

// Load records when component mounts
onMounted(() => {
  loadRecords()
  employeeStore.loadEmployees()
  console.log('Available employees:', employees.value)
})

// Toast handlers
const showToast = (message, type = 'success') => {
  state.value.toast = {
    show: true,
    message,
    type,
  }
  setTimeout(() => {
    state.value.toast.show = false
  }, 3000)
}

// Form submission handler
const handleFormSubmit = (formData) => {
  console.log('Form data received:', formData)
  console.log('Employee name from form:', formData.employeeName)
  // Store the form data
  newAttendance.value = formData
  console.log('newAttendance after assignment:', newAttendance.value)
  // Show confirmation modal
  state.value.showConfirmModal = true
}

// Update confirmAndSave
const confirmAndSave = async () => {
  try {
    console.log('New Attendance Data:', newAttendance.value)

    const attendanceData = {
      name: newAttendance.value.employeeName,
      employeeId: newAttendance.value.employeeId,
      department: newAttendance.value.department,
      date: newAttendance.value.date,
      signIn: newAttendance.value.signIn,
      signOut: newAttendance.value.signOut,
    }

    console.log('Sending attendance data:', attendanceData)

    await addRecord(attendanceData)

    // Reset form and close modal
    resetForm()
    state.value.showConfirmModal = false
    showToast('Attendance added successfully')

    // Reset the form in AttendanceForm component
    if (newAttendance.value) {
      newAttendance.value = {
        employeeName: '',
        employeeId: '',
        department: '',
        date: '',
        signIn: '',
        signOut: '',
      }
    }
  } catch (error) {
    console.error('Error adding attendance:', error)
    showToast(error.message || 'Failed to add attendance', 'error')
  }
}

// Record actions
const viewRecord = (record) => {
  state.value.selectedRecord = record
  state.value.showViewModal = true
}

const handleDelete = (record) => {
  state.value.selectedRecord = record
  state.value.showDeleteModal = true
}

const confirmDelete = async () => {
  try {
    await deleteRecord(state.value.selectedRecord.id)
    state.value.showDeleteModal = false
    state.value.selectedRecord = null
    showToast('Record deleted successfully')
  } catch (error) {
    showToast('Failed to delete record', 'error')
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
  // Get all employees
  const allEmployees = employees.value || []

  // Get existing attendance records for the selected date
  let existingRecords = attendanceRecords.value.filter((record) => {
    const recordDate = new Date(record.date).toISOString().split('T')[0]
    return recordDate === state.value.selectedDate
  })

  // Create a map of employees who already have attendance records
  const attendanceMap = new Map(existingRecords.map((record) => [record.employeeId, record]))

  // Create records for all employees, including those without attendance
  const allRecords = allEmployees.map((employee) => {
    const existingRecord = attendanceMap.get(employee.id)

    if (existingRecord) {
      return existingRecord
    } else {
      // Create an "absent" record for employees without attendance
      return {
        id: `absent-${employee.id}`, // Temporary ID for display purposes
        employeeId: employee.id,
        name: employee.fullName,
        department: employee.department,
        date: new Date(state.value.selectedDate),
        signIn: '-',
        signOut: '-',
        workingHours: '-',
        status: 'Absent',
        createdAt: new Date(),
      }
    }
  })

  // Apply search filter if exists
  if (state.value.searchQuery) {
    const query = state.value.searchQuery.toLowerCase()
    return allRecords.filter(
      (record) =>
        record.name.toLowerCase().includes(query) ||
        record.department.toLowerCase().includes(query),
    )
  }

  // Sort records
  return allRecords.sort((a, b) => {
    const comparison =
      state.value.sortBy === 'id' ? a.employeeId - b.employeeId : a.name.localeCompare(b.name)
    return state.value.sortDesc ? -comparison : comparison
  })
})

const paginatedRecords = computed(() => {
  const start = (state.value.currentPage - 1) * state.value.itemsPerPage
  const end = start + state.value.itemsPerPage
  return filteredRecords.value.slice(start, end)
})

const totalPages = computed(() =>
  Math.ceil(filteredRecords.value.length / state.value.itemsPerPage),
)

const stats = computed(() => {
  const records = filteredRecords.value
  return {
    present: records.filter((r) => r.status === 'Present').length,
    late: records.filter((r) => r.status === 'Late').length,
    absent: records.filter((r) => r.status === 'Absent').length,
    onLeave: records.filter((r) => r.status === 'On Leave').length,
  }
})

console.log(filteredRecords.value)
</script>

<template>
  <div class="attendance-container">
    <Toast :show="state.toast.show" :message="state.toast.message" :type="state.toast.type" />

    <!-- Tabs container with proper classes -->
    <div class="tabs tabs-border bg-primaryColor border border-gray-200/50 max-h-[800px] shadow-md">
      <!-- Attendance List Tab -->
      <input
        type="radio"
        name="my_tabs_2"
        class="tab"
        aria-label="Attendance List"
        checked="checked"
      />
      <div class="tab-content bg-white p-2 min-h-[600px]">
        <!-- Add this new date filter section -->
        <div class="flex justify-between items-center gap-4 mb-4">
          <div class="flex items-center gap-2">
            <input
              type="date"
              v-model="state.selectedDate"
              class="input input-bordered input-sm w-auto !outline-none hover:shadow-md bg-white text-black border-primaryColor"
            />
          </div>

          <!-- Move existing search here -->
          <label class="input-search">
            <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <g
                stroke-linejoin="round"
                stroke-linecap="round"
                stroke-width="2.5"
                fill="none"
                stroke="currentColor"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
              </g>
            </svg>
            <input
              v-model="state.searchQuery"
              type="search"
              required
              placeholder="Search"
              class=""
            />
          </label>
        </div>

        <!-- Table and Pagination -->
        <AttendanceTable
          :records="paginatedRecords"
          :sort-by="state.sortBy"
          :sort-desc="state.sortDesc"
          @sort="handleSort"
          @view="viewRecord"
          @delete="handleDelete"
        />

        <Pagination
          :current-page="state.currentPage"
          :total-pages="totalPages"
          @page-change="(page) => (state.currentPage = page)"
        />
      </div>

      <!-- Add Attendance Tab -->
      <input type="radio" name="my_tabs_2" class="tab" aria-label="Add Attendance" />
      <div class="tab-content bg-white p-10 min-h-[600px]">
        <AttendanceForm :departments="departments" @show-confirm="handleFormSubmit" />
      </div>
    </div>

    <!-- Modals -->
    <dialog :open="state.showViewModal" class="modal">
      <!-- View Modal Content -->
      <div class="modal-box bg-white text-black">
        <h3 class="font-bold text-lg">Attendance Details</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>
        <div v-if="state.selectedRecord" class="pt-4 flex flex-col gap-2">
          <!-- Record Details -->
          <div class="flex flex-row">
            <div class="w-40 text-gray-500">Employee</div>
            <div class="">{{ state.selectedRecord.name }}</div>
          </div>
          <div class="flex flex-row">
            <div class="w-40 text-gray-500">Date</div>
            <div class="">{{ formatDate(state.selectedRecord.date) }}</div>
          </div>
          <div class="flex flex-row">
            <div class="w-40 text-gray-500">Sign In</div>
            <div class="">{{ state.selectedRecord.signIn }}</div>
          </div>
          <div class="flex flex-row">
            <div class="w-40 text-gray-500">Sign Out</div>
            <div class="">{{ state.selectedRecord.signOut }}</div>
          </div>
          <div class="flex flex-row">
            <div class="w-40 text-gray-500">Department</div>
            <div class="">{{ state.selectedRecord.department }}</div>
          </div>
          <div class="flex flex-row">
            <div class="w-40 text-gray-500">Status</div>
            <div class="">{{ state.selectedRecord.status }}</div>
          </div>
        </div>
        <div class="modal-action">
          <button
            class="btn btn-sm bg-gray-200 text-gray-600 border-none shadow-none"
            @click="state.showViewModal = false"
          >
            Close
          </button>
        </div>
      </div>
    </dialog>

    <!-- Delete Modal -->
    <dialog :open="state.showDeleteModal" class="modal">
      <div class="modal-box bg-white text-black">
        <h3 class="font-bold text-lg">Confirm Delete</h3>
        <p class="py-4">Are you sure you want to delete this record?</p>
        <div class="modal-action">
          <button class="btn btn-error btn-sm" @click="confirmDelete">Delete</button>
          <button
            class="btn btn-sm bg-gray-200 text-gray-600 border-none shadow-none"
            @click="state.showDeleteModal = false"
          >
            Cancel
          </button>
        </div>
      </div>
    </dialog>

    <!-- Add Confirmation Modal -->
    <dialog :open="state.showConfirmModal" class="modal">
      <div class="modal-box bg-white text-black">
        <h3 class="font-bold text-lg">Confirm Attendance</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>
        <div class="pt-4 flex flex-col gap-2">
          <div class="flex flex-row">
            <div class="w-40 text-gray-500">Employee</div>
            <div class="">{{ newAttendance?.employeeName || '-' }}</div>
          </div>
          <div class="flex flex-row">
            <div class="w-40 text-gray-500">Department</div>
            <div class="">{{ newAttendance?.department || '-' }}</div>
          </div>
          <div class="flex flex-row">
            <div class="w-40 text-gray-500">Date</div>
            <div class="">{{ newAttendance?.date || '-' }}</div>
          </div>
          <div class="flex flex-row">
            <div class="w-40 text-gray-500">Sign In</div>
            <div class="">{{ newAttendance?.signIn || '-' }}</div>
          </div>
          <div class="flex flex-row">
            <div class="w-40 text-gray-500">Sign Out</div>
            <div class="">{{ newAttendance?.signOut || '-' }}</div>
          </div>
        </div>
        <div class="modal-action">
          <button
            @click="confirmAndSave"
            class="btn bg-primaryColor border-none shadow-none text-white"
          >
            Confirm
          </button>
          <button
            class="btn bg-gray-200 text-gray-600 border-none shadow-none"
            @click="state.showConfirmModal = false"
          >
            Cancel
          </button>
        </div>
      </div>
    </dialog>

    <!-- Show error if exists -->
    <div v-if="error" class="alert alert-error">
      {{ error }}
    </div>
  </div>
</template>

<style scoped>
input[type='date']::-webkit-calendar-picker-indicator,
input[type='time']::-webkit-calendar-picker-indicator {
  filter: invert(0%) brightness(0%);
  cursor: pointer;
}

.rotate-180 {
  transform: rotate(180deg);
}
</style>
