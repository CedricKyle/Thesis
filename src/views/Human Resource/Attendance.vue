<script setup>
import { ref, computed } from 'vue'
import { Eye, X, Search, ArrowUpDown } from 'lucide-vue-next'
import { useAttendanceStore } from '@/composables/Admin Composables/Human Resource/useAttendanceStore'

// Initialize refs
const currentPage = ref(1)
const itemsPerPage = 8
const searchQuery = ref('')
const sortBy = ref('id')
const sortDesc = ref(false)
const showConfirmModal = ref(false)
const showViewModal = ref(false)
const showDeleteModal = ref(false)
const selectedRecord = ref(null)

// Form data
const newAttendance = ref({
  employeeName: '',
  signIn: '',
  signOut: '',
  date: '',
  department: '',
})

// Form validation errors
const formErrors = ref({})

const attendanceStore = useAttendanceStore()

// Replace local attendanceRecords with store's
const { attendanceRecords } = attendanceStore

// Departments list
const departments = ['IT', 'HR', 'Sales', 'Marketing', 'Finance']

// Format date
const formatDate = (date) => {
  const d = new Date(date)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const year = d.getFullYear()
  return `${month}-${day}-${year}`
}

// Calculate working hours
const calculateHours = (signIn, signOut) => {
  const [signInHours, signInMinutes] = signIn.split(':')
  const [signOutHours, signOutMinutes] = signOut.split(':')

  const startTime = new Date(2024, 0, 1, signInHours, signInMinutes)
  const endTime = new Date(2024, 0, 1, signOutHours, signOutMinutes)

  // Standard work day end time (5:00 PM)
  const standardEndTime = new Date(2024, 0, 1, 17, 0)

  // If signed out after 5 PM, count only until 5 PM
  const actualEndTime = endTime > standardEndTime ? standardEndTime : endTime

  const diffInHours = (actualEndTime - startTime) / (1000 * 60 * 60)
  return `${Math.max(0, Math.round(diffInHours * 10) / 10)} hours`
}

// Determine status based on sign-in time
const determineStatus = (signIn) => {
  const [hours, minutes] = signIn.split(':')
  const timeInHours = parseInt(hours)
  const timeInMinutes = parseInt(minutes)

  // Convert to minutes since midnight for easier comparison
  const signInTimeInMinutes = timeInHours * 60 + timeInMinutes
  const workStartInMinutes = 8 * 60 // 8:00 AM
  const graceEndInMinutes = 8 * 60 + 15 // 8:15 AM
  const absentThresholdInMinutes = 12 * 60 // 12:00 PM

  // Before 8:00 AM or exactly at 8:00 AM
  if (signInTimeInMinutes <= workStartInMinutes) {
    return 'Present'
  }

  // Within grace period (8:01 AM - 8:15 AM)
  if (signInTimeInMinutes <= graceEndInMinutes) {
    return 'Present'
  }

  // After 12:00 PM (considered as Absent)
  if (signInTimeInMinutes >= absentThresholdInMinutes) {
    return 'Absent'
  }

  // Between 8:16 AM and 11:59 AM
  return 'Late'
}

// Form validation
const validateForm = () => {
  formErrors.value = {}
  let isValid = true

  if (!newAttendance.value.employeeName?.trim()) {
    formErrors.value.employeeName = 'Employee name is required'
    isValid = false
  }

  if (!newAttendance.value.date) {
    formErrors.value.date = 'Date is required'
    isValid = false
  }

  if (!newAttendance.value.signIn) {
    formErrors.value.signIn = 'Sign in time is required'
    isValid = false
  }

  if (!newAttendance.value.signOut) {
    formErrors.value.signOut = 'Sign out time is required'
    isValid = false
  }

  if (!newAttendance.value.department) {
    formErrors.value.department = 'Department is required'
    isValid = false
  }

  // Validate sign out time is after sign in time
  if (newAttendance.value.signIn && newAttendance.value.signOut) {
    const [inHours, inMinutes] = newAttendance.value.signIn.split(':')
    const [outHours, outMinutes] = newAttendance.value.signOut.split(':')

    if (
      parseInt(outHours) < parseInt(inHours) ||
      (parseInt(outHours) === parseInt(inHours) && parseInt(outMinutes) <= parseInt(inMinutes))
    ) {
      formErrors.value.signOut = 'Sign out time must be after sign in time'
      isValid = false
    }
  }

  return isValid
}

// Handle form submission
const handleSubmit = () => {
  if (validateForm()) {
    showConfirmModal.value = true
  }
}

// Update confirmAndSave to use store's attendanceRecords
const confirmAndSave = () => {
  const workingHours = calculateHours(newAttendance.value.signIn, newAttendance.value.signOut)
  const status = determineStatus(newAttendance.value.signIn)

  // Add new record to store
  attendanceRecords.value.push({
    id: attendanceRecords.value.length + 1,
    name: newAttendance.value.employeeName,
    date: new Date(newAttendance.value.date),
    signIn: newAttendance.value.signIn,
    signOut: newAttendance.value.signOut,
    workingHours,
    department: newAttendance.value.department,
    status, // This will be 'Present', 'Late', or 'Absent'
  })

  // Reset form and close modal
  newAttendance.value = {
    employeeName: '',
    signIn: '',
    signOut: '',
    date: '',
    department: '',
  }
  formErrors.value = {}
  showConfirmModal.value = false
}

// Filtered and sorted records
const filteredRecords = computed(() => {
  let records = [...attendanceRecords.value]

  if (searchQuery.value) {
    records = records.filter(
      (record) =>
        record.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        record.department.toLowerCase().includes(searchQuery.value.toLowerCase()),
    )
  }

  records.sort((a, b) => {
    let comparison = 0
    if (a[sortBy.value] < b[sortBy.value]) comparison = -1
    if (a[sortBy.value] > b[sortBy.value]) comparison = 1
    return sortDesc.value ? -comparison : comparison
  })

  return records
})

// Paginated records
const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredRecords.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(filteredRecords.value.length / itemsPerPage))

// View and delete handlers
const viewRecord = (record) => {
  selectedRecord.value = record
  showViewModal.value = true
}

const deleteRecord = (record) => {
  selectedRecord.value = record
  showDeleteModal.value = true
}

const confirmDelete = () => {
  attendanceRecords.value = attendanceRecords.value.filter(
    (record) => record.id !== selectedRecord.value.id,
  )
  showDeleteModal.value = false
  selectedRecord.value = null
}
</script>

<template>
  <!-- name of each tab group should be unique -->
  <div class="tabs tabs-border bg-primaryColor border border-gray-200/50 max-h-[800px]">
    <!-- Attendance -->
    <input type="radio" name="my_tabs_2" class="tab" aria-label="Attendance" checked="checked" />
    <div class="tab-content bg-bgColor p-10 min-h-[600px]">
      <!-- Search and Filter Section -->
      <div class="flex justify-between mb-4">
        <label class="input">
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
            v-model="searchQuery"
            type="search"
            required
            placeholder="Search"
            class="focus:outline-none"
          />
        </label>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto border shadow-lg">
        <table class="table text-black">
          <thead class="bg-primaryColor text-white">
            <tr>
              <th @click="toggleSort('id')" class="cursor-pointer">
                Id <ArrowUpDown class="inline h-4 w-4" />
              </th>
              <th @click="toggleSort('name')" class="cursor-pointer">
                Name <ArrowUpDown class="inline h-4 w-4" />
              </th>
              <th>Date</th>
              <th>Sign In</th>
              <th>Sign Out</th>
              <th>Working Hours</th>
              <th>Department</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="record in paginatedRecords"
              :key="record.id"
              class="hover:bg-gray-200/30 hover:text-black border-b border-gray-200/50"
            >
              <td>{{ record.id }}</td>
              <td>{{ record.name }}</td>
              <td>{{ formatDate(record.date) }}</td>
              <td>{{ record.signIn }}</td>
              <td>{{ record.signOut }}</td>
              <td>{{ record.workingHours }}</td>
              <td>{{ record.department }}</td>
              <td>
                <span
                  class="badge"
                  :class="{
                    'badge-success': record.status === 'Present',
                    'badge-warning': record.status === 'Late',
                    'badge-error': record.status === 'Absent',
                  }"
                >
                  {{ record.status }}
                </span>
              </td>
              <td>
                <div class="flex gap-2">
                  <button @click="viewRecord(record)" class="btn btn-sm btn-circle btn-ghost">
                    <Eye class="h-4 w-4" />
                  </button>
                  <button
                    @click="deleteRecord(record)"
                    class="btn btn-sm btn-circle btn-error btn-ghost"
                  >
                    <X class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Daisy UI Pagination -->
        <div class="flex justify-center py-4 bg-white">
          <div class="join">
            <!-- Previous button -->
            <button
              class="join-item btn btn-xs"
              :class="{ 'btn-disabled': currentPage === 1 }"
              @click="currentPage > 1 && currentPage--"
            >
              «
            </button>

            <!-- Page numbers -->
            <template v-for="page in totalPages" :key="page">
              <button
                class="join-item btn btn-xs"
                :class="{ 'btn-active': currentPage === page }"
                @click="currentPage = page"
              >
                {{ page }}
              </button>
            </template>

            <!-- Next button -->
            <button
              class="join-item btn btn-xs"
              :class="{ 'btn-disabled': currentPage === totalPages }"
              @click="currentPage < totalPages && currentPage++"
            >
              »
            </button>
          </div>
        </div>
      </div>

      <!-- View/Edit Modal -->
      <dialog :open="showViewModal" class="modal">
        <div class="modal-box">
          <h3 class="font-bold text-lg">Attendance Details</h3>
          <div v-if="selectedRecord" class="py-4">
            <p>Employee: {{ selectedRecord.name }}</p>
            <p>Date: {{ formatDate(selectedRecord.date) }}</p>
            <p>Sign In: {{ selectedRecord.signIn }}</p>
            <p>Sign Out: {{ selectedRecord.signOut }}</p>
            <p>Department: {{ selectedRecord.department }}</p>
            <p>Status: {{ selectedRecord.status }}</p>
          </div>
          <div class="modal-action">
            <button class="btn" @click="showViewModal = false">Close</button>
          </div>
        </div>
      </dialog>

      <!-- Delete Confirmation Modal -->
      <dialog :open="showDeleteModal" class="modal">
        <div class="modal-box">
          <h3 class="font-bold text-lg">Confirm Delete</h3>
          <p class="py-4">Are you sure you want to delete this record?</p>
          <div class="modal-action">
            <button class="btn btn-error" @click="confirmDelete">Delete</button>
            <button class="btn" @click="showDeleteModal = false">Cancel</button>
          </div>
        </div>
      </dialog>
    </div>

    <!-- Add Attendance -->
    <input type="radio" name="my_tabs_2" class="tab" aria-label="Add Attendance" />
    <div class="tab-content bg-bgColor p-10 min-h-[600px]">
      <div class="form-container flex justify-center items-center">
        <div
          class="form-group flex flex-col w-1/3 bg-white h-[550px] p-6 justify-between shadow-lg border border-gray-200/50"
        >
          <div class="title">
            <h1 class="text-black text-2xl">Add Attendance</h1>
          </div>
          <div class="form-group">
            <fieldset class="fieldset">
              <div class="form-control">
                <legend class="fieldset-legend text-black">Employee name</legend>
                <input
                  v-model="newAttendance.employeeName"
                  type="text"
                  class="input focus:outline-none bg-white border text-black"
                  :class="{
                    'border-red-500': formErrors.employeeName,
                    'border-gray-200': !formErrors.employeeName,
                  }"
                  placeholder="Enter employee name"
                />
                <span v-if="formErrors.employeeName" class="text-red-500 text-sm mt-1">
                  {{ formErrors.employeeName }}
                </span>
              </div>

              <div class="form-control mt-4">
                <legend class="fieldset-legend text-black">Sign In</legend>
                <input
                  v-model="newAttendance.signIn"
                  type="time"
                  class="input focus:outline-none bg-white border text-black"
                  :class="{
                    'border-red-500': formErrors.signIn,
                    'border-gray-200': !formErrors.signIn,
                  }"
                />
                <span v-if="formErrors.signIn" class="text-red-500 text-sm mt-1">
                  {{ formErrors.signIn }}
                </span>
              </div>

              <div class="form-control mt-4">
                <legend class="fieldset-legend text-black">Sign Out</legend>
                <input
                  v-model="newAttendance.signOut"
                  type="time"
                  class="input focus:outline-none bg-white border text-black"
                  :class="{
                    'border-red-500': formErrors.signOut,
                    'border-gray-200': !formErrors.signOut,
                  }"
                />
                <span v-if="formErrors.signOut" class="text-red-500 text-sm mt-1">
                  {{ formErrors.signOut }}
                </span>
              </div>

              <div class="form-control mt-4">
                <legend class="fieldset-legend text-black">Date</legend>
                <input
                  v-model="newAttendance.date"
                  type="date"
                  class="input focus:outline-none bg-white border text-black"
                  :class="{
                    'border-red-500': formErrors.date,
                    'border-gray-200': !formErrors.date,
                  }"
                />
                <span v-if="formErrors.date" class="text-red-500 text-sm mt-1">
                  {{ formErrors.date }}
                </span>
              </div>

              <div class="form-control mt-4">
                <legend class="fieldset-legend text-black">Department</legend>
                <select
                  v-model="newAttendance.department"
                  class="select focus:outline-none bg-white border text-black"
                  :class="{
                    'border-red-500': formErrors.department,
                    'border-gray-200': !formErrors.department,
                  }"
                >
                  <option value="" disabled selected>Select Department</option>
                  <option v-for="dept in departments" :key="dept" :value="dept">
                    {{ dept }}
                  </option>
                </select>
                <span v-if="formErrors.department" class="text-red-500 text-sm mt-1">
                  {{ formErrors.department }}
                </span>
              </div>
            </fieldset>
          </div>
          <div class="action-buttons flex justify-end">
            <button
              @click="handleSubmit"
              class="btn bg-primaryColor text-white border-none hover:bg-primaryColor/80"
            >
              Add Attendance
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- On Leave Request -->
    <input type="radio" name="my_tabs_2" class="tab" aria-label="On Leave Request" />
    <div class="tab-content bg-white p-10 min-h-[600px]">Tab content 3</div>

    <!-- Confirmation Modal -->
    <dialog :open="showConfirmModal" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Confirm Attendance</h3>
        <div class="py-4">
          <p class="mb-2">Please confirm the following attendance details:</p>
          <div class="text-sm space-y-1">
            <p>
              <span class="font-semibold">Employee:</span> {{ newAttendance?.employeeName || '-' }}
            </p>
            <p><span class="font-semibold">Date:</span> {{ newAttendance?.date || '-' }}</p>
            <p><span class="font-semibold">Sign In:</span> {{ newAttendance?.signIn || '-' }}</p>
            <p><span class="font-semibold">Sign Out:</span> {{ newAttendance?.signOut || '-' }}</p>
            <p>
              <span class="font-semibold">Department:</span> {{ newAttendance?.department || '-' }}
            </p>
          </div>
        </div>
        <div class="modal-action">
          <button @click="confirmAndSave" class="btn btn-primary">Confirm</button>
          <button @click="showConfirmModal = false" class="btn">Cancel</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>

<style scoped>
input[type='date']::-webkit-calendar-picker-indicator,
input[type='time']::-webkit-calendar-picker-indicator {
  filter: invert(0%) brightness(0%);
  cursor: pointer;
}
</style>
