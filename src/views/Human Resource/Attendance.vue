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

// Store initialization
const attendanceStore = useAttendanceStore()
const employeeStore = useEmployeeStore()
const { attendanceRecords } = storeToRefs(attendanceStore)
const { employees } = storeToRefs(employeeStore)
const { addRecord, deleteRecord, loadRecords } = attendanceStore

// Form and logic setup
const { newAttendance, departments, resetForm } = useAttendanceForm(attendanceRecords)
const { formatDate } = useAttendanceLogic()

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
  newAttendance.value = formData
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

const handleDelete = (record) => {
  modalState.value.selectedRecord = record
  modalState.value.delete = true
}

const confirmDelete = async () => {
  try {
    await deleteRecord(modalState.value.selectedRecord.id)
    modalState.value.delete = false
    modalState.value.selectedRecord = null
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
  if (!attendanceRecords.value || !employees.value) return []

  const dateRecords = new Map(
    attendanceRecords.value
      .filter(record => {
        const recordDate = new Date(record.date).toISOString().split('T')[0]
        return recordDate === state.value.selectedDate
      })
      .map(record => [record.employeeId, record])
  )

  let records = employees.value.map(employee => (
    dateRecords.get(employee.id) || {
      id: `absent-${employee.id}`,
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
  ))

  if (state.value.searchQuery) {
    const query = state.value.searchQuery.toLowerCase()
    records = records.filter(record =>
      record.name.toLowerCase().includes(query) ||
      record.department.toLowerCase().includes(query)
    )
  }

  const sortField = state.value.sortBy
  const sortMultiplier = state.value.sortDesc ? -1 : 1

  return records.sort((a, b) => {
    const compareValue = (sortField === 'name' || sortField === 'department') 
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
  Math.ceil(filteredRecords.value.length / state.value.itemsPerPage)
)
</script>

<template>
  <div class="attendance-container">
    <Toast v-bind="state.toast" />

    <div class="tabs tabs-border bg-primaryColor border border-gray-200/50 shadow-md">
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
              <g stroke-linejoin="round" stroke-linecap="round" stroke-width="2.5" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </g>
            </svg>
            <input
              v-model="state.searchQuery"
              type="search"
              required
              placeholder="Search"
            />
          </label>
        </div>

        <AttendanceTable
          :records="paginatedRecords"
          :sort-by="state.sortBy"
          :sort-desc="state.sortDesc"
          @sort="handleSort"
          @view="viewRecord"
          @delete="handleDelete"
        />
      </div>

      <!-- Add Attendance Tab -->
      <input type="radio" name="my_tabs_2" class="tab" aria-label="Add Attendance" />
      <div class="tab-content bg-white p-10 min-h-[600px]">
        <AttendanceForm :departments="departments" @show-confirm="handleFormSubmit" />
      </div>
    </div>

    <!-- View Modal -->
    <dialog :open="modalState.view" class="modal">
      <div class="modal-box bg-white text-black">
        <h3 class="font-bold text-lg">Attendance Details</h3>
        <div class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]" />
        
        <div v-if="modalState.selectedRecord" class="pt-4 flex flex-col gap-2 text-sm">
          <template v-for="(value, key) in {
            Employee: modalState.selectedRecord.name,
            Date: formatDate(modalState.selectedRecord.date),
            'Sign In': modalState.selectedRecord.signIn,
            'Sign Out': modalState.selectedRecord.signOut,
            Department: modalState.selectedRecord.department,
            Status: modalState.selectedRecord.status
          }" :key="key">
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
        <p class="py-4">Are you sure you want to delete this record?</p>
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
        <div class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]" />
        
        <div class="pt-4 flex flex-col gap-2">
          <template v-for="(key, index) in ['employeeName', 'department', 'date', 'signIn', 'signOut']" :key="index">
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">{{ key.charAt(0).toUpperCase() + key.slice(1) }}</div>
              <div>{{ newAttendance?.[key] || '-' }}</div>
            </div>
          </template>
        </div>
        
        <div class="modal-action">
          <button @click="confirmAndSave" class="btn-primaryStyle">Confirm</button>
          <button class="btn-secondaryStyle" @click="modalState.confirm = false">Cancel</button>
        </div>
      </div>
    </dialog>
  </div>
</template>