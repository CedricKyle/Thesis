<script setup>
import { ref, computed } from 'vue'
import BaseTable from '@/components/common/BaseTable.vue'

// Calendar logic
const today = new Date().toISOString().split('T')[0]
const selectedDate = ref(today)

// Table columns
const columns = [
  { title: 'Date', field: 'date', sorter: 'date', hozAlign: 'left' },
  { title: 'Name', field: 'name', sorter: 'string' },
  {
    title: 'No. Hours',
    field: 'hours',
    sorter: 'number',
    hozAlign: 'right',
    formatter: (cell) =>
      Number(cell.getValue()).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
  },
  {
    title: 'Rate',
    field: 'rate',
    sorter: 'number',
    hozAlign: 'right',
    formatter: (cell) =>
      `₱ ${Number(cell.getValue()).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  },
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
const overtimes = ref([
  { date: '2024-06-01', name: 'Juan Dela Cruz', hours: 2, rate: 120.0 },
  { date: '2024-06-03', name: 'Maria Santos', hours: 1.5, rate: 150.0 },
  { date: '2024-06-05', name: 'Pedro Reyes', hours: 3, rate: 100.0 },
])

// Filtered data based on selected date
const filteredOvertimes = computed(() =>
  overtimes.value.filter((ot) => ot.date === selectedDate.value),
)

// Modal logic
const createModal = ref(null)
const viewModal = ref(null)
const newOvertime = ref({
  date: '',
  name: '',
  hours: '',
  rate: '',
})
const selectedOvertime = ref(null)

const openCreateModal = () => {
  newOvertime.value = { date: selectedDate.value, name: '', hours: '', rate: '' }
  createModal.value?.showModal()
}

const closeCreateModal = () => {
  createModal.value?.close()
}

const addOvertime = () => {
  if (
    newOvertime.value.date &&
    newOvertime.value.name &&
    newOvertime.value.hours &&
    newOvertime.value.rate
  ) {
    overtimes.value.push({ ...newOvertime.value })
    closeCreateModal()
  }
}

function openViewModal(overtime) {
  selectedOvertime.value = overtime
  viewModal.value?.showModal()
}

function closeViewModal() {
  viewModal.value?.close()
}
</script>

<template>
  <div class="flex flex-col mt-4">
    <!-- Calendar and Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
      <div class="flex items-center gap-2">
        <input type="date" v-model="selectedDate" class="input-search input-sm" />
      </div>
      <button class="btn-primaryStyle" @click="openCreateModal">Add Overtime</button>
    </div>

    <!-- Table -->
    <BaseTable :columns="columns" :data="filteredOvertimes" :showExport="false" />
    <div class="flex justify-end gap-2 mt-4">
      <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
      <span class="text-sm cursor-pointer hover:text-gray-500 text-black"
        >Show Archived Overtime</span
      >
    </div>

    <!-- Create Overtime Modal -->
    <dialog ref="createModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-md text-black">Add Overtime</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>
        <form @submit.prevent="addOvertime" class="flex flex-col gap-4 mt-2">
          <div>
            <label class="block text-sm text-black mb-1">Date</label>
            <input v-model="newOvertime.date" type="date" class="input-search" required />
          </div>
          <div>
            <label class="block text-sm text-black mb-1">Name</label>
            <input v-model="newOvertime.name" type="text" class="input-search" required />
          </div>
          <div>
            <label class="block text-sm text-black mb-1">No. Hours</label>
            <input
              v-model="newOvertime.hours"
              type="number"
              min="0"
              step="0.01"
              class="input-search"
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <label class="block text-sm text-black mb-1">Rate</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 transform -translate-y-1/2 !text-gray-900"
                >₱</span
              >
              <input
                v-model="newOvertime.rate"
                type="number"
                min="0"
                step="0.01"
                class="input-search pl-7"
                placeholder="0.00"
                required
              />
            </div>
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

    <!-- View Overtime Modal (Styled like EmployeeList) -->
    <dialog ref="viewModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-md text-black">Overtime Details</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>
        <div v-if="selectedOvertime" class="flex flex-col gap-2 mt-2 text-black">
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Date:</span>
            <span class="text-sm">{{ selectedOvertime.date }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Name:</span>
            <span class="text-sm">{{ selectedOvertime.name }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">No. Hours:</span>
            <span class="text-sm">
              {{
                Number(selectedOvertime.hours).toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Rate:</span>
            <span class="text-sm">
              ₱
              {{
                Number(selectedOvertime.rate).toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              }}
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
