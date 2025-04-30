<script setup>
import { ref } from 'vue'
import BaseTable from '@/components/common/BaseTable.vue'

// Table columns
const columns = [
  { title: 'Position Title', field: 'positionTitle', sorter: 'string' },
  { title: 'Department', field: 'department', sorter: 'string' },
  {
    title: 'Rate per Hour',
    field: 'ratePerHour',
    sorter: 'number',
    hozAlign: 'right',
    formatter: (cell) =>
      `₱ ${cell.getValue().toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  },
  {
    title: 'Actions',
    field: 'actions',
    formatter: () => `
      <div class="flex gap-2">
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
    width: 120,
  },
]

// Example data
const positions = ref([
  { positionTitle: 'Software Engineer', department: 'IT', ratePerHour: 40.0 },
  { positionTitle: 'HR Manager', department: 'HR', ratePerHour: 35.0 },
  { positionTitle: 'Accountant', department: 'Finance', ratePerHour: 30.0 },
])

// Modal logic
const createModal = ref(null)
const newPosition = ref({
  positionTitle: '',
  department: '',
  ratePerHour: '',
})

const openCreateModal = () => {
  newPosition.value = { positionTitle: '', department: '', ratePerHour: '' }
  createModal.value?.showModal()
}

const closeCreateModal = () => {
  createModal.value?.close()
}

const addPosition = () => {
  if (
    newPosition.value.positionTitle &&
    newPosition.value.department &&
    newPosition.value.ratePerHour
  ) {
    positions.value.push({ ...newPosition.value })
    closeCreateModal()
  }
}
</script>

<template>
  <div class="flex flex-col mt-4">
    <!-- Header and Create Button -->
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold text-black">Employee Positions</h2>
      <button class="btn-primaryStyle" @click="openCreateModal">Add Position</button>
    </div>

    <!-- Table -->
    <BaseTable :columns="columns" :data="positions" :showExport="false" />
    <div class="flex justify-end gap-2 mt-4">
      <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
      <span class="text-sm cursor-pointer hover:text-gray-500 text-black"
        >Show Archived Positions</span
      >
    </div>

    <!-- Create Position Modal -->
    <dialog ref="createModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-md text-black">Create Position</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>
        <form @submit.prevent="addPosition" class="flex flex-col gap-4 mt-2">
          <div>
            <label class="block text-sm text-black mb-1">Position Title</label>
            <input v-model="newPosition.positionTitle" type="text" class="input-search" required />
          </div>
          <div>
            <label class="block text-sm text-black mb-1">Department</label>
            <input v-model="newPosition.department" type="text" class="input-search" required />
          </div>
          <div>
            <label class="block text-sm text-black mb-1">Rate per Hour</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >₱</span
              >
              <input
                v-model="newPosition.ratePerHour"
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
            <button type="submit" class="btn-primaryStyle">Create</button>
            <button type="button" class="btn-secondaryStyle" @click="closeCreateModal">
              Cancel
            </button>
          </div>
        </form>
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
