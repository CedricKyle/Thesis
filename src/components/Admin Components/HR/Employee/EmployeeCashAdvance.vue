<script setup>
import { ref } from 'vue'
import BaseTable from '@/components/common/BaseTable.vue'
import { useToast } from '@/composables/Admin Composables/Human Resource/useToast'

// Add toast
const { showToast, toastMessage, toastType, showToastMessage } = useToast()

// Table columns
const columns = [
  { title: 'Date', field: 'date', sorter: 'date', hozAlign: 'left' },
  { title: 'Name', field: 'name', sorter: 'string' },
  { title: 'Department', field: 'department', sorter: 'string' },
  {
    title: 'Amount',
    field: 'amount',
    sorter: 'number',
    hozAlign: 'right',
    formatter: (cell) =>
      `₱ ${Number(cell.getValue()).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  },
  {
    title: 'Status',
    field: 'status',
    hozAlign: 'center',
    formatter: (cell) => {
      const status = cell.getValue()
      const badgeClasses = {
        Pending: 'badge badge-outline badge-warning text-xs',
        Approved: 'badge badge-outline badge-success text-xs',
        Rejected: 'badge badge-outline badge-error text-xs',
        'For Review': 'badge badge-outline badge-info text-xs',
      }
      return `<span class="${badgeClasses[status] || 'badge badge-outline badge-neutral text-xs'}">${status}</span>`
    },
  },
  {
    title: 'Remarks',
    field: 'remarks',
    sorter: 'string',
    hozAlign: 'center',
    width: 150,
  },
  {
    title: 'Actions',
    field: 'actions',
    formatter: (cell) => {
      const row = cell.getRow().getData()
      return `
        <div class="flex gap-2">
          <button class="btn btn-sm btn-circle hover:bg-primaryColor/80 border-none btn-ghost view-button" title="View">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
          ${
            row.status === 'Pending'
              ? `
            <button class="btn btn-sm btn-circle hover:bg-green-500 border-none btn-ghost approve-button" title="Approve">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </button>
            <button class="btn btn-sm btn-circle hover:bg-red-400 border-none btn-ghost reject-button" title="Reject">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          `
              : ''
          }
        </div>
      `
    },
    headerSort: false,
    hozAlign: 'center',
    width: 150,
    cellClick: (e, cell) => {
      const row = cell.getRow().getData()
      if (e.target.closest('.view-button')) {
        openViewModal(row)
      } else if (e.target.closest('.approve-button')) {
        openApproveModal(row)
      } else if (e.target.closest('.reject-button')) {
        openRejectModal(row)
      }
    },
  },
]

// Example data with status
const advances = ref([
  {
    date: '2024-06-01',
    name: 'Juan Dela Cruz',
    department: 'IT',
    amount: 1500.0,
    remarks: 'For family emergency',
    status: 'Pending', // New field
  },
  {
    date: '2024-06-03',
    name: 'Maria Santos',
    department: 'HR',
    amount: 2000.0,
    remarks: 'Medical assistance',
    status: 'Approved',
  },
  {
    date: '2024-06-05',
    name: 'Pedro Reyes',
    department: 'Finance',
    amount: 1000.0,
    remarks: 'Tuition fee',
    status: 'Rejected',
  },
])

// Modal logic
const createModal = ref(null)
const viewModal = ref(null)
const newAdvance = ref({
  date: '',
  name: '',
  department: '',
  amount: '',
  remarks: '',
})
const selectedAdvance = ref(null)
const approveModal = ref(null)
const rejectModal = ref(null)
const rejectRemarks = ref('')

const openCreateModal = () => {
  newAdvance.value = { date: '', name: '', department: '', amount: '', remarks: '' }
  createModal.value?.showModal()
}

const closeCreateModal = () => {
  createModal.value?.close()
}

const addAdvance = () => {
  if (
    newAdvance.value.date &&
    newAdvance.value.name &&
    newAdvance.value.department &&
    newAdvance.value.amount
  ) {
    advances.value.push({ ...newAdvance.value })
    closeCreateModal()
  }
}

function openViewModal(advance) {
  selectedAdvance.value = advance
  viewModal.value?.showModal()
}

function closeViewModal() {
  viewModal.value?.close()
}

function openApproveModal(advance) {
  selectedAdvance.value = advance
  approveModal.value?.showModal()
}

function openRejectModal(advance) {
  selectedAdvance.value = advance
  rejectModal.value?.showModal()
}

function approveAdvance() {
  if (selectedAdvance.value) {
    selectedAdvance.value.status = 'Approved'
    showToastMessage('Cash advance request approved successfully!', 'success')
    approveModal.value?.close()
  }
}

function rejectAdvance() {
  if (selectedAdvance.value) {
    selectedAdvance.value.status = 'Rejected'
    selectedAdvance.value.remarks = rejectRemarks.value
    showToastMessage('Cash advance request rejected!', 'error')
    rejectModal.value?.close()
    rejectRemarks.value = ''
  }
}
</script>

<template>
  <div class="flex flex-col mt-4">
    <!-- Header and Create Button -->
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold text-black">Employee Cash Advance</h2>
      <button class="btn-primaryStyle" @click="openCreateModal">Request Cash Advance</button>
    </div>

    <!-- Table -->
    <BaseTable :columns="columns" :data="advances" :showExport="false" />
    <div class="flex justify-end gap-2 mt-4">
      <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
      <span class="text-sm cursor-pointer hover:text-gray-500 text-black"
        >Show Archived Cash Advances</span
      >
    </div>

    <!-- Create Cash Advance Modal -->
    <dialog ref="createModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-md text-black">Add Cash Advance</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>
        <form @submit.prevent="addAdvance" class="flex flex-col gap-4 mt-2">
          <div>
            <label class="block text-sm text-black mb-1">Date</label>
            <input v-model="newAdvance.date" type="date" class="input-search" required />
          </div>
          <div>
            <label class="block text-sm text-black mb-1">Name</label>
            <input v-model="newAdvance.name" type="text" class="input-search" required />
          </div>
          <div>
            <label class="block text-sm text-black mb-1">Department</label>
            <input v-model="newAdvance.department" type="text" class="input-search" required />
          </div>
          <div>
            <label class="block text-sm text-black mb-1">Amount</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 transform -translate-y-1/2 !text-gray-900"
                >₱</span
              >
              <input
                v-model="newAdvance.amount"
                type="number"
                min="0"
                step="0.01"
                class="input-search pl-7"
                placeholder="0.00"
                required
              />
            </div>
          </div>
          <div>
            <label class="block text-sm text-black mb-1">Remarks</label>
            <textarea
              v-model="newAdvance.remarks"
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

    <!-- View Cash Advance Modal (Styled like EmployeeList) -->
    <dialog ref="viewModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-md text-black">Cash Advance Details</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>
        <div v-if="selectedAdvance" class="flex flex-col gap-2 mt-2 text-black">
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Date:</span>
            <span class="text-sm">{{ selectedAdvance.date }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Name:</span>
            <span class="text-sm">{{ selectedAdvance.name }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Department:</span>
            <span class="text-sm">{{ selectedAdvance.department }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Amount:</span>
            <span class="text-sm">
              ₱
              {{
                Number(selectedAdvance.amount).toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Remarks:</span>
            <span class="text-right whitespace-pre-line break-words max-w-[180px]">
              {{ selectedAdvance.remarks || '-' }}
            </span>
          </div>
        </div>
        <div class="modal-action justify-end gap-4 mt-5">
          <button type="button" class="btn-secondaryStyle" @click="closeViewModal">Close</button>
        </div>
      </div>
    </dialog>

    <!-- Approve Modal -->
    <dialog ref="approveModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-md text-black">Approve Cash Advance</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>
        <p class="py-4 text-center text-black text-sm">
          Are you sure you want to approve this cash advance request for
          <span class="font-bold">{{ selectedAdvance?.name }}</span
          >?
        </p>
        <div class="modal-action justify-center gap-4">
          <button class="btn-primaryStyle" @click="approveAdvance">Approve</button>
          <button class="btn-secondaryStyle" @click="approveModal?.close()">Cancel</button>
        </div>
      </div>
    </dialog>

    <!-- Reject Modal -->
    <dialog ref="rejectModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-md text-black">Reject Cash Advance</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>
        <div class="py-4">
          <label class="block text-sm text-black mb-1">Rejection Remarks</label>
          <textarea
            v-model="rejectRemarks"
            class="input-search w-full"
            rows="3"
            placeholder="Enter reason for rejection..."
            required
          ></textarea>
        </div>
        <div class="modal-action justify-center gap-4">
          <button class="btn-errorStyle" @click="rejectAdvance">Reject</button>
          <button class="btn-secondaryStyle" @click="rejectModal?.close()">Cancel</button>
        </div>
      </div>
    </dialog>

    <!-- Toast Notification -->
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
</style>
