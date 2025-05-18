<script setup>
import BaseTable from '@/components/common/BaseTable.vue'
import Toast from '@/components/Admin Components/HR/Toast.vue'
import { ref, computed, onMounted, watch } from 'vue'
import { useSCMRequestStore } from '@/stores/SCM Stores/scmRequestStore'
import { useAuthStore } from '@/stores/Authentication/authStore'
import CashReleaseReceiptModal from '@/components/Finance Components/Treasury Components/CashReleaseRecieptModal.vue'

const columns = [
  { title: 'Request ID', field: 'request_id' },
  { title: 'Description', field: 'description' },
  {
    title: 'Request Date',
    field: 'request_date',
    formatter: (cell) => {
      const value = cell.getValue()
      if (!value) return ''
      const date = new Date(value)
      // Example: "May 14, 2025, 09:18 PM"
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    },
  },
  {
    title: 'Request Status',
    field: 'request_status',
    formatter: (cell) => {
      const status = cell.getValue()
      const badgeClasses = {
        Pending: 'badge badge-outline badge-warning text-xs badge-sm',
        Approved: 'badge badge-outline badge-success text-xs badge-sm',
        Rejected: 'badge badge-outline badge-error text-xs badge-sm',
        Cancelled: 'badge badge-outline badge-neutral text-xs badge-sm',
      }
      return `<span class="${badgeClasses[status] || 'badge badge-outline badge-neutral text-xs badge-sm'}">${status}</span>`
    },
  },
  {
    title: 'Receipt',
    field: 'receipt',
    headerSort: false,
    formatter: function (cell) {
      const record = cell.getRow().getData()
      // Show "View Receipt" if released, else "No Receipt"
      if (record.payment_status === 'Released') {
        return `<button class="underline text-blue-600 text-xs cursor-pointer view-receipt-button">View Receipt</button>`
      }
      return `<span class="text-gray-400 text-xs text-center">No Receipt</span>`
    },
    cellClick: function (e, cell) {
      const record = cell.getRow().getData()
      if (e.target.closest('.view-receipt-button')) {
        handleViewReceipt(record)
      }
    },
    hozAlign: 'center',
    width: 120,
  },
  {
    title: 'Action',
    headerSort: false,
    formatter: function (cell) {
      const record = cell.getRow().getData()
      // Archived: show restore button only
      if (record.deleted_at) {
        return `
        <div class="flex gap-2">
            <button class="btn btn-xs btn-circle btn-ghost restoreRequest-button border-none hover:bg-green-400/80" title="Restore Request">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 14l-4-4 4-4"/>
                <path d="M5 10h11a4 4 0 1 1 0 8h-1"/>
              </svg>
            </button>
          </div>
        `
      }

      // Action buttons per status
      let actions = []

      // Always show view
      actions.push(`
        <button class="btn btn-xs btn-circle btn-ghost view-button border-none hover:bg-primaryColor/80" title="View">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
      `)

      if (record.request_status === 'Pending' || record.request_status === 'Rejected') {
        // Show edit, cancel, submit to finance
        actions.push(`
          <button class="btn btn-xs btn-circle btn-ghost edit-button border-none hover:bg-primaryColor/80" title="Edit">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button class="btn btn-xs btn-circle btn-ghost cancelRequest-button border-none hover:bg-red-400/80" title="Cancel Request">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
          <button class="btn btn-xs btn-circle btn-ghost submitFinance-button border-none hover:bg-blue-400/80" title="Submit to Finance">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12l14-7-7 14-2-5-5-2z"/>
            </svg>
          </button>
        `)
      }

      // For Submitted, Approved, Cancelled: view only (already added above)

      return `<div class="flex gap-2">${actions.join('')}</div>`
    },
    cellClick: function (e, cell) {
      const record = cell.getRow().getData()
      if (record.deleted_at && e.target.closest('.restoreRequest-button')) {
        handleRestore(record)
      } else if (e.target.closest('.view-button')) {
        handleView(record)
      } else if (e.target.closest('.edit-button')) {
        handleEdit(record)
      } else if (e.target.closest('.cancelRequest-button')) {
        handleCancel(record)
      } else if (e.target.closest('.submitFinance-button')) {
        openSubmitFinanceModal(record)
      }
    },
    hozAlign: 'center',
    width: 150,
  },
]

const scmRequestStore = useSCMRequestStore()
const data = computed(() =>
  scmRequestStore.requests.filter((req) => req.payment_status !== 'Released'),
)
const authStore = useAuthStore()

// Add request modal functionality
const showAddRequestModal = ref(false)
const showConfirmModal = ref(false)
const newRequest = ref({
  item_name: '',
  quantity: '',
  product_description: '',
  unit_price: '',
  amount: '',
})

// Available units for dropdown
const unitOptions = [
  'pc',
  'set',
  'box',
  'kg',
  'g',
  'L',
  'mL',
  'pack',
  'roll',
  'bottle',
  'bundle',
  'case',
  'dozen',
  'unit',
  'ream',
]

// Add this after the unitOptions array
const supplyTypes = [
  'Food Ingredients',
  'Office Supplies',
  'Kitchen Equipment',
  'Cleaning Supplies',
  'Service Equipment',
  'Raw Materials',
  'Packaging Materials',
  'Others',
]

// Array to hold all request items
const requestItems = ref([
  {
    id: 1,
    item_name: '',
    quantity: '',
    unit: 'kg', // Default unit
    unit_price: '',
    amount: '',
    supply_type: 'Food Ingredients', // Default value
  },
])

// Computed property to calculate total amount across all items
const totalAmount = computed(() => {
  if (!requestItems.value) return '0.00'

  let sum = 0
  requestItems.value.forEach((item) => {
    if (item.amount) {
      sum += parseFloat(item.amount) || 0
    }
  })
  return sum.toFixed(2)
})

const openAddRequestModal = () => {
  showAddRequestModal.value = true
  // Reset request items array with one empty item
  requestItems.value = [
    {
      id: 1,
      item_name: '',
      quantity: '',
      unit: 'kg', // Default unit
      unit_price: '',
      amount: '',
      supply_type: 'Food Ingredients',
    },
  ]
}

const closeAddRequestModal = () => {
  showAddRequestModal.value = false
}

const addNewItem = () => {
  if (!requestItems.value) {
    requestItems.value = []
  }

  requestItems.value.push({
    id: requestItems.value.length + 1,
    item_name: '',
    quantity: '',
    unit: 'kg', // Default unit
    unit_price: '',
    amount: '',
    supply_type: 'Food Ingredients',
  })
}

const removeItem = (index) => {
  if (!requestItems.value || requestItems.value.length <= 1) return

  requestItems.value.splice(index, 1)
  // Update item numbers
  requestItems.value.forEach((item, idx) => {
    item.id = idx + 1
  })
}

const calculateAmount = (item) => {
  if (!item) return

  if (item.quantity && item.unit_price) {
    const quantity = parseFloat(item.quantity) || 0
    const unitPrice = parseFloat(item.unit_price) || 0
    item.amount = (quantity * unitPrice).toFixed(2)
  } else {
    item.amount = ''
  }
}

// --- Confirmation Modal Logic ---
const handleConfirmSubmit = async () => {
  showConfirmModal.value = false
  await submitRequest()
}

const requestDescription = ref('')

const submitRequest = async () => {
  // Validate items
  if (!requestItems.value.length) return showToast('Add at least one item.', 'error')
  for (const item of requestItems.value) {
    if (!item.item_name || !item.quantity || !item.unit_price) {
      showToast('Fill all item fields.', 'error')
      return
    }
  }

  const description = requestDescription.value

  // Get employee_id from auth store
  const preparedBy = authStore.currentUser?.employee_id || 'UNKNOWN_ID'

  try {
    await scmRequestStore.createRequest({
      description,
      requestItems: requestItems.value.map(
        ({ item_name, quantity, unit, unit_price, amount, supply_type }) => ({
          item_name,
          quantity,
          unit,
          unit_price,
          amount,
          supply_type,
        }),
      ),
      preparedBy,
    })
    closeAddRequestModal()
    requestDescription.value = ''
    showToast('Request submitted successfully!', 'success')
  } catch (err) {
    showToast(scmRequestStore.error || 'Failed to submit request', 'error')
  }
}

// Initialize component safely
const showArchived = ref(false)
const showRestoreModal = ref(false)
const restoreRequestId = ref(null)

onMounted(() => {
  scmRequestStore.fetchRequests(showArchived.value)
})

watch(showArchived, (val) => {
  scmRequestStore.fetchRequests(val)
})

const toast = ref({
  show: false,
  message: '',
  type: 'info',
  customClass: '',
})

function showToast(message, type = 'info', customClass = '') {
  toast.value = { show: true, message, type, customClass }
  setTimeout(() => {
    toast.value.show = false
  }, 2500)
}

const showViewModal = ref(false)
const selectedRequest = ref(null)

const handleView = (request) => {
  selectedRequest.value = request
  showViewModal.value = true
}

const showEditModal = ref(false)
const editRequestId = ref(null)
const editRequestItems = ref([])
const editRequestDescription = ref('')

// Open edit modal and prefill
const handleEdit = (request) => {
  if (request.request_status !== 'Pending' && request.request_status !== 'Rejected') {
    showToast('Only pending or rejected requests can be edited.', 'error')
    return
  }
  editRequestId.value = request.request_id
  editRequestDescription.value = request.description
  // Deep clone items to avoid mutating the table
  editRequestItems.value = request.requestItems.map((item) => ({ ...item }))
  showEditModal.value = true
}

// Edit modal item logic (reuse your add modal logic)
const editCalculateAmount = (item) => {
  if (!item) return
  if (item.quantity && item.unit_price) {
    const quantity = parseFloat(item.quantity) || 0
    const unitPrice = parseFloat(item.unit_price) || 0
    item.amount = (quantity * unitPrice).toFixed(2)
  } else {
    item.amount = ''
  }
}
const editAddNewItem = () => {
  editRequestItems.value.push({
    id: editRequestItems.value.length + 1,
    item_name: '',
    quantity: '',
    unit: 'kg',
    unit_price: '',
    amount: '',
  })
}
const editRemoveItem = (index) => {
  if (editRequestItems.value.length <= 1) return
  editRequestItems.value.splice(index, 1)
  editRequestItems.value.forEach((item, idx) => {
    item.id = idx + 1
  })
}

// Submit edit
const submitEditRequest = async () => {
  if (!editRequestItems.value.length) return showToast('Add at least one item.', 'error')
  for (const item of editRequestItems.value) {
    if (!item.item_name || !item.quantity || !item.unit_price) {
      showToast('Fill all item fields.', 'error')
      return
    }
  }
  try {
    await scmRequestStore.updateRequest(editRequestId.value, {
      description: editRequestDescription.value,
      requestItems: editRequestItems.value,
    })
    showEditModal.value = false
    showToast('Request updated successfully!', 'success')
  } catch (err) {
    showToast(scmRequestStore.error || 'Failed to update request', 'error')
  }
}

const showCancelModal = ref(false)
const cancelRequestId = ref(null)

const handleCancel = (request) => {
  if (request.request_status !== 'Pending' && request.request_status !== 'Rejected') {
    showToast('Only pending or rejected requests can be cancelled.', 'error')
    return
  }
  cancelRequestId.value = request.request_id
  showCancelModal.value = true
}

const confirmCancelRequest = async () => {
  if (!cancelRequestId.value) return
  try {
    await scmRequestStore.cancelRequest(cancelRequestId.value)
    showToast('Request cancelled successfully!', 'success')
  } catch (err) {
    showToast(scmRequestStore.error || 'Failed to cancel request', 'error')
  } finally {
    showCancelModal.value = false
    cancelRequestId.value = null
  }
}

const tableOptions = ref({
  // Add any necessary table options here
})

const handleRestore = (request) => {
  restoreRequestId.value = request.request_id
  showRestoreModal.value = true
}

const confirmRestoreRequest = async () => {
  if (!restoreRequestId.value) return
  try {
    await scmRequestStore.restoreRequest(restoreRequestId.value)
    showToast('Request restored successfully!', 'success')
  } catch (err) {
    showToast(scmRequestStore.error || 'Failed to restore request', 'error')
  } finally {
    showRestoreModal.value = false
    restoreRequestId.value = null
  }
}

const showSubmitFinanceModal = ref(false)
const requestToSubmitFinance = ref(null)

const openSubmitFinanceModal = (request) => {
  requestToSubmitFinance.value = request
  showSubmitFinanceModal.value = true
}

const closeSubmitFinanceModal = () => {
  showSubmitFinanceModal.value = false
  requestToSubmitFinance.value = null
}

const confirmSubmitToFinance = async () => {
  if (!requestToSubmitFinance.value) return
  try {
    await scmRequestStore.submitToFinance(requestToSubmitFinance.value.request_id)
    showToast('Request submitted to finance!', 'success')
  } catch (err) {
    showToast(scmRequestStore.error || 'Failed to submit to finance', 'error')
  } finally {
    closeSubmitFinanceModal()
  }
}

const showReceiptModal = ref(false)
const receiptData = ref(null)

function handleViewReceipt(request) {
  receiptData.value = {
    ...request,
    received_by: request.preparedBy?.full_name || request.prepared_by || 'SCM Representative',
    amount: request.total_amount,
    items: request.requestItems || request.items || [],
    prepared_by_name: request.preparedBy?.full_name || request.prepared_by || 'N/A',
    approved_by_name: request.approvedBy?.full_name || request.approved_by || 'N/A',
    processed_by: request.releasedBy?.full_name || request.released_by || 'Treasury Officer',
  }
  showReceiptModal.value = true
}

function closeReceiptModal() {
  showReceiptModal.value = false
  receiptData.value = null
}

const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1)
const yearOptions = [2023, 2024, 2025] // Adjust as needed

const selectedMonth = ref(new Date().getMonth() + 1)
const selectedYear = ref(new Date().getFullYear())

function isSameMonthYear(dateStr, month, year) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  return d.getMonth() + 1 === month && d.getFullYear() === year
}

// Released requests for history
const releasedRequests = computed(() =>
  scmRequestStore.requests.filter((req) => req.payment_status === 'Released'),
)
const filteredReleasedRequests = computed(() =>
  releasedRequests.value.filter((req) =>
    isSameMonthYear(req.released_at, selectedMonth.value, selectedYear.value),
  ),
)
const releasedHistoryPage = ref(1)
const rowsPerPage = ref(10)
const releasedHistoryTotalPages = computed(() =>
  Math.ceil(filteredReleasedRequests.value.length / rowsPerPage.value),
)
const paginatedReleasedHistory = computed(() =>
  filteredReleasedRequests.value.slice(
    (releasedHistoryPage.value - 1) * rowsPerPage.value,
    releasedHistoryPage.value * rowsPerPage.value,
  ),
)
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <input class="input-search input-sm" placeholder="Search Request" />
      <div class="flex gap-2">
        <button class="btn-primaryStyle btn-sm" @click="openAddRequestModal">+ Add Request</button>
      </div>
    </div>
    <div v-if="scmRequestStore.loading" class="text-center py-4">Loading...</div>
    <BaseTable v-else :columns="columns" :data="data" :options="tableOptions" />
    <div class="flex justify-end gap-2 mt-4">
      <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" v-model="showArchived" />
      <span class="text-sm cursor-pointer hover:text-gray-500 text-black">
        Show Archived Requests
      </span>
    </div>

    <!-- Add Request Modal -->
    <dialog :open="showAddRequestModal" class="modal">
      <div class="modal-box bg-white max-w-7xl p-6 rounded-lg shadow-lg">
        <h3 class="font-bold text-lg text-black">Add New Request</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>

        <form @submit.prevent="submitRequest" class="py-4">
          <!-- Headers -->
          <div class="grid grid-cols-15 gap-4 border border-black p-1">
            <div class="col-span-1">
              <span class="text-xs font-bold text-black">Item No.</span>
            </div>
            <div class="col-span-2">
              <span class="text-xs font-bold text-black">Type</span>
            </div>
            <div class="col-span-4">
              <span class="text-xs font-bold text-black">Item Name</span>
            </div>
            <div class="col-span-2">
              <span class="text-xs font-bold text-black">Quantity</span>
            </div>
            <div class="col-span-1">
              <span class="text-xs font-bold text-black">Unit</span>
            </div>
            <div class="col-span-2">
              <span class="text-xs font-bold text-black">Unit Price</span>
            </div>
            <div class="col-span-3">
              <span class="text-xs font-bold text-black">Amount</span>
            </div>
          </div>

          <!-- Dynamic rows for items -->
          <div
            v-for="(item, index) in requestItems"
            :key="index"
            class="grid grid-cols-15 border border-black"
          >
            <!-- Item No. -->
            <div class="form-control col-span-1 flex items-center border-r border-black p-1">
              <span class="text-sm text-black">{{ item.id }}</span>
            </div>

            <!-- Supply Type Dropdown -->
            <div class="form-control col-span-2 border-r border-black">
              <select
                v-model="item.supply_type"
                class="select select-sm text-xs text-black bg-white border-none p-1 h-full min-h-full focus:outline-none"
              >
                <option v-for="type in supplyTypes" :key="type" :value="type">
                  {{ type }}
                </option>
              </select>
            </div>

            <!-- Item Name -->
            <div class="form-control col-span-4 border-r border-black">
              <input
                type="text"
                v-model="item.item_name"
                class="input-search input-sm text-black border-none p-1"
                placeholder="Enter item name"
                required
              />
            </div>

            <!-- Quantity -->
            <div class="form-control col-span-2 border-r border-black">
              <input
                type="number"
                v-model="item.quantity"
                @input="calculateAmount(item)"
                class="input-search input-sm text-black border-none p-1"
                placeholder="Enter quantity"
                min="1"
                required
              />
            </div>

            <!-- Unit Dropdown -->
            <div class="form-control col-span-1 border-r border-black p-1">
              <select
                v-model="item.unit"
                class="select select-sm text-xs text-black bg-white border-none p-0 h-6 min-h-6 focus:outline-none"
              >
                <option v-for="unit in unitOptions" :key="unit" :value="unit">
                  {{ unit }}
                </option>
              </select>
            </div>

            <!-- Unit Price -->
            <div class="form-control col-span-2 border-r border-black">
              <input
                type="number"
                v-model="item.unit_price"
                @input="calculateAmount(item)"
                class="input-search input-sm text-black border-none p-1"
                placeholder="Enter unit price"
                min="0"
                step="0.01"
                required
              />
            </div>

            <!-- Amount (auto-calculated) -->
            <div class="form-control col-span-2 border-r border-black">
              <input
                type="text"
                v-model="item.amount"
                class="input-search input-sm text-black border-none"
                placeholder="0.00"
                readonly
              />
            </div>

            <!-- Remove button -->
            <div class="form-control flex items-center justify-end">
              <button
                type="button"
                @click="removeItem(index)"
                class="btn btn-xs btn-circle btn-ghost hover:bg-red-400 hover:border-none"
                :disabled="requestItems.value && requestItems.value.length <= 1"
              >
                <svg
                  class="h-4 w-4 text-red-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Total Amount -->
          <div class="flex justify-end items-center mt-4 border-t pt-3">
            <div class="grid grid-cols-12 gap-4 w-full">
              <div class="col-span-9 flex justify-end items-center">
                <span class="text-xs font-bold text-black">Total Amount:</span>
              </div>
              <div class="col-span-3">
                <div class="bg-gray-100 rounded px-3 py-1 text-right">
                  <span class="text-xs font-bold text-black">₱ {{ totalAmount }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Add Item Button -->
          <div class="flex mt-4 justify-end">
            <button type="button" class="btn-primaryStyle btn-sm" @click="addNewItem">
              + Add more item
            </button>
          </div>

          <div class="w-full mt-4 border border-black grid grid-cols-2">
            <div class="px-1 border border-black">
              <span class="text-xs font-bold text-black">Prepared by: </span>
              <span class="text-xs text-black">{{
                authStore.currentUser?.full_name || 'Unknown User'
              }}</span>
            </div>
            <div class="px-1 border border-black">
              <span class="text-xs font-bold text-black">Approved by: </span>
            </div>
            <div class="col-span-2 px-1 border border-black">
              <span class="text-xs font-bold text-black">Request Description:</span>
              <input
                type="text"
                v-model="requestDescription"
                class="input-search input-sm w-[80%] bg-white border border-white p-1"
              />
            </div>
          </div>

          <div class="modal-action justify-end gap-4 mt-6">
            <button type="button" class="btn-secondaryStyle" @click="closeAddRequestModal">
              Cancel
            </button>
            <button type="button" class="btn-primaryStyle" @click="showConfirmModal = true">
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </dialog>

    <!-- Confirmation Modal -->
    <dialog :open="showConfirmModal" class="modal">
      <div class="modal-box bg-white max-w-md p-6 rounded-lg shadow-lg">
        <h3 class="font-bold text-lg text-black mb-2">Confirm Submission</h3>
        <p class="text-black mb-4">Are you sure you want to submit this request?</p>
        <div class="flex justify-end gap-4">
          <button type="button" class="btn-secondaryStyle" @click="showConfirmModal = false">
            Cancel
          </button>
          <button type="button" class="btn-primaryStyle" @click="handleConfirmSubmit">
            Yes, Submit
          </button>
        </div>
      </div>
    </dialog>

    <Toast
      :show="toast.show"
      :message="toast.message"
      :type="toast.type"
      :customClass="toast.customClass"
    />

    <dialog :open="showViewModal" class="modal">
      <div class="modal-box bg-white max-w-2xl p-6 rounded-lg shadow-lg">
        <h3 class="font-bold text-lg text-black mb-2">Request Details</h3>
        <div v-if="selectedRequest" class="text-black">
          <div class="mb-2 text-sm flex justify-between">
            <b>Request ID:</b> {{ selectedRequest.request_id }}
          </div>
          <div class="mb-2 text-sm flex justify-between">
            <b>Description:</b> {{ selectedRequest.description }}
          </div>
          <div class="mb-2 text-sm flex justify-between">
            <b>Date:</b> {{ new Date(selectedRequest.request_date).toLocaleString() }}
          </div>
          <div class="mb-2 text-sm flex justify-between">
            <b>Status:</b> {{ selectedRequest.request_status }}
          </div>
          <div class="mb-2 text-sm flex justify-between">
            <b>Prepared by:</b>
            {{
              selectedRequest.preparedBy?.full_name || selectedRequest.prepared_by || 'Unknown User'
            }}
          </div>
          <div class="mb-2 text-sm flex justify-between">
            <b>Approved by:</b>
            {{ selectedRequest.approvedBy?.full_name || selectedRequest.approved_by || 'N/A' }}
          </div>
          <div class="mb-2 text-sm flex justify-between">
            <b>Total Amount:</b> ₱{{ selectedRequest.total_amount }}
          </div>
          <div class="mb-2 text-sm">
            <b>Items:</b>
            <table class="w-full text-xs border border-gray-300 mt-2">
              <thead class="bg-primaryColor text-white">
                <tr>
                  <th class="border px-2 py-1">#</th>
                  <th class="border px-2 py-1">Type</th>
                  <th class="border px-2 py-1">Item Name</th>
                  <th class="border px-2 py-1">Qty</th>
                  <th class="border px-2 py-1">Unit</th>
                  <th class="border px-2 py-1">Unit Price</th>
                  <th class="border px-2 py-1">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in selectedRequest.requestItems" :key="item.id">
                  <td class="border px-2 py-1">{{ idx + 1 }}</td>
                  <td class="border px-2 py-1">{{ item.supply_type || '-' }}</td>
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
        <div class="flex justify-end mt-4">
          <button class="btn-primaryStyle" @click="showViewModal = false">Close</button>
        </div>
      </div>
    </dialog>

    <!-- Edit Request Modal -->
    <dialog :open="showEditModal" class="modal">
      <div class="modal-box bg-white max-w-2xl p-6 rounded-lg shadow-lg">
        <h3 class="font-bold text-lg text-black mb-2">Edit Request</h3>
        <form @submit.prevent="submitEditRequest">
          <div class="mb-2">
            <span class="text-xs font-bold text-black">Request Description:</span>
            <input
              type="text"
              v-model="editRequestDescription"
              class="input-search input-sm w-full bg-white border border-white p-1"
            />
          </div>
          <div class="mb-2">
            <span class="text-xs font-bold text-black">Items:</span>
            <div
              v-for="(item, index) in editRequestItems"
              :key="index"
              class="grid grid-cols-13 border border-black mb-1"
            >
              <div class="col-span-1 flex items-center border-r border-black p-1">
                <span class="text-sm text-black">{{ index + 1 }}</span>
              </div>
              <div class="col-span-3 border-r border-black">
                <input
                  type="text"
                  v-model="item.item_name"
                  class="input-search input-sm text-black border-none p-1"
                  placeholder="Item name"
                  required
                />
              </div>
              <div class="col-span-2 border-r border-black">
                <input
                  type="number"
                  v-model="item.quantity"
                  @input="editCalculateAmount(item)"
                  class="input-search input-sm text-black border-none p-1"
                  placeholder="Qty"
                  min="1"
                  required
                />
              </div>
              <div class="col-span-1 border-r border-black p-1">
                <select
                  v-model="item.unit"
                  class="select select-sm text-xs text-black bg-white border-none p-0 h-6 min-h-6 focus:outline-none"
                >
                  <option v-for="unit in unitOptions" :key="unit" :value="unit">{{ unit }}</option>
                </select>
              </div>
              <div class="col-span-3 border-r border-black">
                <input
                  type="number"
                  v-model="item.unit_price"
                  @input="editCalculateAmount(item)"
                  class="input-search input-sm text-black border-none p-1"
                  placeholder="Unit price"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div class="col-span-2 border-r border-black">
                <input
                  type="text"
                  v-model="item.amount"
                  class="input-search input-sm text-black border-none"
                  placeholder="0.00"
                  readonly
                />
              </div>
              <div class="flex items-center justify-end">
                <button
                  type="button"
                  @click="editRemoveItem(index)"
                  class="btn btn-xs btn-circle btn-ghost hover:bg-red-400 hover:border-none"
                  :disabled="editRequestItems.length <= 1"
                >
                  <svg
                    class="h-4 w-4 text-red-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <button type="button" class="btn-primaryStyle btn-sm mt-2" @click="editAddNewItem">
            + Add more item
          </button>
          <div class="flex justify-end gap-4 mt-6">
            <button type="button" class="btn-secondaryStyle" @click="showEditModal = false">
              Cancel
            </button>
            <button type="submit" class="btn-primaryStyle">Save Changes</button>
          </div>
        </form>
      </div>
    </dialog>

    <dialog :open="showCancelModal" class="modal">
      <div class="modal-box bg-white max-w-md p-6 rounded-lg shadow-lg">
        <h3 class="font-bold text-lg text-black mb-2">Cancel Request</h3>
        <p class="text-black mb-4">Are you sure you want to cancel this request?</p>
        <div class="flex justify-end gap-4">
          <button type="button" class="btn-secondaryStyle" @click="showCancelModal = false">
            No, Keep
          </button>
          <button
            type="button"
            class="btn-errorStyle"
            @click="confirmCancelRequest"
            :disabled="scmRequestStore.loading"
          >
            Yes, Cancel
          </button>
        </div>
      </div>
    </dialog>

    <dialog :open="showRestoreModal" class="modal">
      <div class="modal-box bg-white max-w-md p-6 rounded-lg shadow-lg">
        <h3 class="font-bold text-lg text-black mb-2">Restore Request</h3>
        <p class="text-black mb-4">Are you sure you want to restore this request?</p>
        <div class="flex justify-end gap-4">
          <button type="button" class="btn-secondaryStyle" @click="showRestoreModal = false">
            No, Keep Archived
          </button>
          <button
            type="button"
            class="btn-primaryStyle"
            @click="confirmRestoreRequest"
            :disabled="scmRequestStore.loading"
          >
            Yes, Restore
          </button>
        </div>
      </div>
    </dialog>

    <dialog :open="showSubmitFinanceModal" class="modal">
      <div class="modal-box bg-white max-w-md p-6 rounded-lg shadow-lg">
        <h3 class="font-bold text-lg text-black mb-2">Submit to Finance</h3>
        <p class="text-black mb-4">
          Are you sure you want to submit this request to finance for approval?
        </p>
        <div class="flex justify-end gap-4">
          <button type="button" class="btn-secondaryStyle" @click="closeSubmitFinanceModal">
            Cancel
          </button>
          <button
            type="button"
            class="btn-primaryStyle"
            @click="confirmSubmitToFinance"
            :disabled="scmRequestStore.loading"
          >
            Yes, Submit
          </button>
        </div>
      </div>
    </dialog>

    <CashReleaseReceiptModal
      :show="showReceiptModal"
      :receipt="receiptData"
      :onClose="closeReceiptModal"
    />

    <!-- Released Request History -->
    <div class="mt-8 text-black">
      <div class="flex justify-between mb-2">
        <h3 class="font-semibold text-black">Released Request History</h3>
        <div class="flex gap-2">
          <select
            v-model="selectedMonth"
            class="select bg-white border border-black text-black select-sm cursor-pointer"
          >
            <option v-for="m in monthOptions" :key="m" :value="m">
              {{ new Date(0, m - 1).toLocaleString('default', { month: 'long' }) }}
            </option>
          </select>
          <select
            v-model="selectedYear"
            class="select bg-white border border-black text-black select-sm cursor-pointer"
          >
            <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="table text-black w-full text-xs border border-gray-300 rounded-md bg-white">
          <thead class="text-black text-xs">
            <tr>
              <th>No.</th>
              <th>Request ID</th>
              <th>Description</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Prepared By</th>
              <th>Approved By</th>
              <th>Released By</th>
              <th>Released At</th>
              <th>Receipt</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(req, idx) in paginatedReleasedHistory" :key="req.request_id">
              <td>{{ (releasedHistoryPage - 1) * rowsPerPage + idx + 1 }}</td>
              <td>{{ req.request_id }}</td>
              <td>{{ req.description }}</td>
              <td>{{ new Date(req.request_date).toLocaleString() }}</td>
              <td>
                ₱{{
                  Number(req.total_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })
                }}
              </td>
              <td>{{ req.preparedBy?.full_name || req.prepared_by }}</td>
              <td>{{ req.approvedBy?.full_name || req.approved_by || '-' }}</td>
              <td>{{ req.releasedBy?.full_name || req.released_by || '-' }}</td>
              <td>
                {{ req.released_at ? new Date(req.released_at).toLocaleString() : '-' }}
              </td>
              <td>
                <a
                  v-if="req.payment_status === 'Released'"
                  href="javascript:void(0)"
                  class="text-blue-600 underline"
                  @click="handleViewReceipt(req)"
                >
                  View Receipt
                </a>
                <span v-else class="text-gray-400">No Receipt</span>
              </td>
            </tr>
            <tr v-if="!paginatedReleasedHistory.length">
              <td colspan="10" class="text-center py-4 text-gray-500">
                No released request history found for this month.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Pagination -->
      <div class="flex items-center gap-2 mt-4">
        <span class="text-black text-xs">Page</span>
        <select
          class="select !bg-white !border-black !text-black select-xs w-16"
          v-model="releasedHistoryPage"
          :disabled="releasedHistoryTotalPages <= 1"
          @change="() => $nextTick(() => window.scrollTo(0, 0))"
        >
          <option v-for="page in releasedHistoryTotalPages" :key="page" :value="page">
            {{ page }}
          </option>
        </select>
        <span class="text-black text-xs">of {{ releasedHistoryTotalPages }}</span>
      </div>
    </div>
  </div>
</template>
