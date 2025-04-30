<script setup>
import { ref } from 'vue'
import BaseTable from '@/components/common/BaseTable.vue'

// Table columns
const columns = [
  { title: 'Description', field: 'description', sorter: 'string' },
  {
    title: 'Amount',
    field: 'amount',
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
const deductions = ref([
  { description: 'SSS Contribution', amount: 500.0 },
  { description: 'Pag-IBIG Loan', amount: 1200.0 },
  { description: 'PhilHealth', amount: 350.0 },
])

// Modal logic
const createModal = ref(null)
const viewModal = ref(null)
const newDeduction = ref({
  description: '',
  amount: '',
})
const selectedDeduction = ref(null)

const openCreateModal = () => {
  newDeduction.value = { description: '', amount: '' }
  createModal.value?.showModal()
}

const closeCreateModal = () => {
  createModal.value?.close()
}

const addDeduction = () => {
  if (newDeduction.value.description && newDeduction.value.amount) {
    deductions.value.push({ ...newDeduction.value })
    closeCreateModal()
  }
}

function openViewModal(deduction) {
  selectedDeduction.value = deduction
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
      <h2 class="text-xl font-semibold text-black">Employee Deduction</h2>
      <button class="btn-primaryStyle" @click="openCreateModal">Add Deduction</button>
    </div>

    <!-- Table -->
    <BaseTable :columns="columns" :data="deductions" :showExport="false" />
    <div class="flex justify-end gap-2 mt-4">
      <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
      <span class="text-sm cursor-pointer hover:text-gray-500 text-black"
        >Show Archived Deductions</span
      >
    </div>

    <!-- Create Deduction Modal -->
    <dialog ref="createModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-md text-black">Add Deduction</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>
        <form @submit.prevent="addDeduction" class="flex flex-col gap-4 mt-2">
          <div>
            <label class="block text-sm text-black mb-1">Description</label>
            <input v-model="newDeduction.description" type="text" class="input-search" required />
          </div>
          <div>
            <label class="block text-sm text-black mb-1">Amount</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 transform -translate-y-1/2 !text-gray-900"
                >₱</span
              >
              <input
                v-model="newDeduction.amount"
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

    <!-- View Deduction Modal (Styled like EmployeeList) -->
    <dialog ref="viewModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-md text-black">Deduction Details</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>
        <div v-if="selectedDeduction" class="flex flex-col gap-2 mt-2 text-black">
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Description:</span>
            <span class="text-sm">{{ selectedDeduction.description }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Amount:</span>
            <span class="text-sm">
              ₱
              {{
                Number(selectedDeduction.amount).toLocaleString('en-PH', {
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
