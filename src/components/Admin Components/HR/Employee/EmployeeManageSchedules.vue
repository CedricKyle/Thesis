<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAvailableScheduleStore } from '@/stores/HR Management/availableScheduleStore'
import { useEmployeeScheduleStore } from '@/stores/HR Management/employeeScheduleStore'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'
import { storeToRefs } from 'pinia'
import BaseTable from '@/components/common/BaseTable.vue'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.min.css'
import { DEPARTMENTS } from '@/composables/Admin Composables/User & Role/role/permissionsId'
import Toast from '@/components/Admin Components/HR/Toast.vue'
import { useEmployeeSchedulePDFGenerator } from '@/composables/Admin Composables/Human Resource/useEmployeeSchedulePDFGenerator'

// Stores
const scheduleStore = useAvailableScheduleStore()
const employeeScheduleStore = useEmployeeScheduleStore()
const employeeStore = useEmployeeStore()
const { employees } = storeToRefs(employeeStore)

// Get available schedules from store
const availableSchedules = computed(() => scheduleStore.schedules)

// Add this computed property for departments
const departments = computed(() => [
  DEPARTMENTS.HR,
  DEPARTMENTS.FINANCE,
  DEPARTMENTS.SALES,
  DEPARTMENTS.CRM,
  DEPARTMENTS.SCM,
])

// Update the schedules ref to use store data
const employeeSchedules = computed(() => employeeScheduleStore.employeeSchedules)

// Add state for archived view
const showArchived = ref(false)

// Add computed property for filtered schedules
const filteredSchedules = computed(() => {
  return employeeSchedules.value.filter((schedule) => {
    if (showArchived.value) {
      return schedule.deleted_at !== null
    } else {
      return schedule.deleted_at === null
    }
  })
})

// Table columns
const columns = [
  { title: 'Employee Name', field: 'employeeName', sorter: 'string' },
  { title: 'Type', field: 'type', sorter: 'string' },
  { title: 'Department', field: 'department', sorter: 'string' },
  { title: 'Start Time', field: 'timeIn', sorter: 'string', hozAlign: 'center' },
  { title: 'End Time', field: 'timeOut', sorter: 'string', hozAlign: 'center' },
  {
    title: 'Work Days',
    field: 'day',
    sorter: 'string',
    hozAlign: 'center',
    formatter: (cell) => {
      const value = cell.getValue()
      return value || 'N/A'
    },
  },
  {
    title: 'Day Off',
    field: 'dayOff',
    sorter: 'string',
    hozAlign: 'center',
    formatter: (cell) => {
      const value = cell.getValue()
      return value || 'N/A'
    },
  },
  {
    title: 'Remarks',
    field: 'remarks',
    sorter: 'string',
    formatter: (cell) => {
      const value = cell.getValue()
      return value || 'N/A'
    },
  },
  {
    title: 'Actions',
    field: 'actions',
    formatter: (cell) => {
      const record = cell.getRow().getData()
      const isArchived = !!record.deleted_at

      return `
        <div class="flex gap-2">
          <button class="btn btn-sm btn-circle hover:bg-primaryColor/80 border-none btn-ghost view-button" title="View">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
          ${
            !isArchived
              ? `
            <button class="btn btn-sm btn-circle hover:bg-primaryColor/80 border-none btn-ghost edit-button" title="Edit">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button class="btn btn-sm btn-circle hover:bg-red-400 border-none btn-ghost delete-button" title="Delete">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          `
              : `
            <button class="btn btn-sm btn-circle hover:bg-green-400 border-none btn-ghost restore-button" title="Restore">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
            </button>
          `
          }
        </div>
      `
    },
    cellClick: (e, cell) => {
      const record = cell.getRow().getData()
      const isArchived = !!record.deleted_at
      if (e.target.closest('.view-button')) {
        openViewModal(record)
      } else if (e.target.closest('.edit-button')) {
        openEditModal(record)
      } else if (e.target.closest('.delete-button')) {
        openDeleteModal(record)
      } else if (e.target.closest('.restore-button')) {
        openRestoreModal(record)
      }
    },
    headerSort: false,
    hozAlign: 'center',
    width: 150,
  },
]

// Modal logic
const createModal = ref(null)
const viewModal = ref(null)
const newSchedule = ref({
  employeeName: '',
  department: '',
  type: '',
  timeIn: '',
  timeOut: '',
  day: '',
  dayOff: '',
  remarks: '',
})
const selectedSchedule = ref(null)
const selectedAvailableSchedule = ref(null)

// Add filtered employees computed property
const filteredEmployees = computed(() => {
  if (!newSchedule.value.department) return []

  return employees.value.filter(
    (emp) =>
      emp.department === newSchedule.value.department &&
      !emp.deleted_at &&
      emp.role !== 'Super Admin',
  )
})

const openCreateModal = () => {
  newSchedule.value = {
    employeeName: '',
    department: '',
    type: '',
    timeIn: '',
    timeOut: '',
    day: '',
    dayOff: '',
    remarks: '',
  }
  createModal.value?.showModal()
}

const closeCreateModal = () => {
  createModal.value?.close()
  resetForm()
}

const addSchedule = async () => {
  try {
    const selectedEmployee = filteredEmployees.value.find(
      (emp) => emp.full_name === newSchedule.value.employeeName,
    )

    if (!selectedEmployee) {
      showToastMessage('Please select an employee', 'error')
      return
    }

    // Check for existing active schedule
    const existingSchedule = employeeSchedules.value.find(
      (schedule) => schedule.employee_id === selectedEmployee.employee_id && !schedule.deleted_at,
    )

    if (existingSchedule) {
      showToastMessage(
        `${selectedEmployee.full_name} already has an active schedule. Please archive the existing schedule first.`,
        'error',
      )
      return
    }

    const scheduleData = {
      employee_id: selectedEmployee.employee_id,
      schedule_id: selectedAvailableSchedule.value?.id,
      remarks: newSchedule.value.remarks,
    }

    // Add validation
    if (!scheduleData.employee_id || !scheduleData.schedule_id) {
      showToastMessage('Please select both an employee and a schedule', 'error')
      return
    }

    await employeeScheduleStore.addEmployeeSchedule(scheduleData)
    closeCreateModal()
    showToastMessage('Schedule assigned successfully!', 'success')
  } catch (err) {
    console.error('Error adding schedule:', err)
    // Check for specific error messages from the backend
    if (err.response?.data?.message?.includes('already has an active schedule')) {
      showToastMessage(
        'This employee already has an active schedule. Please archive the existing schedule first.',
        'error',
      )
    } else {
      showToastMessage('Unable to assign schedule. Please try again.', 'error')
    }
  }
}

function openViewModal(schedule) {
  selectedSchedule.value = schedule
  viewModal.value?.showModal()
}

function closeViewModal() {
  viewModal.value?.close()
}

// Format schedule label for dropdown
const scheduleLabel = (schedule) => {
  return `${schedule.type} (${schedule.time_in} - ${schedule.time_out})`
}

// Handle schedule selection
const onScheduleSelect = (schedule) => {
  if (schedule) {
    newSchedule.value = {
      ...newSchedule.value,
      type: schedule.type,
      timeIn: schedule.time_in,
      timeOut: schedule.time_out,
      day: Array.isArray(schedule.work_days) ? schedule.work_days.join(', ') : schedule.work_days,
      dayOff: Array.isArray(schedule.day_off) ? schedule.day_off.join(', ') : schedule.day_off,
    }
  }
}

// Reset form
const resetForm = () => {
  newSchedule.value = {
    employeeName: '',
    department: '',
    type: '',
    timeIn: '',
    timeOut: '',
    day: '',
    dayOff: '',
    remarks: '',
  }
  selectedAvailableSchedule.value = null
}

// Add these computed properties for employee handling
const employeesByDepartment = computed(() => {
  return employees.value.filter((emp) => !emp.deleted_at && emp.role !== 'Super Admin')
})

// Modify the edit modal functionality
const editModal = ref(null)
const editSchedule = ref(null)

// Update openEditModal function
const openEditModal = (schedule) => {
  editSchedule.value = {
    ...schedule,
    id: schedule.id,
    // Find the actual employee object based on the name
    employee: employeesByDepartment.value.find((emp) => emp.full_name === schedule.employeeName),
  }

  // Find and set the matching available schedule
  const matchingSchedule = availableSchedules.value.find(
    (s) =>
      s.type === schedule.type && s.time_in === schedule.timeIn && s.time_out === schedule.timeOut,
  )
  selectedAvailableSchedule.value = matchingSchedule || null
  editModal.value?.showModal()
}

// Add filtered employees for edit modal
const filteredEmployeesForEdit = computed(() => {
  if (!editSchedule.value?.department) return []

  return employeesByDepartment.value.filter(
    (emp) => emp.department === editSchedule.value.department,
  )
})

// Add confirmModal ref
const confirmModal = ref(null)
const confirmActionType = ref('') // 'edit', 'delete', 'restore'

// Modify deleteSchedule function to open confirmation modal first
const openDeleteModal = (schedule) => {
  selectedSchedule.value = schedule
  confirmActionType.value = 'delete'
  confirmModal.value?.showModal()
}

// Modify restoreSchedule function to open confirmation modal first
const openRestoreModal = (schedule) => {
  selectedSchedule.value = schedule
  confirmActionType.value = 'restore'
  confirmModal.value?.showModal()
}

// Add confirmAction function
const confirmAction = async () => {
  try {
    if (confirmActionType.value === 'edit') {
      if (!editSchedule.value) return

      const updatedSchedule = {
        id: editSchedule.value.id,
        employee_id: editSchedule.value.employee?.employee_id,
        schedule_id: selectedAvailableSchedule.value?.id,
        remarks: editSchedule.value.remarks,
      }

      await employeeScheduleStore.updateEmployeeSchedule(updatedSchedule.id, updatedSchedule)
      closeEditModal()
      showToastMessage('Schedule updated successfully!', 'success')
    } else if (confirmActionType.value === 'delete') {
      await employeeScheduleStore.deleteEmployeeSchedule(selectedSchedule.value.id)
      showToastMessage('Schedule archived successfully!', 'success')
    } else if (confirmActionType.value === 'restore') {
      await employeeScheduleStore.restoreEmployeeSchedule(selectedSchedule.value.id)
      showToastMessage('Schedule restored successfully!', 'success')
    }
    closeConfirmModal()
    await employeeScheduleStore.fetchEmployeeSchedules()
  } catch (err) {
    showToastMessage(err.message || 'Action failed', 'error')
  }
}

// Add closeConfirmModal function
const closeConfirmModal = () => {
  confirmModal.value?.close()
  selectedSchedule.value = null
  confirmActionType.value = ''
}

// Modify updateSchedule to open confirmation modal
const updateSchedule = () => {
  confirmActionType.value = 'edit'
  confirmModal.value?.showModal()
}

// Add closeEditModal function
const closeEditModal = () => {
  editModal.value?.close()
  editSchedule.value = null
  selectedAvailableSchedule.value = null
}

// Add toast state management
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// Update showToastMessage function to use your custom Toast
const showToastMessage = (message, type = 'success') => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 2500)
}

// Add PDF generator
const { generateEmployeeSchedulePDF, showExportModal } = useEmployeeSchedulePDFGenerator()

// Add export actions
const handleExport = async (action) => {
  try {
    await generateEmployeeSchedulePDF(filteredSchedules.value, action)
    showExportModal.value = false
  } catch (error) {
    console.error('Error generating PDF:', error)
    showToastMessage('Failed to generate PDF', 'error')
  }
}

// Fetch data on mount
onMounted(async () => {
  try {
    await Promise.all([
      scheduleStore.fetchSchedules(),
      employeeScheduleStore.fetchActiveEmployeeSchedules(),
      employeeStore.loadEmployees(),
    ])
  } catch (error) {
    console.error('Error loading data:', error)
    showToastMessage(
      error.response?.data?.message || 'Failed to load employee schedules data',
      'error',
    )
  }
})
</script>

<template>
  <div class="flex flex-col mt-4">
    <!-- Header with Export Buttons -->
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold text-black">Employee Manage Schedules</h2>
      <div class="flex gap-2">
        <div class="dropdown dropdown-end">
          <label tabindex="0" class="btn btn-outline btn-success btn-sm m-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-5 h-5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z"
              />
            </svg>
            Print
          </label>
          <ul
            tabindex="0"
            class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
          >
            <li><a @click="handleExport('print')">Print</a></li>
            <li><a @click="handleExport('preview')">Preview</a></li>
            <li><a @click="handleExport('save')">Save as PDF</a></li>
          </ul>
        </div>
        <button class="btn-primaryStyle" @click="openCreateModal">Add Schedule</button>
      </div>
    </div>

    <!-- Table -->
    <BaseTable :columns="columns" :data="filteredSchedules" :showExport="false" />
    <div class="flex justify-end gap-2 mt-4">
      <input type="checkbox" v-model="showArchived" class="checkbox checkbox-xs checkbox-neutral" />
      <span class="text-sm cursor-pointer hover:text-gray-500 text-black">
        Show Archived Schedules
      </span>
    </div>

    <!-- Create Schedule Modal -->
    <dialog ref="createModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-md text-black">Assign Schedule</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>
        <form @submit.prevent="addSchedule" class="flex flex-col gap-4 mt-2">
          <div>
            <label class="block text-sm text-black mb-1">Department</label>
            <select
              v-model="newSchedule.department"
              class="select focus:outline-none bg-white border-black text-black w-full"
              required
              @change="newSchedule.employeeName = ''"
            >
              <option disabled value="">Select Department</option>
              <option v-for="dept in departments" :key="dept" :value="dept">
                {{ dept }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-black mb-1">Employee Name</label>
            <select
              v-model="newSchedule.employeeName"
              class="select focus:outline-none bg-white border-black text-black w-full"
              required
              :disabled="!newSchedule.department"
            >
              <option disabled value="">Select Employee</option>
              <option
                v-for="emp in filteredEmployees"
                :key="emp.employee_id"
                :value="emp.full_name"
              >
                {{ emp.full_name }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-black mb-1">Schedule</label>
            <Multiselect
              v-model="selectedAvailableSchedule"
              :options="availableSchedules"
              :custom-label="scheduleLabel"
              placeholder="Select a schedule"
              class="multiselect-custom"
              @select="onScheduleSelect"
            />
          </div>
          <div>
            <label class="block text-sm text-black mb-1">Remarks</label>
            <textarea
              v-model="newSchedule.remarks"
              class="input-search"
              rows="2"
              placeholder="Enter remarks here..."
            ></textarea>
          </div>
          <div class="modal-action justify-center gap-4 mt-2">
            <button type="submit" class="btn-primaryStyle">Assign</button>
            <button type="button" class="btn-secondaryStyle" @click="closeCreateModal">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </dialog>

    <!-- View Schedule Modal -->
    <dialog ref="viewModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-md text-black">Schedule Details</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>
        <div v-if="selectedSchedule" class="flex flex-col gap-2 mt-2 text-black">
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Employee Name:</span>
            <span class="text-sm">{{ selectedSchedule.employeeName }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Type:</span>
            <span class="text-sm">{{ selectedSchedule.type }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Time In:</span>
            <span class="text-sm">{{ selectedSchedule.timeIn }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Time Out:</span>
            <span class="text-sm">{{ selectedSchedule.timeOut }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Work Days:</span>
            <span class="text-sm">{{ selectedSchedule.day || '-' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Day Off:</span>
            <span class="text-sm">{{ selectedSchedule.dayOff || '-' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Remarks:</span>
            <span class="text-right whitespace-pre-line break-words max-w-[180px]">
              {{ selectedSchedule.remarks || '-' }}
            </span>
          </div>
        </div>
        <div class="modal-action justify-end gap-4 mt-5">
          <button type="button" class="btn-secondaryStyle" @click="closeViewModal">Close</button>
        </div>
      </div>
    </dialog>

    <!-- Edit Schedule Modal -->
    <dialog ref="editModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-md text-black">Edit Schedule</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>
        <form v-if="editSchedule" @submit.prevent="updateSchedule" class="flex flex-col gap-4 mt-2">
          <div>
            <label class="block text-sm text-black mb-1">Department</label>
            <select
              v-model="editSchedule.department"
              class="select focus:outline-none bg-white border-black text-black w-full"
              required
              @change="editSchedule.employeeName = ''"
            >
              <option disabled value="">Select Department</option>
              <option v-for="dept in departments" :key="dept" :value="dept">
                {{ dept }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-black mb-1">Employee Name</label>
            <select
              v-model="editSchedule.employeeName"
              class="select focus:outline-none bg-white border-black text-black w-full"
              required
              :disabled="!editSchedule.department"
            >
              <option disabled value="">Select Employee</option>
              <option
                v-for="emp in filteredEmployeesForEdit"
                :key="emp.employee_id"
                :value="emp.full_name"
              >
                {{ emp.full_name }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-black mb-1">Schedule</label>
            <Multiselect
              v-model="selectedAvailableSchedule"
              :options="availableSchedules"
              :custom-label="scheduleLabel"
              placeholder="Select a schedule"
              class="multiselect-custom"
              @select="
                (schedule) => {
                  if (schedule) {
                    editSchedule.type = schedule.type
                    editSchedule.timeIn = schedule.time_in
                    editSchedule.timeOut = schedule.time_out
                    editSchedule.day = Array.isArray(schedule.work_days)
                      ? schedule.work_days.join(', ')
                      : schedule.work_days
                    editSchedule.dayOff = Array.isArray(schedule.day_off)
                      ? schedule.day_off.join(', ')
                      : schedule.day_off
                  }
                }
              "
            />
          </div>
          <div>
            <label class="block text-sm text-black mb-1">Remarks</label>
            <textarea
              v-model="editSchedule.remarks"
              class="input-search"
              rows="2"
              placeholder="Enter remarks here..."
            ></textarea>
          </div>
          <div class="modal-action justify-center gap-4 mt-2">
            <button type="submit" class="btn-primaryStyle">Save Changes</button>
            <button type="button" class="btn-secondaryStyle" @click="closeEditModal">Cancel</button>
          </div>
        </form>
      </div>
    </dialog>

    <!-- Add Confirmation Modal -->
    <dialog ref="confirmModal" class="modal">
      <div class="modal-box bg-white">
        <h3 class="font-bold text-lg text-black">Confirm Action</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>

        <div class="py-4 text-black">
          <template v-if="confirmActionType === 'delete'">
            Are you sure you want to archive this schedule?
          </template>
          <template v-else-if="confirmActionType === 'restore'">
            Are you sure you want to restore this schedule?
          </template>
          <template v-else-if="confirmActionType === 'edit'">
            Are you sure you want to save these changes?
          </template>
        </div>

        <div class="modal-action justify-center gap-4">
          <button @click="confirmAction" class="btn-primaryStyle">
            {{
              confirmActionType === 'delete'
                ? 'Archive'
                : confirmActionType === 'restore'
                  ? 'Restore'
                  : 'Save'
            }}
          </button>
          <button @click="closeConfirmModal" class="btn-secondaryStyle">Cancel</button>
        </div>
      </div>
    </dialog>

    <!-- Add Toast component -->
    <Toast :show="showToast" :message="toastMessage" :type="toastType" />
  </div>
</template>

<style scoped>
.relative {
  position: relative;
  display: inline-block;
  width: 100%;
}
</style>
