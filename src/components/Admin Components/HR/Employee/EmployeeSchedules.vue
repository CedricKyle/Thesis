<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useAvailableScheduleStore } from '@/stores/HR Management/availableScheduleStore'
import BaseTable from '@/components/common/BaseTable.vue'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.min.css'

// Store
const scheduleStore = useAvailableScheduleStore()

// Data
const schedules = computed(() => scheduleStore.schedules)
const archivedSchedules = computed(() => scheduleStore.archivedSchedules)
const showArchived = ref(false)

// Combine active and archived for table display
const tableData = computed(() => {
  if (showArchived.value) {
    // Combine and deduplicate by ie
    const combined = [...schedules.value, ...archivedSchedules.value]
    return combined.filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i)
  }
  return schedules.value
})

// Modal logic
const createModal = ref(null)
const editModal = ref(null)
const viewModal = ref(null)
const confirmModal = ref(null)

const newSchedule = ref({
  type: '',
  time_in: '',
  time_out: '',
  work_days: [],
  day_off: [],
  remarks: '',
})
const selectedSchedule = ref(null)
const editSchedule = ref(null)
const confirmActionType = ref('') // 'create', 'edit', 'delete', 'restore'

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// Toast logic
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
  { title: 'Start Time', field: 'time_in', sorter: 'string' },
  { title: 'End Time', field: 'time_out', sorter: 'string' },
  {
    title: 'Work Days',
    field: 'work_days',
    sorter: 'string',
    hozAlign: 'center',
    formatter: (cell) => {
      const value = cell.getValue()
      if (Array.isArray(value)) return value.join(', ')
      if (typeof value === 'string') {
        try {
          const arr = JSON.parse(value)
          if (Array.isArray(arr)) return arr.join(', ')
          return value
        } catch {
          return value
        }
      }
      return ''
    },
  },
  {
    title: 'Day Off',
    field: 'day_off',
    sorter: 'string',
    hozAlign: 'center',
    formatter: (cell) => {
      const value = cell.getValue()
      if (Array.isArray(value)) return value.join(', ')
      if (typeof value === 'string') {
        try {
          const arr = JSON.parse(value)
          if (Array.isArray(arr)) return arr.join(', ')
          return value
        } catch {
          return value
        }
      }
      return ''
    },
  },
  { title: 'Remarks', field: 'remarks', sorter: 'string' },
  {
    title: 'Actions',
    field: 'actions',
    formatter: (cell) => {
      const record = cell.getRow().getData()
      const isArchived = !!record.deleted_at
      if (isArchived) {
        return `
          <button class="btn btn-sm btn-circle btn-ghost restore-button" title="Restore">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M3 12a9 9 0 0 1 9-9 9 9 0 0 1 6.36 2.64l2.14-2.14M21 12a9 9 0 0 1-9 9 9 9 0 0 1-6.36-2.64l-2.14 2.14"/>
            </svg>
          </button>
        `
      }
      return `
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
      `
    },
    headerSort: false,
    hozAlign: 'center',
    width: 150,
    cellClick: (e, cell) => {
      const record = cell.getRow().getData()
      const isArchived = !!record.deleted_at
      if (isArchived && e.target.closest('.restore-button')) openRestoreModal(record)
      else if (!isArchived && e.target.closest('.view-button')) openViewModal(record)
      else if (!isArchived && e.target.closest('.edit-button')) openEditModal(record)
      else if (!isArchived && e.target.closest('.delete-button')) openDeleteModal(record)
    },
  },
]

// Fetch schedules on mount
onMounted(() => {
  scheduleStore.fetchSchedules(true)
})

// Add Schedule
const openCreateModal = () => {
  newSchedule.value = {
    type: '',
    time_in: '',
    time_out: '',
    work_days: [],
    day_off: [],
    remarks: '',
  }
  createModal.value?.showModal()
}
const closeCreateModal = () => createModal.value?.close()

const validateSchedule = (sched) => {
  const errors = []
  if (!sched.type) errors.push('Type is required')
  if (!sched.time_in) errors.push('Time In is required')
  if (!sched.time_out) errors.push('Time Out is required')
  if (!sched.work_days || sched.work_days.length === 0) errors.push('Work Days are required')
  if (!sched.day_off || sched.day_off.length === 0) errors.push('Day Off is required')
  if (sched.work_days.some((day) => sched.day_off.includes(day))) {
    errors.push('Work Days and Day Off cannot overlap')
  }
  return errors
}

const overlapError = computed(() => {
  const overlap = newSchedule.value.work_days.filter((day) =>
    newSchedule.value.day_off.includes(day),
  )
  if (overlap.length > 0) {
    return `You cannot select the same day in both Work Days and Day Off: ${overlap.join(', ')}`
  }
  return ''
})

const addSchedule = async () => {
  const errors = validateSchedule(newSchedule.value)
  if (errors.length > 0) {
    showToastMessage(errors.join('\n'), 'error')
    return
  }
  confirmActionType.value = 'create'
  confirmModal.value?.showModal()
}

const confirmAction = async () => {
  try {
    if (confirmActionType.value === 'create') {
      await scheduleStore.addSchedule({ ...newSchedule.value })
      closeCreateModal()
      showToastMessage('Schedule added successfully!', 'success')
    } else if (confirmActionType.value === 'edit') {
      await scheduleStore.updateSchedule(editSchedule.value.id, { ...editSchedule.value })
      closeEditModal()
      showToastMessage('Schedule updated successfully!', 'success')
    } else if (confirmActionType.value === 'delete') {
      await scheduleStore.deleteSchedule(selectedSchedule.value.id)
      showToastMessage('Schedule archived successfully!', 'success')
    } else if (confirmActionType.value === 'restore') {
      await scheduleStore.restoreSchedule(selectedSchedule.value.id)
      showToastMessage('Schedule restored successfully!', 'success')
    }
    // Always refresh after any action
    await scheduleStore.fetchSchedules(true)
  } catch (err) {
    showToastMessage(scheduleStore.error || 'Something went wrong', 'error')
  }
  closeConfirmModal()
}

const closeConfirmModal = () => confirmModal.value?.close()

// Edit Schedule
const openEditModal = (schedule) => {
  selectedSchedule.value = schedule
  editSchedule.value = {
    ...schedule,
    work_days: Array.isArray(schedule.work_days)
      ? schedule.work_days
      : typeof schedule.work_days === 'string'
        ? JSON.parse(schedule.work_days)
        : [],
    day_off: Array.isArray(schedule.day_off)
      ? schedule.day_off
      : typeof schedule.day_off === 'string'
        ? JSON.parse(schedule.day_off)
        : [],
  }
  editModal.value?.showModal()
}
const closeEditModal = () => {
  editModal.value?.close()
  selectedSchedule.value = null
  editSchedule.value = null
}
const editOverlapError = computed(() => {
  if (!editSchedule.value) return ''
  const overlap = editSchedule.value.work_days.filter((day) =>
    editSchedule.value.day_off.includes(day),
  )
  if (overlap.length > 0) {
    return `You cannot select the same day in both Work Days and Day Off: ${overlap.join(', ')}`
  }
  return ''
})
function isEditWorkDaySelected(day) {
  return editSchedule?.work_days?.includes(day)
}
const updateSchedule = async () => {
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

// Restore Schedule
const openRestoreModal = (schedule) => {
  selectedSchedule.value = schedule
  confirmActionType.value = 'restore'
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
  return newSchedule.value.day_off.includes(day)
}
function isWorkDaySelected(day) {
  return newSchedule.value.work_days.includes(day)
}

// Always fetch both on toggle
watch(showArchived, async () => {
  await scheduleStore.fetchSchedules(true)
})
</script>

<template>
  <div class="flex flex-col mt-4">
    <!-- Header and Create Button -->
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold text-black">Employee Schedules</h2>
      <button class="btn-primaryStyle" @click="openCreateModal">Add Schedule</button>
    </div>

    <!-- Table -->
    <BaseTable :columns="columns" :data="tableData" :showExport="false" />
    <div class="flex justify-end gap-2 mt-4">
      <input type="checkbox" v-model="showArchived" class="checkbox checkbox-xs checkbox-neutral" />
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
              <option value="Morning Shift">Morning Shift</option>
              <option value="Mid Shift">Mid Shift</option>
              <option value="Afternoon Shift">Afternoon Shift</option>
              <option value="Night Shift (with night differential)">
                Night Shift (with night differential)
              </option>
              <option value="Graveyard Shift">Graveyard Shift</option>
              <option value="Custom Shift">Custom Shift</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-black mb-1">Start Time</label>
            <input v-model="newSchedule.time_in" type="time" class="input-search" required />
          </div>
          <div>
            <label class="block text-sm text-black mb-1">End Time</label>
            <input v-model="newSchedule.time_out" type="time" class="input-search" required />
          </div>
          <div>
            <label class="block text-sm text-black mb-1">Work Days</label>
            <Multiselect
              v-model="newSchedule.work_days"
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
              v-model="newSchedule.day_off"
              :options="daysOfWeek"
              :multiple="true"
              :close-on-select="false"
              placeholder="Select day off"
              class="multiselect-custom"
              :option-disabled="isWorkDaySelected"
            />
          </div>
          <div v-if="overlapError" class="error-text">
            {{ overlapError }}
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
            <button type="submit" class="btn-primaryStyle" :disabled="!!overlapError">Add</button>
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
              <option value="Morning Shift">Morning Shift</option>
              <option value="Mid Shift">Mid Shift</option>
              <option value="Afternoon Shift">Afternoon Shift</option>
              <option value="Night Shift (with night differential)">
                Night Shift (with night differential)
              </option>
              <option value="Graveyard Shift">Graveyard Shift</option>
              <option value="Custom Shift">Custom Shift</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-black mb-1">Time In</label>
            <input v-model="editSchedule.time_in" type="time" class="input-search" required />
          </div>
          <div>
            <label class="block text-sm text-black mb-1">Time Out</label>
            <input v-model="editSchedule.time_out" type="time" class="input-search" required />
          </div>
          <div>
            <label class="block text-sm text-black mb-1">Work Days</label>
            <Multiselect
              v-model="editSchedule.work_days"
              :options="daysOfWeek"
              :multiple="true"
              :close-on-select="false"
              placeholder="Select work days"
              class="multiselect-custom"
            />
          </div>
          <div>
            <label class="block text-sm text-black mb-1">Day Off</label>
            <Multiselect
              v-model="editSchedule.day_off"
              :options="daysOfWeek"
              :multiple="true"
              :close-on-select="false"
              placeholder="Select day off"
              class="multiselect-custom"
              :option-disabled="isEditWorkDaySelected"
            />
          </div>
          <div v-if="editOverlapError" class="error-text">
            {{ editOverlapError }}
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
            <button type="submit" class="btn-primaryStyle" :disabled="!!editOverlapError">
              Save Changes
            </button>
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
            <span class="text-sm">{{ selectedSchedule.time_in }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Time Out:</span>
            <span class="text-sm">{{ selectedSchedule.time_out }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Work Days:</span>
            <span class="text-sm">
              {{
                Array.isArray(selectedSchedule.work_days)
                  ? selectedSchedule.work_days.join(', ')
                  : typeof selectedSchedule.work_days === 'string'
                    ? JSON.parse(selectedSchedule.work_days).join(', ')
                    : ''
              }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Day Off:</span>
            <span class="text-sm">
              {{
                Array.isArray(selectedSchedule.day_off)
                  ? selectedSchedule.day_off.join(', ')
                  : typeof selectedSchedule.day_off === 'string'
                    ? JSON.parse(selectedSchedule.day_off).join(', ')
                    : ''
              }}
            </span>
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
                  : confirmActionType === 'delete'
                    ? 'archive'
                    : 'restore'
            }}
          </span>
          this schedule?
        </p>
        <div class="modal-action justify-center gap-4">
          <button
            class="btn-primaryStyle"
            :class="{
              'btn-errorStyle': confirmActionType === 'delete' || confirmActionType === 'restore',
            }"
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
  border-radius: 0.5rem;
  background: #fff;
  min-height: 40px;
  font-size: 1rem;
  color: #222;
  padding: 0 0.75rem; /* Remove vertical padding for better alignment */
  box-sizing: border-box;
  display: flex;
  align-items: center;
}
.multiselect__tags {
  min-height: 40px;
  display: flex;
  align-items: center;
  padding: 0;
}
.multiselect__input,
.multiselect__single {
  min-height: 40px;
  line-height: 40px;
  padding: 0;
}
.multiselect__content-wrapper {
  background: #466114 !important;
  border-radius: 0 0 0.5rem 0.5rem;
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
.error-text {
  color: red;
  font-size: 0.8em;
  margin-top: 0.5em;
}
</style>
