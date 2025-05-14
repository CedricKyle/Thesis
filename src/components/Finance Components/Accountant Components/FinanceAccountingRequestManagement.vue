<script setup>
import { ref, onMounted, computed } from 'vue'
import BaseTable from '@/components/common/BaseTable.vue'
import Toast from '@/components/Admin Components/HR/Toast.vue'
import { useFinanceRequestStore } from '@/stores/Finance Stores/financeRequestStore'

// Import store
const financeRequestStore = useFinanceRequestStore()

// Toast notifications
const toast = ref({
  show: false,
  message: '',
  type: 'success',
})

const showToast = (message, type = 'success') => {
  toast.value = {
    show: true,
    message,
    type,
  }
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

// Selected request IDs for bulk actions
const selectedIds = ref([])

// Table definition
const columns = [
  {
    title: 'Select',
    field: 'request_id',
    headerSort: false,
    formatter: function (cell) {
      const request = cell.getRow().getData()
      const disabled = request.request_status !== 'Submitted'
      return (
        '<input class="checkbox checkbox-neutral checkbox-xs" type="checkbox" ' +
        (disabled ? 'disabled' : '') +
        ' />'
      )
    },
    cellClick: function (e, cell) {
      const id = cell.getRow().getData().request_id
      const status = cell.getRow().getData().request_status
      if (status === 'Submitted') {
        toggleSelect(id)
      }
    },
    width: 70,
  },
  { title: 'Request ID', field: 'request_id' },
  { title: 'Description', field: 'description' },
  {
    title: 'Date',
    field: 'request_date',
    formatter: function (cell) {
      return new Date(cell.getValue()).toLocaleString()
    },
  },
  {
    title: 'Amount',
    field: 'total_amount',
    formatter: function (cell) {
      return '₱' + Number(cell.getValue()).toLocaleString('en-PH', { minimumFractionDigits: 2 })
    },
  },
  {
    title: 'Status',
    field: 'request_status',
    formatter: function (cell) {
      const status = cell.getValue()
      const displayStatus = status === 'Submitted' ? 'Pending' : status
      const badgeClasses = {
        Pending: 'badge badge-outline badge-warning text-xs badge-sm',
        Approved: 'badge badge-outline badge-success text-xs badge-sm',
        Rejected: 'badge badge-outline badge-error text-xs badge-sm',
        Cancelled: 'badge badge-outline badge-neutral text-xs badge-sm',
      }
      // Use the same badge style as SCM
      return `<span class="${badgeClasses[displayStatus] || 'badge badge-outline badge-neutral text-xs badge-sm'}">${displayStatus}</span>`
    },
  },
  {
    title: 'Action',
    headerSort: false,
    formatter: function (cell) {
      const record = cell.getRow().getData()
      // Always show view
      let actions = []

      actions.push(`
        <button class="btn btn-xs btn-circle btn-ghost view-button border-none hover:bg-primaryColor/80" title="View">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
      `)

      // For Submitted status only, show approve and reject buttons
      if (record.request_status === 'Submitted') {
        actions.push(`
          <button class="btn btn-xs btn-circle btn-ghost approve-button border-none hover:bg-green-400/80" title="Approve">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </button>
          <button class="btn btn-xs btn-circle btn-ghost reject-button border-none hover:bg-red-400/80" title="Reject">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        `)
      }

      return `<div class="flex gap-2">${actions.join('')}</div>`
    },
    cellClick: function (e, cell) {
      const record = cell.getRow().getData()
      if (e.target.closest('.view-button')) {
        openViewModal(record)
      } else if (e.target.closest('.approve-button')) {
        handleApprove(record)
      } else if (e.target.closest('.reject-button')) {
        handleReject(record)
      }
    },
    hozAlign: 'center',
    width: 150,
  },
]

// For tabulator
const tableOptions = {
  selectable: false, // We'll handle selection manually with checkboxes
  layout: 'fitColumns',
  pagination: true,
  paginationSize: 10,
}

// Get requests from store
const requests = computed(() => financeRequestStore.requests)

// Toggle request selection
const toggleSelect = (id) => {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter((x) => x !== id)
  } else {
    selectedIds.value.push(id)
  }
}

// Select all submitted requests
const selectAll = () => {
  if (
    selectedIds.value.length ===
    requests.value.filter((r) => r.request_status === 'Submitted').length
  ) {
    selectedIds.value = []
  } else {
    selectedIds.value = requests.value
      .filter((r) => r.request_status === 'Submitted')
      .map((r) => r.request_id)
  }
}

// Bulk approve function
const bulkApprove = async () => {
  try {
    await financeRequestStore.bulkApproveRequests(selectedIds.value)
    showToast(`Successfully approved ${selectedIds.value.length} requests!`, 'success')
    selectedIds.value = []
  } catch (error) {
    showToast(error.message || 'Failed to approve requests', 'error')
  }
}

// Bulk reject function
const bulkReject = async () => {
  try {
    await financeRequestStore.bulkRejectRequests(selectedIds.value)
    showToast(`Successfully rejected ${selectedIds.value.length} requests!`, 'error')
    selectedIds.value = []
  } catch (error) {
    showToast(error.message || 'Failed to reject requests', 'error')
  }
}

// View modal
const showViewModal = ref(false)
const selectedRequest = ref(null)

// Open view modal
const openViewModal = (request) => {
  selectedRequest.value = request
  showViewModal.value = true
}

// Close view modal
const closeViewModal = () => {
  showViewModal.value = false
  selectedRequest.value = null
}

// Individual approve action
const approveRequest = async () => {
  try {
    await financeRequestStore.approveRequest(selectedRequest.value.request_id)
    showToast('Request approved successfully!', 'success')
    closeViewModal()
  } catch (error) {
    showToast(error.message || 'Failed to approve request', 'error')
  }
}

// Individual reject action
const rejectRequest = async () => {
  try {
    await financeRequestStore.rejectRequest(selectedRequest.value.request_id)
    showToast('Request rejected successfully!', 'error')
    closeViewModal()
  } catch (error) {
    showToast(error.message || 'Failed to reject request', 'error')
  }
}

// Add these new handler functions
const handleApprove = (request) => {
  selectedRequest.value = request
  showApproveModal.value = true
}

const handleReject = (request) => {
  selectedRequest.value = request
  showRejectModal.value = true
}

// Add these new state variables
const showApproveModal = ref(false)
const showRejectModal = ref(false)

// Add confirm functions
const confirmApproveRequest = async () => {
  try {
    await financeRequestStore.approveRequest(selectedRequest.value.request_id)
    showToast('Request approved successfully!', 'success')
  } catch (error) {
    showToast(error.message || 'Failed to approve request', 'error')
  } finally {
    showApproveModal.value = false
    selectedRequest.value = null
  }
}

const confirmRejectRequest = async () => {
  try {
    await financeRequestStore.rejectRequest(selectedRequest.value.request_id)
    showToast('Request rejected successfully!', 'error')
  } catch (error) {
    showToast(error.message || 'Failed to reject request', 'error')
  } finally {
    showRejectModal.value = false
    selectedRequest.value = null
  }
}

// Load requests on component mount
onMounted(async () => {
  try {
    await financeRequestStore.fetchRequests()
  } catch (error) {
    showToast('Failed to load requests', 'error')
  }
})

const getPreparedByName = (employeeId) => {
  const emp = employees.value.find((e) => e.employee_id === employeeId)
  return emp ? emp.full_name : employeeId
}

const showBulkApproveModal = ref(false)
const showBulkRejectModal = ref(false)

const confirmBulkApprove = async () => {
  try {
    await bulkApprove()
    showBulkApproveModal.value = false
  } catch (error) {
    showBulkApproveModal.value = false
  }
}

const confirmBulkReject = async () => {
  try {
    await bulkReject()
    showBulkRejectModal.value = false
  } catch (error) {
    showBulkRejectModal.value = false
  }
}
</script>

<template>
  <div>
    <!-- Toast notification -->
    <Toast :message="toast.message" :show="toast.show" :type="toast.type" />

    <!-- Bulk Actions -->
    <div class="mb-4 flex gap-2">
      <button
        class="btn-primaryStyle btn-sm"
        :disabled="selectedIds.length === 0"
        @click="showBulkApproveModal = true"
      >
        Bulk Approve ({{ selectedIds.length }})
      </button>
      <button
        class="btn-errorStyle btn-sm"
        :disabled="selectedIds.length === 0"
        @click="showBulkRejectModal = true"
      >
        Bulk Reject ({{ selectedIds.length }})
      </button>
    </div>

    <!-- Using BaseTable component -->
    <BaseTable :columns="columns" :data="requests" :options="tableOptions" />
  </div>

  <!-- View Modal -->
  <dialog :open="showViewModal" class="modal">
    <div class="modal-box bg-white max-w-2xl p-6 rounded-lg shadow-lg">
      <h3 class="font-bold text-lg text-black mb-2">Request Details</h3>
      <div v-if="selectedRequest" class="text-sm text-black">
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="text-sm"><b>Request ID:</b> {{ selectedRequest.request_id }}</div>
          <div class="text-sm">
            <b>Status:</b>
            <span
              :class="{
                'badge badge-outline badge-warning text-xs badge-sm':
                  selectedRequest.request_status === 'Submitted',
                'badge badge-outline badge-success text-xs badge-sm':
                  selectedRequest.request_status === 'Approved',
                'badge badge-outline badge-error text-xs badge-sm':
                  selectedRequest.request_status === 'Rejected',
                'badge badge-outline badge-neutral text-xs badge-sm':
                  selectedRequest.request_status === 'Cancelled',
              }"
            >
              {{
                selectedRequest.request_status === 'Submitted'
                  ? 'Pending'
                  : selectedRequest.request_status
              }}
            </span>
          </div>
          <div class="mb-2 text-sm">
            <b>Date:</b> {{ new Date(selectedRequest.request_date).toLocaleString() }}
          </div>
          <div class="mb-2 text-sm">
            <b>Total Amount:</b> ₱{{
              selectedRequest.total_amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })
            }}
          </div>
          <div class="mb-2 text-sm col-span-2">
            <b>Description:</b> {{ selectedRequest.description }}
          </div>
          <div class="mb-2 text-sm">
            <b>Prepared by:</b>
            {{
              selectedRequest.preparedBy?.full_name || selectedRequest.prepared_by || 'Unknown User'
            }}
          </div>
        </div>

        <div class="mb-2 text-sm">
          <b>Items:</b>
          <table class="w-full text-xs border border-gray-300 mt-2">
            <thead class="bg-primaryColor text-white">
              <tr>
                <th class="border px-2 py-1">#</th>
                <th class="border px-2 py-1">Item Name</th>
                <th class="border px-2 py-1">Qty</th>
                <th class="border px-2 py-1">Unit</th>
                <th class="border px-2 py-1">Unit Price</th>
                <th class="border px-2 py-1">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in selectedRequest.requestItems" :key="item.id || idx">
                <td class="border px-2 py-1">{{ idx + 1 }}</td>
                <td class="border px-2 py-1">{{ item.item_name }}</td>
                <td class="border px-2 py-1">{{ item.quantity }}</td>
                <td class="border px-2 py-1">{{ item.unit }}</td>
                <td class="border px-2 py-1">
                  ₱{{
                    Number(item.unit_price).toLocaleString('en-PH', { minimumFractionDigits: 2 })
                  }}
                </td>
                <td class="border px-2 py-1">
                  ₱{{ Number(item.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="flex justify-end gap-4 mt-4">
        <button class="btn-secondaryStyle" @click="closeViewModal">Close</button>
        <button
          v-if="selectedRequest && selectedRequest.request_status === 'Submitted'"
          class="btn-primaryStyle"
          @click="approveRequest"
        >
          Approve
        </button>
        <button
          v-if="selectedRequest && selectedRequest.request_status === 'Submitted'"
          class="btn-errorStyle"
          @click="rejectRequest"
        >
          Reject
        </button>
      </div>
    </div>
  </dialog>

  <!-- Approve Modal -->
  <dialog :open="showApproveModal" class="modal">
    <div class="modal-box bg-white max-w-md p-6 rounded-lg shadow-lg">
      <h3 class="font-bold text-lg text-black mb-2">Approve Request</h3>
      <p class="text-black mb-4">Are you sure you want to approve this request?</p>
      <div class="flex justify-end gap-4">
        <button type="button" class="btn-secondaryStyle" @click="showApproveModal = false">
          Cancel
        </button>
        <button
          type="button"
          class="btn-primaryStyle"
          @click="confirmApproveRequest"
          :disabled="financeRequestStore.loading"
        >
          Yes, Approve
        </button>
      </div>
    </div>
  </dialog>

  <!-- Reject Modal -->
  <dialog :open="showRejectModal" class="modal">
    <div class="modal-box bg-white max-w-md p-6 rounded-lg shadow-lg">
      <h3 class="font-bold text-lg text-black mb-2">Reject Request</h3>
      <p class="text-black mb-4">Are you sure you want to reject this request?</p>
      <div class="flex justify-end gap-4">
        <button type="button" class="btn-secondaryStyle" @click="showRejectModal = false">
          Cancel
        </button>
        <button
          type="button"
          class="btn-errorStyle"
          @click="confirmRejectRequest"
          :disabled="financeRequestStore.loading"
        >
          Yes, Reject
        </button>
      </div>
    </div>
  </dialog>

  <!-- Bulk Approve Modal -->
  <dialog :open="showBulkApproveModal" class="modal">
    <div class="modal-box bg-white max-w-md p-6 rounded-lg shadow-lg">
      <h3 class="font-bold text-lg text-black mb-2">Bulk Approve Requests</h3>
      <p class="text-black mb-4">
        Are you sure you want to approve <b>{{ selectedIds.length }}</b> request(s)?
      </p>
      <div class="flex justify-end gap-4">
        <button type="button" class="btn-secondaryStyle" @click="showBulkApproveModal = false">
          Cancel
        </button>
        <button
          type="button"
          class="btn-primaryStyle"
          @click="confirmBulkApprove"
          :disabled="financeRequestStore.loading"
        >
          Yes, Approve
        </button>
      </div>
    </div>
  </dialog>

  <!-- Bulk Reject Modal -->
  <dialog :open="showBulkRejectModal" class="modal">
    <div class="modal-box bg-white max-w-md p-6 rounded-lg shadow-lg">
      <h3 class="font-bold text-lg text-black mb-2">Bulk Reject Requests</h3>
      <p class="text-black mb-4">
        Are you sure you want to reject <b>{{ selectedIds.length }}</b> request(s)?
      </p>
      <div class="flex justify-end gap-4">
        <button type="button" class="btn-secondaryStyle" @click="showBulkRejectModal = false">
          Cancel
        </button>
        <button
          type="button"
          class="btn-errorStyle"
          @click="confirmBulkReject"
          :disabled="financeRequestStore.loading"
        >
          Yes, Reject
        </button>
      </div>
    </div>
  </dialog>
</template>
