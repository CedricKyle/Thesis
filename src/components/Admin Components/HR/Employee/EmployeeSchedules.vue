<script setup>
import { ref, onMounted, watch } from 'vue'
import BaseTable from '@/components/common/BaseTable.vue'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.min.css'

// Toast logic (copying style from EmployeeDeduction)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')
function showToastMessage(message, type = 'success') {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
  setTimeout(() => (showToast.value = false), 2500)
}

// Table columns
const columns = [
  { title: 'Type', field: 'type', sorter: 'string' },
  { title: 'Start Time', field: 'timeIn', sorter: 'string', hozAlign: 'center' },
  { title: 'End Time', field: 'timeOut', sorter: 'string', hozAlign: 'center' },
  {
    title: 'Work Days',
    field: 'workDays',
    sorter: 'string',
    hozAlign: 'center',
    formatter: (cell) => (cell.getValue() || []).join(', '),
  },
  {
    title: 'Day Off',
    field: 'dayOff',
    sorter: 'string',
    hozAlign: 'center',
    formatter: (cell) => (cell.getValue() || []).join(', '),
  },
  { title: 'Remarks', field: 'remarks', sorter: 'string' },
  {
    title: 'Actions',
    field: 'actions',
    formatter: () => `
      <div class="flex gap-2">
        <button class="btn btn-sm btn-circle hover:bg-primaryColor/80 border-none btn-ghost view-button" title="View">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
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
      </div>
    `,
    headerSort: false,
    hozAlign: 'center',
    width: 150,
    cellClick: (e, cell) => {
      const record = cell.getRow().getData()
      if (e.target.closest('.view-button')) {
        openViewModal(record)
      } else if (e.target.closest('.edit-button')) {
        openEditModal(record)
      } else if (e.target.closest('.delete-button')) {
        openDeleteModal(record)
      }
    },
  },
]

// Data
const schedules = ref([
  {
    type: 'Night Shift',
    timeIn: '22:00',
    timeOut: '06:00',
    workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    dayOff: ['Saturday', 'Sunday'],
    remarks: 'Rotating every 2 weeks',
  },
  {
    type: 'Day',
    timeIn: '08:00',
    timeOut: '17:00',
    workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    dayOff: ['Sunday'],
    remarks: 'Standard day shift',
  },
])

// Modal logic
const createModal = ref(null)
const editModal = ref(null)
const viewModal = ref(null)
const confirmModal = ref(null)

const newSchedule = ref({
  type: '',
  timeIn: '',
  timeOut: '',
  workDays: [],
  dayOff: [],
  remarks: '',
})
const selectedSchedule = ref(null)
const editSchedule = ref(null)
const confirmActionType = ref('') // 'create', 'edit', 'delete'

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// Add Schedule
const openCreateModal = () => {
  newSchedule.value = { type: '', timeIn: '', timeOut: '', workDays: [], dayOff: [], remarks: '' }
  createModal.value?.showModal()
}
const closeCreateModal = () => createModal.value?.close()

const validateSchedule = (sched) => {
  const errors = []
  if (!sched.type) errors.push('Type is required')
  if (!sched.timeIn) errors.push('Time In is required')
  if (!sched.timeOut) errors.push('Time Out is required')
  if (!sched.workDays || sched.workDays.length === 0) errors.push('Work Days are required')
  if (!sched.dayOff || sched.dayOff.length === 0) errors.push('Day Off is required')
  // Prevent overlap
  if (sched.workDays.some((day) => sched.dayOff.includes(day))) {
    errors.push('Work Days and Day Off cannot overlap')
  }
  return errors
}

const addSchedule = () => {
  const errors = validateSchedule(newSchedule.value)
  if (errors.length > 0) {
    showToastMessage(errors.join('\n'), 'error')
    return
  }
  confirmActionType.value = 'create'
  confirmModal.value?.showModal()
}

const confirmAction = () => {
  if (confirmActionType.value === 'create') {
    schedules.value.push({ ...newSchedule.value })
    closeCreateModal()
    showToastMessage('Schedule added successfully!', 'success')
  } else if (confirmActionType.value === 'edit') {
    // Find and update
    const idx = schedules.value.findIndex((s) => s === selectedSchedule.value)
    if (idx !== -1) {
      schedules.value[idx] = { ...editSchedule.value }
      closeEditModal()
      showToastMessage('Schedule updated successfully!', 'success')
    }
  } else if (confirmActionType.value === 'delete') {
    // Remove
    const idx = schedules.value.findIndex((s) => s === selectedSchedule.value)
    if (idx !== -1) {
      schedules.value.splice(idx, 1)
      showToastMessage('Schedule deleted successfully!', 'success')
    }
  }
  closeConfirmModal()
}

const closeConfirmModal = () => confirmModal.value?.close()

// Edit Schedule
const openEditModal = (schedule) => {
  selectedSchedule.value = schedule
  editSchedule.value = { ...schedule }
  editModal.value?.showModal()
}
const closeEditModal = () => {
  editModal.value?.close()
  selectedSchedule.value = null
  editSchedule.value = null
}
const updateSchedule = () => {
  const errors = validateSchedule(editSchedule.value)
  if (errors.length > 0) {
    showToastMessage(errors.join('\n'), 'error')
    return
  }
  confirmActionType.value = 'edit'
  confirmModal.value?.showModal()
}

// Delete Schedule
const openDeleteModal = (schedule) => {
  selectedSchedule.value = schedule
  confirmActionType.value = 'delete'
  confirmModal.value?.showModal()
}

// View Schedule
function openViewModal(schedule) {
  selectedSchedule.value = schedule
  viewModal.value?.showModal()
}
function closeViewModal() {
  viewModal.value?.close()
  selectedSchedule.value = null
}

function isDayOffSelected(day) {
  return newSchedule.value.dayOff.includes(day)
}
function isWorkDaySelected(day) {
  return newSchedule.value.workDays.includes(day)
}
</script>

<template>
  <div class="flex flex-col mt-4">
    <!-- Header and Create Button -->
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold text-black">Employee Schedules</h2>
      <button class="btn-primaryStyle" @click="openCreateModal">Add Schedule</button>
    </div>

    <!-- Table -->
    <BaseTable :columns="columns" :data="schedules" :showExport="false" />
    <div class="flex justify-end gap-2 mt-4">
      <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
      <span class="text-sm cursor-pointer hover:text-gray-500 text-black"
        >Show Archived Schedules</span
      >
    </div>

    <!-- Create Modal -->
    <dialog ref="createModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-md text-black">Add Schedule</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>
        <form @submit.prevent="addSchedule" class="flex flex-col gap-4 mt-2">
          <div>
            <label class="block text-sm text-black mb-1">Type</label>
            <select v-model="newSchedule.type" class="input-search cursor-pointer" required>
              <option value="" disabled>Select type</option>
              <option value="Night Shift">Night Shift</option>
              <option value="Day Shift">Day Shift</option>
              <option value="Part Time">Part Time</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-black mb-1">Start Time</label>
            <input v-model="newSchedule.timeIn" type="time" class="input-search" required />
          </div>
          <div>
            <label class="block text-sm text-black mb-1">End Time</label>
            <input v-model="newSchedule.timeOut" type="time" class="input-search" required />
          </div>
          <div>
            <label class="block text-sm text-black mb-1">Work Days</label>
            <Multiselect
              v-model="newSchedule.workDays"
              :options="daysOfWeek"
              :multiple="true"
              :close-on-select="false"
              placeholder="Select work days"
              class="multiselect-custom"
              :option-disabled="isDayOffSelected"
            />
          </div>
          <div>
            <label class="block text-sm text-black mb-1">Day Off</label>
            <Multiselect
              v-model="newSchedule.dayOff"
              :options="daysOfWeek"
              :multiple="true"
              :close-on-select="false"
              placeholder="Select day off"
              class="multiselect-custom"
              :option-disabled="isWorkDaySelected"
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
            <button type="submit" class="btn-primaryStyle">Add</button>
            <button type="button" class="btn-secondaryStyle" @click="closeCreateModal">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </dialog>

    <!-- Edit Modal -->
    <dialog ref="editModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-md text-black">Edit Schedule</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>
        <form v-if="editSchedule" @submit.prevent="updateSchedule" class="flex flex-col gap-4 mt-2">
          <div>
            <label class="block text-sm text-black mb-1">Type</label>
            <select v-model="editSchedule.type" class="input-search" required>
              <option value="" disabled>Select type</option>
              <option value="Night Shift">Night Shift</option>
              <option value="Day">Day</option>
              <option value="Part Time">Part Time</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-black mb-1">Time In</label>
            <input v-model="editSchedule.timeIn" type="time" class="input-search" required />
          </div>
          <div>
            <label class="block text-sm text-black mb-1">Time Out</label>
            <input v-model="editSchedule.timeOut" type="time" class="input-search" required />
          </div>
          <div>
            <label class="block text-sm text-black mb-1">Work Days</label>
            <Multiselect
              v-model="editSchedule.workDays"
              :options="daysOfWeek"
              :multiple="true"
              :close-on-select="false"
              placeholder="Select work days"
            />
          </div>
          <div>
            <label class="block text-sm text-black mb-1">Day Off</label>
            <Multiselect
              v-model="editSchedule.dayOff"
              :options="daysOfWeek"
              :multiple="true"
              :close-on-select="false"
              placeholder="Select day off"
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

    <!-- View Modal -->
    <dialog ref="viewModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-md text-black">Schedule Details</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>
        <div v-if="selectedSchedule" class="flex flex-col gap-2 mt-2 text-black">
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
            <span class="text-sm">{{ (selectedSchedule.workDays || []).join(', ') }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Day Off:</span>
            <span class="text-sm">{{ (selectedSchedule.dayOff || []).join(', ') }}</span>
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

    <!-- Confirm Modal -->
    <dialog ref="confirmModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-md text-black">Confirm Action</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>
        <p class="py-4 text-center text-black text-sm">
          Are you sure you want to
          <span class="font-bold">
            {{
              confirmActionType === 'create'
                ? 'add'
                : confirmActionType === 'edit'
                  ? 'save changes to'
                  : 'delete'
            }}
          </span>
          this schedule?
        </p>
        <div class="modal-action justify-center gap-4">
          <button
            class="btn-primaryStyle"
            :class="{ 'btn-errorStyle': confirmActionType === 'delete' }"
            @click="confirmAction"
          >
            Yes
          </button>
          <button class="btn-secondaryStyle" @click="closeConfirmModal">Cancel</button>
        </div>
      </div>
    </dialog>

    <!-- Toast Component -->
    <div
      v-if="showToast"
      :class="{
        'fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300': true,
        'bg-green-500': toastType === 'success',
        'bg-red-500': toastType === 'error',
        'bg-yellow-500': toastType === 'warning',
        'bg-blue-500': toastType === 'info',
      }"
    >
      <p class="text-white">{{ toastMessage }}</p>
    </div>
  </div>
</template>

<style scoped>
.relative {
  position: relative;
  display: inline-block;
  width: 100%;
}
.multiselect-custom {
  width: 100%;
  border: 1px solid #466114;
  border-radius: 0.5rem;
  background: #fff;
  min-height: 40px;
  font-size: 1rem;
  color: #222;
  /* Match your .input-search padding if needed */
}
.multiselect__content-wrapper {
  background: #466114 !important;
}
.multiselect__option--highlight {
  background: #36500e !important;
  color: #fff !important;
}
.multiselect__option--selected {
  background: #36500e !important;
  color: #fff !important;
}
.multiselect__option[aria-disabled='true'] {
  opacity: 0.5;
  pointer-events: none;
}
</style>
