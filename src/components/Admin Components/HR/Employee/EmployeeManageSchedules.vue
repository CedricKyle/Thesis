<script setup>
import { ref } from 'vue'
import BaseTable from '@/components/common/BaseTable.vue'

// Table columns
const columns = [
  { title: 'Employee Name', field: 'employeeName', sorter: 'string' },
  { title: 'Type', field: 'type', sorter: 'string' },
  { title: 'Department', field: 'department', sorter: 'string' },
  { title: 'Start Time', field: 'timeIn', sorter: 'string', hozAlign: 'center' },
  { title: 'End Time', field: 'timeOut', sorter: 'string', hozAlign: 'center' },
  { title: 'Work Days', field: 'day', sorter: 'string', hozAlign: 'center' },
  { title: 'Day Off', field: 'dayOff', sorter: 'string', hozAlign: 'center' },
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
        <button class="btn btn-sm btn-circle hover:bg-primaryColor/80 border-none btn-ghost" title="Edit">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button class="btn btn-sm btn-circle hover:bg-red-400 border-none btn-ghost" title="Delete">
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
      }
      // Add edit/delete logic here if needed
    },
  },
]

// Example data
const schedules = ref([
  {
    employeeName: 'Juan Dela Cruz',
    department: 'HR Department',
    type: 'Night Shift',
    timeIn: '22:00',
    timeOut: '06:00',
    day: 'Monday-Friday',
    dayOff: 'Saturday-Sunday',
    remarks: 'Rotating every 2 weeks',
  },
  {
    employeeName: 'Maria Santos',
    department: 'HR Department',
    type: 'Day',
    timeIn: '08:00',
    timeOut: '17:00',
    day: 'Monday-Friday',
    dayOff: 'Sunday',
    remarks: 'Standard day shift',
  },
  {
    employeeName: 'Pedro Reyes',
    department: 'HR Department',
    type: 'Part Time',
    timeIn: '13:00',
    timeOut: '17:00',
    day: 'Monday, Wednesday, Friday',
    dayOff: 'Tuesday, Thursday, Saturday, Sunday',
    remarks: 'Student assistant',
  },
])

// Modal logic
const createModal = ref(null)
const viewModal = ref(null)
const newSchedule = ref({
  employeeName: '',
  type: '',
  timeIn: '',
  timeOut: '',
  day: '',
  dayOff: '',
  remarks: '',
})
const selectedSchedule = ref(null)

const openCreateModal = () => {
  newSchedule.value = {
    employeeName: '',
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
}

const addSchedule = () => {
  if (
    newSchedule.value.employeeName &&
    newSchedule.value.type &&
    newSchedule.value.timeIn &&
    newSchedule.value.timeOut &&
    newSchedule.value.day &&
    newSchedule.value.dayOff
  ) {
    schedules.value.push({ ...newSchedule.value })
    closeCreateModal()
  }
}

function openViewModal(schedule) {
  selectedSchedule.value = schedule
  viewModal.value?.showModal()
}

function closeViewModal() {
  viewModal.value?.close()
}
</script>

<template>
  <div class="flex flex-col mt-4">
    <!-- Header and Create Button -->
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold text-black">Employee Manage Schedules</h2>
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

    <!-- Create Schedule Modal -->
    <dialog ref="createModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-md text-black">Add Schedule</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>
        <form @submit.prevent="addSchedule" class="flex flex-col gap-4 mt-2">
          <div>
            <label class="block text-sm text-black mb-1">Employee Name</label>
            <input v-model="newSchedule.employeeName" type="text" class="input-search" required />
          </div>
          <div>
            <label class="block text-sm text-black mb-1">Type</label>
            <select v-model="newSchedule.type" class="input-search" required>
              <option value="" disabled>Select type</option>
              <option value="Night Shift">Night Shift</option>
              <option value="Day">Day</option>
              <option value="Part Time">Part Time</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-black mb-1">Time In</label>
            <input v-model="newSchedule.timeIn" type="time" class="input-search" required />
          </div>
          <div>
            <label class="block text-sm text-black mb-1">Time Out</label>
            <input v-model="newSchedule.timeOut" type="time" class="input-search" required />
          </div>
          <div>
            <label class="block text-sm text-black mb-1">Work Days</label>
            <input
              v-model="newSchedule.day"
              type="text"
              class="input-search"
              placeholder="e.g. Monday-Friday"
              required
            />
          </div>
          <div>
            <label class="block text-sm text-black mb-1">Day Off</label>
            <input
              v-model="newSchedule.dayOff"
              type="text"
              class="input-search"
              placeholder="e.g. Sunday"
              required
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
            <span class="text-sm">{{ selectedSchedule.day }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Day Off:</span>
            <span class="text-sm">{{ selectedSchedule.dayOff }}</span>
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
  </div>
</template>

<style scoped>
.relative {
  position: relative;
  display: inline-block;
  width: 100%;
}
</style>
