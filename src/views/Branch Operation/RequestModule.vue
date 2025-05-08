<script setup>
import { ref, onMounted, computed } from 'vue'
import BaseTable from '@/components/common/BaseTable.vue'
import Toast from '@/components/Admin Components/HR/Toast.vue'
import { useRequestStore } from '@/stores/Branch Operation & Department Stores/requestStore'
import { useAuthStore } from '@/stores/Authentication/authStore'

const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')
const showRequestModal = ref(false)
const showViewModal = ref(false)
const showEditModal = ref(false)
const selectedRequest = ref({})
const editRequest = ref({})
const showConfirmModal = ref(false)
const showDeleteModal = ref(false)
const requestToDelete = ref(null)
const showResubmitModal = ref(false)
const requestToResubmit = ref(null)
const confirmAction = ref(null)
const actionRequest = ref(null)

const requestStore = useRequestStore()
const authStore = useAuthStore()

// Load requests on component mount
onMounted(async () => {
  try {
    await authStore.checkAuth()
    await requestStore.loadRequests()
  } catch (error) {
    console.error('Error loading data:', error)
  }
})

const requests = computed(() => requestStore.paginatedRequests)

const loading = computed(() => requestStore.loading)

const newRequest = ref({
  item: '',
  quantity: 1,
  remarks: '',
})

const columns = [
  { title: 'Request ID', field: 'id', sorter: 'number', width: 100 },
  { title: 'Item', field: 'item', sorter: 'string' },
  { title: 'Quantity', field: 'quantity', sorter: 'number' },
  {
    title: 'Date Requested',
    field: 'date_requested',
    sorter: 'date',
    formatter: function (cell) {
      const value = cell.getValue()
      if (!value) return ''
      // Format as YYYY-MM-DD
      return value.split('T')[0]
    },
  },
  {
    title: 'Status',
    field: 'status',
    formatter: function (cell) {
      const status = cell.getValue()
      if (status === 'Approved') {
        return `<span class="badge badge-outline badge-success h-5 text-xs">Approved</span>`
      } else if (status === 'Rejected') {
        return `<span class="badge badge-outline badge-error h-5 text-xs">Rejected</span>`
      } else {
        return `<span class="badge badge-outline badge-warning h-5 text-xs">Pending</span>`
      }
    },
    sorter: 'string',
    width: 120,
  },
  {
    title: 'Actions',
    field: 'actions',
    formatter: (cell) => {
      const data = cell.getRow().getData()
      const lockedStatuses = [
        'Approved by SCM',
        'Forwarded to Finance',
        'Approved by Finance',
        'Forwarded to Procurement',
        'Procurement Processing',
        'Received by Procurement',
        'Transferred to SCM',
        'Ready for Release to Requestor',
        'Released to Requestor',
        'Completed',
        'Cancelled',
      ]
      const resubmittableStatuses = [
        'Rejected by SCM',
        'Rejected by Finance',
        'Returned to Requestor',
        'On Hold (No Supplier)',
        'On Hold (No Stock)',
      ]
      const isLocked = lockedStatuses.includes(data.status)
      const isResubmittable = resubmittableStatuses.includes(data.status)
      return `
        <div class="flex gap-2">
          <button class="btn btn-sm btn-circle hover:bg-primaryColor/80 border-none btn-ghost view-button" title="View">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
          <button class="btn btn-sm btn-circle hover:bg-primaryColor/80 border-none btn-ghost edit-button" title="Edit" ${isLocked ? 'disabled' : ''}>
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button class="btn btn-sm btn-circle hover:bg-red-400 border-none btn-ghost delete-button" title="Delete" ${isLocked ? 'disabled' : ''}>
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
          ${
            isResubmittable
              ? `
            <button class="btn btn-sm btn-circle hover:bg-green-400 border-none btn-ghost resubmit-button" title="Resubmit">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M12 19V6M5 12l7-7 7 7"/>
              </svg>
            </button>
          `
              : ''
          }
        </div>
      `
    },
    cellClick: (e, cell) => {
      const record = cell.getRow().getData()
      if (e.target.closest('.view-button')) {
        openViewModal(record)
      } else if (e.target.closest('.edit-button') && record.status !== 'Approved') {
        openEditModal(record)
      } else if (e.target.closest('.delete-button') && record.status !== 'Approved') {
        openDeleteModal(record)
      } else if (e.target.closest('.resubmit-button') && record.status === 'Rejected') {
        openResubmitModal(record)
      }
    },
    headerSort: false,
    width: 200,
  },
]

const openRequestModal = () => {
  showRequestModal.value = true
}
const closeRequestModal = () => {
  showRequestModal.value = false
}

const submitRequest = async () => {
  try {
    console.log('Current User:', authStore.currentUser) // DEBUG
    console.log('User details:', {
      employee_id: authStore.currentUser.employee_id,
      department: authStore.currentUser.department,
      branch_id: authStore.currentUser.branch_id,
    })

    const requestData = {
      item: newRequest.value.item,
      quantity: newRequest.value.quantity,
      remarks: newRequest.value.remarks,
      requested_by: authStore.currentUser.employee_id,
      requestor_name: authStore.currentUser.full_name,
      department: authStore.currentUser.department,
      branch_id:
        authStore.currentUser.department === 'Branch Operation'
          ? authStore.currentUser.branch_id
          : null,
    }

    console.log('Sending request data:', requestData)

    await requestStore.createRequest(requestData)
    showConfirmModal.value = false
    showRequestModal.value = false
    newRequest.value = { item: '', quantity: 1, remarks: '' }
    showToastMessage('Request submitted successfully!', 'success')
  } catch (error) {
    handleError(error.message)
  }
}

const openViewModal = (request) => {
  selectedRequest.value = request
  showViewModal.value = true
}

const closeViewModal = () => {
  showViewModal.value = false
}

const openEditModal = (request) => {
  if (request.status === 'Approved') {
    showToastMessage('Cannot edit an approved request!', 'error')
    return
  }
  editRequest.value = { ...request }
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
}

const saveEditRequest = async () => {
  try {
    await requestStore.updateRequest(editRequest.value.id, editRequest.value)
    closeEditModal()
    showToastMessage('Request updated!', 'success')
  } catch (error) {
    handleError(error.message)
  }
}

const openDeleteModal = (request) => {
  if (request.status === 'Approved') {
    showToastMessage('Cannot delete an approved request!', 'error')
    return
  }
  requestToDelete.value = request
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  requestToDelete.value = null
}

const confirmDeleteRequest = async () => {
  try {
    await requestStore.deleteRequest(requestToDelete.value.id)
    showDeleteModal.value = false
    showToastMessage('Request deleted successfully!', 'success')
  } catch (error) {
    handleError(error.message)
  }
}

const openResubmitModal = (request) => {
  requestToResubmit.value = request
  showResubmitModal.value = true
}

const closeResubmitModal = () => {
  showResubmitModal.value = false
  requestToResubmit.value = null
}

const confirmResubmitRequest = async () => {
  try {
    await requestStore.updateRequest(requestToResubmit.value.id, {
      ...requestToResubmit.value,
      status: 'Pending',
    })
    showResubmitModal.value = false
    showToastMessage('Request resubmitted for approval!', 'success')
  } catch (error) {
    handleError(error.message)
  }
}

// Example: On error
function handleError(errorMsg) {
  showToastMessage(errorMsg, 'error')
}

function showToastMessage(message, type = 'success', duration = 2500) {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, duration)
}

const rejectRequest = async (request) => {
  await requestStore.updateRequest(request.id, {
    status: 'Rejected',
    requestor_rejection_remarks: request.requestor_rejection_remarks || '',
  })
  showToastMessage('Request rejected!', 'error')
}

async function handleConfirm() {
  if (!confirmAction.value || !actionRequest.value) return
  if (confirmAction.value === 'reject') {
    await rejectRequest(actionRequest.value)
  }
  // ...other actions
  showConfirmModal.value = false
  confirmAction.value = null
  actionRequest.value = null
}

const statusHistory = computed(() => {
  try {
    return selectedRequest.value.status_history
      ? JSON.parse(selectedRequest.value.status_history)
      : []
  } catch {
    return []
  }
})

const statusHistoryPage = ref(1)
const statusHistoryRowsPerPage = 5

const paginatedStatusHistory = computed(() => {
  const start = (statusHistoryPage.value - 1) * statusHistoryRowsPerPage
  return statusHistory.value.slice(start, start + statusHistoryRowsPerPage)
})

const statusHistoryTotalPages = computed(() =>
  Math.max(1, Math.ceil(statusHistory.value.length / statusHistoryRowsPerPage)),
)
</script>

<template>
  <div class="container bg-white rounded-md p-5 text-black">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-semibold">Request Management</h1>
      <button class="btn-primaryStyle bg-primaryColor text-white" @click="openRequestModal">
        + Create Request
      </button>
    </div>
    <BaseTable :data="requests" :columns="columns" />

    <!-- Toast Notification -->
    <Toast :show="showToast" :message="toastMessage" :type="toastType" />

    <!-- Request Modal -->
    <dialog v-if="showRequestModal" class="modal" open>
      <div class="modal-box bg-white rounded-lg p-6 w-full max-w-2xl shadow-lg">
        <h3 class="font-bold text-lg text-black">Create Request</h3>
        <form @submit.prevent="submitRequest">
          <div class="form-control mb-2">
            <label class="label text-black text-sm">Item</label>
            <input v-model="newRequest.item" class="input-search" required />
          </div>
          <div class="form-control mb-2">
            <label class="label text-black text-sm">Quantity</label>
            <input
              v-model.number="newRequest.quantity"
              type="number"
              min="1"
              class="input-search"
              required
            />
          </div>
          <div class="form-control mb-4">
            <label class="label text-black text-sm">Remarks</label>
            <textarea
              v-model="newRequest.remarks"
              class="textarea bg-white border border-black"
              placeholder="Add remarks or justification (optional)"
              rows="3"
            ></textarea>
          </div>
          <div class="modal-action justify-center gap-4">
            <button
              type="button"
              class="btn-primaryStyle bg-primaryColor text-white"
              @click="showConfirmModal = true"
            >
              Submit
            </button>
            <button type="button" class="btn-secondaryStyle" @click="closeRequestModal">
              Close
            </button>
          </div>
        </form>
      </div>
    </dialog>

    <!-- View Request Modal -->
    <dialog v-if="showViewModal" class="modal" open>
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-lg text-black">Request Details</h3>
        <div class="flex justify-between mt-2">
          <p class="text-sm text-gray-500">Item:</p>
          <span class="text-sm"> {{ selectedRequest.item }}</span>
        </div>
        <div class="flex justify-between">
          <p class="text-sm text-gray-500">Quantity:</p>
          <span class="text-sm"> {{ selectedRequest.quantity }}</span>
        </div>
        <div class="flex justify-between">
          <p class="text-sm text-gray-500">Status:</p>
          <span class="text-sm"> {{ selectedRequest.status }}</span>
        </div>
        <div class="flex justify-between">
          <p class="text-sm text-gray-500">Date Requested:</p>
          <span class="text-sm"> {{ selectedRequest.date }}</span>
        </div>
        <div class="flex justify-between">
          <p class="text-sm text-gray-500">Remarks:</p>
          <span class="text-sm"> {{ selectedRequest.remarks || '—' }}</span>
        </div>
        <div class="flex justify-between" v-if="selectedRequest.status === 'Rejected'">
          <p class="text-sm text-gray-500">Rejection Remarks:</p>
          <span class="text-sm">{{ selectedRequest.requestor_rejection_remarks || '—' }}</span>
        </div>
        <div v-if="statusHistory.length" class="mt-4">
          <h4 class="font-semibold text-sm mb-2">Status History</h4>
          <table class="table table-xs w-full">
            <thead class="text-xs text-black">
              <tr>
                <th>Status</th>
                <th>By</th>
                <th>Date</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(entry, idx) in paginatedStatusHistory" :key="idx">
                <td>{{ entry.status }}</td>
                <td>{{ entry.by }}</td>
                <td>{{ entry.at }}</td>
                <td>{{ entry.remarks || '—' }}</td>
              </tr>
            </tbody>
          </table>
          <div class="flex items-center gap-2 mt-2">
            <span class="text-black text-xs">Page</span>
            <select
              class="select !bg-white !border-black !text-black select-xs w-16"
              v-model="statusHistoryPage"
              :disabled="statusHistoryTotalPages <= 1"
              @change="() => $nextTick(() => window.scrollTo(0, 0))"
            >
              <option v-for="page in statusHistoryTotalPages" :key="page" :value="page">
                {{ page }}
              </option>
            </select>
            <span class="text-black text-xs">of {{ statusHistoryTotalPages }}</span>
          </div>
        </div>
        <div class="modal-action justify-center gap-4">
          <button type="button" class="btn-secondaryStyle" @click="closeViewModal">Close</button>
        </div>
      </div>
    </dialog>

    <!-- Edit Request Modal -->
    <dialog v-if="showEditModal" class="modal" open>
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-lg text-black">Edit Request</h3>
        <form @submit.prevent="saveEditRequest">
          <div class="form-control mb-2">
            <label class="text-black text-sm">Item</label>
            <input v-model="editRequest.item" class="input-search" required />
          </div>
          <div class="form-control mb-2">
            <label class="text-black text-sm">Quantity</label>
            <input
              v-model.number="editRequest.quantity"
              type="number"
              min="1"
              class="input-search"
              required
            />
          </div>
          <div class="form-control mb-4">
            <label class="text-black text-sm">Remarks</label>
            <textarea
              v-model="editRequest.remarks"
              class="textarea bg-white border border-black"
              placeholder="Add remarks or justification (optional)"
              rows="3"
            ></textarea>
          </div>
          <div class="modal-action justify-center gap-4">
            <button type="submit" class="btn-primaryStyle bg-primaryColor text-white">Save</button>
            <button type="button" class="btn-secondaryStyle" @click="closeEditModal">Cancel</button>
          </div>
        </form>
      </div>
    </dialog>

    <!-- Confirmation Modal -->
    <dialog v-if="showConfirmModal" class="modal" open>
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-lg text-black">Confirm Request</h3>
        <p class="mb-4">Are you sure you want to submit this request?</p>
        <div v-if="['reject', 'return', 'hold', 'cancel'].includes(confirmAction)" class="mb-4">
          <label class="text-sm text-gray-500">Remarks:</label>
          <textarea
            v-model="actionRequest.remarks"
            class="textarea bg-white border border-black w-full"
            placeholder="State reason"
            rows="3"
            required
          ></textarea>
        </div>
        <div class="modal-action justify-center gap-4">
          <button class="btn-primaryStyle bg-primaryColor text-white" @click="submitRequest">
            Yes, Submit
          </button>
          <button class="btn-secondaryStyle" @click="showConfirmModal = false">Cancel</button>
        </div>
      </div>
    </dialog>

    <!-- Delete Request Modal -->
    <dialog v-if="showDeleteModal" class="modal" open>
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-lg text-black">Confirm Delete</h3>
        <p class="mb-4">Are you sure you want to delete this request?</p>
        <div class="modal-action justify-center gap-4">
          <button class="btn-errorStyle" @click="confirmDeleteRequest">Delete</button>
          <button class="btn-secondaryStyle" @click="closeDeleteModal">Cancel</button>
        </div>
      </div>
    </dialog>

    <!-- Resubmit Request Modal -->
    <dialog v-if="showResubmitModal" class="modal" open>
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-lg text-black">Resubmit Request</h3>
        <p class="mb-4">Are you sure you want to resubmit this request for approval?</p>
        <div class="modal-action justify-center gap-4">
          <button
            class="btn-primaryStyle bg-primaryColor text-white"
            @click="confirmResubmitRequest"
          >
            Yes, Resubmit
          </button>
          <button class="btn-secondaryStyle" @click="closeResubmitModal">Cancel</button>
        </div>
      </div>
    </dialog>
  </div>
</template>
