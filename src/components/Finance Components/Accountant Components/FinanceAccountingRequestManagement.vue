<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRequestStore } from '@/stores/Branch Operation & Department Stores/requestStore'
import Toast from '@/components/Admin Components/HR/Toast.vue'
import { Eye, Check, X, Send, BookX } from 'lucide-vue-next'
const selectedRequests = ref([])
const showViewModal = ref(false)
const showConfirmModal = ref(false)
const confirmAction = ref('')
const confirmRemarks = ref('')
const selectedRequest = ref(null)
const requestStore = useRequestStore()
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success') // 'success', 'error', 'info'
const returnTo = ref('SCM')
const showBulkModal = ref(false)
const bulkAction = ref('') // 'approve', 'forward', 'reject', 'hold'
const bulkRemarks = ref('')
const bulkTarget = ref('SCM') // For reject/hold: SCM, Requestor, Finance

const allSelected = computed({
  get() {
    return (
      financeRequests.value.length > 0 &&
      financeRequests.value.every((req) => selectedRequests.value.includes(req.id))
    )
  },
  set(value) {
    if (value) {
      selectedRequests.value = financeRequests.value.map((req) => req.id)
    } else {
      selectedRequests.value = []
    }
  },
})

// Example: Fetch requests on mount (replace with real store logic)
onMounted(async () => {
  await requestStore.loadRequests()
})

// Computed: Filtered requests for finance stage
const financeRequests = computed(() =>
  requestStore.filteredRequests.filter(
    (req) =>
      req.status === 'Approved by SCM' ||
      req.status === 'Forwarded to Finance' ||
      req.status === 'On Hold (Finance)' ||
      req.status === 'Rejected by Finance' ||
      req.status === 'Approved by Finance',
  ),
)

// Table columns
const columns = [
  { title: 'Request ID', field: 'id' },
  { title: 'Item', field: 'item' },
  { title: 'Qty', field: 'quantity' },
  { title: 'Requested By', field: 'requester.full_name' },
  { title: 'Branch', field: 'requester.branch_id' },
  { title: 'Department', field: 'requester.department' },
  { title: 'Date', field: 'date_requested' },
  { title: 'Status', field: 'status' },
  { title: 'Budget', field: 'budget_remaining' },
  { title: 'Actions', field: 'actions' },
]

// Action handlers (replace with real store logic)
function openViewModal(request) {
  selectedRequest.value = request
  showViewModal.value = true
}
function openConfirmModal(action, request) {
  confirmAction.value = action
  selectedRequest.value = request
  showConfirmModal.value = true
}
async function handleConfirm() {
  if (!selectedRequest.value) return
  try {
    if (confirmAction.value === 'approve') {
      await requestStore.financeApproveRequest(selectedRequest.value.id, confirmRemarks.value)
      showToastMsg('Request approved!', 'success')
    } else if (confirmAction.value === 'reject') {
      if (!confirmRemarks.value) return showToastMsg('Remarks required!', 'error')
      let status = 'Rejected by Finance'
      if (returnTo.value === 'SCM') status = 'Returned to SCM'
      else if (returnTo.value === 'Requestor') status = 'Returned to Requestor'
      await requestStore.updateRequest(selectedRequest.value.id, {
        status,
        remarks: confirmRemarks.value,
        action_by: 'Finance', // or use current user
      })
      showToastMsg(`Request returned to ${returnTo.value}!`, 'error')
    } else if (confirmAction.value === 'hold') {
      if (!confirmRemarks.value) return showToastMsg('Remarks required!', 'error')
      let status = 'On Hold (Finance)'
      if (returnTo.value === 'SCM') status = 'On Hold (SCM)'
      else if (returnTo.value === 'Requestor') status = 'On Hold (Requestor)'
      await requestStore.updateRequest(selectedRequest.value.id, {
        status,
        remarks: confirmRemarks.value,
        action_by: 'Finance', // or use current user
      })
      showToastMsg(`Request put on hold for ${returnTo.value}!`, 'info')
    } else if (confirmAction.value === 'forward') {
      await requestStore.financeForwardToTreasury(selectedRequest.value.id, confirmRemarks.value)
      showToastMsg('Request forwarded to Treasury!', 'success')
    } else if (confirmAction.value === 'resume') {
      await requestStore.resumeRequest(selectedRequest.value.id, confirmRemarks.value)
      showToastMsg('Request resumed and forwarded to Finance!', 'success')
    }
    await requestStore.loadRequests()
  } catch (err) {
    showToastMsg('Action failed: ' + (err?.message || 'Unknown error'), 'error')
  }
  showConfirmModal.value = false
  confirmRemarks.value = ''
  returnTo.value = 'SCM'
}

function openBulkModal(action) {
  bulkAction.value = action
  bulkRemarks.value = ''
  bulkTarget.value = 'SCM'
  showBulkModal.value = true
}

async function handleBulkConfirm() {
  if (!selectedRequests.value.length) return
  if (!bulkRemarks.value) {
    showToastMsg('Remarks required!', 'error')
    return
  }
  try {
    if (bulkAction.value === 'approve') {
      await requestStore.batchFinanceApprove(selectedRequests.value, bulkRemarks.value)
      showToastMsg('Selected requests approved!', 'success')
    } else if (bulkAction.value === 'forward') {
      await requestStore.batchFinanceForwardToTreasury(selectedRequests.value, bulkRemarks.value)
      showToastMsg('Selected requests forwarded to Treasury!', 'success')
    } else if (bulkAction.value === 'reject') {
      await requestStore.batchFinanceReject(
        selectedRequests.value,
        bulkRemarks.value,
        bulkTarget.value,
      )
      showToastMsg(`Selected requests returned to ${bulkTarget.value}!`, 'error')
    } else if (bulkAction.value === 'hold') {
      await requestStore.batchFinanceHold(
        selectedRequests.value,
        bulkRemarks.value,
        bulkTarget.value,
      )
      showToastMsg(`Selected requests put on hold for ${bulkTarget.value}!`, 'info')
    }
    await requestStore.loadRequests()
    selectedRequests.value = []
  } catch (err) {
    showToastMsg('Bulk action failed: ' + (err?.message || 'Unknown error'), 'error')
  }
  showBulkModal.value = false
}

function showToastMsg(message, type = 'success') {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 2500)
}
</script>

<template>
  <div class="container bg-white rounded-md p-5 text-black">
    <h1 class="text-2xl font-semibold mb-4">Finance Request Management</h1>
    <!-- Table -->
    <table class="table w-full text-xs overflow-x-auto">
      <thead class="text-black text-xs">
        <tr>
          <th>
            <input
              type="checkbox"
              class="checkbox-neutral checkbox-xs checkbox"
              :checked="allSelected"
              :disabled="financeRequests.length === 0"
              @change="allSelected = $event.target.checked"
            />
          </th>
          <th v-for="col in columns" :key="col.field">{{ col.title }}</th>
        </tr>
      </thead>
      <tbody class="text-xs">
        <tr v-for="req in financeRequests" :key="req.id">
          <td>
            <input
              type="checkbox"
              class="checkbox-neutral checkbox-xs checkbox"
              :value="req.id"
              v-model="selectedRequests"
            />
          </td>
          <td>{{ req.id }}</td>
          <td>{{ req.item }}</td>
          <td>{{ req.quantity }}</td>
          <td>{{ req.requester?.full_name }}</td>
          <td>{{ req.requester?.branch_id }}</td>
          <td>{{ req.requester?.department }}</td>
          <td>{{ req.date_requested?.split('T')[0] }}</td>
          <td>
            <span
              :class="{
                'badge badge-success': req.status.includes('Approved'),
                'badge badge-error': req.status.includes('Rejected'),
                'badge badge-warning':
                  req.status.includes('Hold') || req.status.includes('Pending'),
                'badge badge-info': req.status.includes('Forwarded'),
                'badge badge-neutral': req.status.includes('Cancelled'),
              }"
            >
              {{ req.status }}
            </span>
          </td>
          <td>
            <!-- Example budget info -->
            <span
              :class="{
                'text-green-600': req.budget_remaining >= req.amount,
                'text-red-600': req.budget_remaining < req.amount,
              }"
            >
              ₱{{ req.budget_remaining?.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
            </span>
          </td>
          <td>
            <div class="flex gap-1">
              <button
                title="View Request"
                class="p-1 cursor-pointer hover:text-white hover:bg-primaryColor/80 rounded-full"
                @click="openViewModal(req)"
              >
                <Eye class="w-3 h-3" />
              </button>
              <button
                title="Approve Request"
                class="p-1 cursor-pointer hover:text-white hover:bg-green-500/80 rounded-full"
                @click="openConfirmModal('approve', req)"
                v-if="req.status === 'Approved by SCM' || req.status === 'Forwarded to Finance'"
              >
                <Check class="w-3 h-3" />
              </button>
              <button
                title="Reject Request"
                class="p-1 cursor-pointer hover:text-white hover:bg-red-500/80 rounded-full"
                @click="openConfirmModal('reject', req)"
                v-if="req.status === 'Approved by SCM' || req.status === 'Forwarded to Finance'"
              >
                <X class="w-3 h-3" />
              </button>
              <button
                title="On Hold Request"
                class="p-1 cursor-pointer hover:text-white hover:bg-yellow-500/80 rounded-full"
                @click="openConfirmModal('hold', req)"
                v-if="req.status === 'Approved by SCM' || req.status === 'Forwarded to Finance'"
              >
                <BookX class="w-3 h-3" />
              </button>
              <button
                v-if="req.status === 'Approved by Finance'"
                title="Forward to Treasury"
                class="p-1 cursor-pointer hover:text-white hover:bg-blue-500/80 rounded-full"
                @click="openConfirmModal('forward', req)"
              >
                <Send class="w-3 h-3" />
              </button>
              <button
                v-if="req.status === 'On Hold (Finance)'"
                title="Resume Request"
                class="p-1 cursor-pointer hover:text-white hover:bg-blue-500/80 rounded-full"
                @click="openConfirmModal('resume', req)"
              >
                <Send class="w-3 h-3" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Bulk Actions -->
    <div class="flex gap-2 mt-4">
      <button
        class="btn-primaryStyle"
        :disabled="selectedRequests.length === 0"
        @click="openBulkModal('approve')"
      >
        Bulk Approve
      </button>
      <button
        class="btn-primaryStyle"
        :disabled="selectedRequests.length === 0"
        @click="openBulkModal('reject')"
      >
        Bulk Reject
      </button>
      <button
        class="btn-primaryStyle"
        :disabled="selectedRequests.length === 0"
        @click="openBulkModal('hold')"
      >
        Bulk On Hold
      </button>
      <button
        class="btn-primaryStyle"
        :disabled="selectedRequests.length === 0"
        @click="openBulkModal('forward')"
      >
        Bulk Forward to Treasury
      </button>
    </div>

    <!-- View Modal -->
    <div
      v-if="showViewModal"
      class="fixed inset-0 flex items-center justify-center bg-gray-500/20 z-50 overflow-x-auto"
    >
      <div class="bg-white rounded-lg p-6 w-full max-w-2xl shadow-lg">
        <h3 class="font-bold text-lg mb-2">Request Details</h3>
        <div v-if="selectedRequest">
          <div class="grid grid-cols-2 gap-2 mb-2">
            <div class="text-gray-500 text-xs">Item:</div>
            <div class="text-xs">{{ selectedRequest.item }}</div>
            <div class="text-gray-500 text-xs">Quantity:</div>
            <div class="text-xs">{{ selectedRequest.quantity }}</div>
            <div class="text-gray-500 text-xs">Requested By:</div>
            <div class="text-xs">
              {{ selectedRequest.requester?.full_name || selectedRequest.requested_by }}
            </div>
            <div class="text-gray-500 text-xs">Branch:</div>
            <div class="text-xs">
              {{ selectedRequest.requester?.branch_id || selectedRequest.branch_id }}
            </div>
            <div class="text-gray-500 text-xs">Department:</div>
            <div class="text-xs">
              {{ selectedRequest.requester?.department || selectedRequest.department }}
            </div>
            <div class="text-gray-500 text-xs">Date Requested:</div>
            <div class="text-xs">{{ selectedRequest.date_requested?.split('T')[0] }}</div>
          </div>
          <!-- SCM Info -->
          <div class="mb-2">
            <h4 class="text-sm font-semibold text-primaryColor mb-1">SCM Info</h4>
            <div class="grid grid-cols-2 gap-2">
              <div class="text-gray-500 text-xs">SCM Status:</div>
              <div class="text-xs">{{ selectedRequest.status }}</div>
              <div class="text-gray-500 text-xs">SCM Approved By:</div>
              <div class="text-xs">{{ selectedRequest.scm_approved_by || '—' }}</div>
              <div class="text-gray-500 text-xs">SCM Approved At:</div>
              <div class="text-xs">
                {{
                  selectedRequest.scm_approved_at
                    ? new Date(selectedRequest.scm_approved_at).toLocaleString()
                    : '—'
                }}
              </div>
              <div class="text-gray-500 text-xs">SCM Remarks:</div>
              <div class="text-xs">{{ selectedRequest.scm_remarks || '—' }}</div>
            </div>
          </div>
          <!-- Finance Info -->
          <div class="mb-2">
            <h4 class="text-sm font-semibold text-primaryColor mb-1">Finance Info</h4>
            <div class="grid grid-cols-2 gap-2">
              <div class="text-gray-500 text-xs">Finance Status:</div>
              <div class="text-xs">
                {{ selectedRequest.finance_status || selectedRequest.status }}
              </div>
              <div class="text-gray-500 text-xs">Finance Approved By:</div>
              <div class="text-xs">{{ selectedRequest.finance_approved_by || '—' }}</div>
              <div class="text-gray-500 text-xs">Finance Approved At:</div>
              <div class="text-xs">
                {{
                  selectedRequest.finance_approved_at
                    ? new Date(selectedRequest.finance_approved_at).toLocaleString()
                    : '—'
                }}
              </div>
              <div class="text-gray-500 text-xs">Finance Remarks:</div>
              <div class="text-xs">
                <!-- Show correct remarks based on status -->
                <template v-if="selectedRequest.status === 'Rejected by Finance'">
                  {{
                    selectedRequest.finance_rejected_remarks ||
                    selectedRequest.finance_remarks ||
                    '—'
                  }}
                </template>
                <template v-else-if="selectedRequest.status === 'On Hold (Finance)'">
                  {{
                    selectedRequest.finance_on_hold_remarks ||
                    selectedRequest.finance_remarks ||
                    '—'
                  }}
                </template>
                <template v-else>
                  {{ selectedRequest.finance_remarks || '—' }}
                </template>
              </div>
            </div>
          </div>
          <!-- Status History -->
          <div v-if="selectedRequest.status_history">
            <h4 class="text-sm font-semibold text-primaryColor mb-1">Status History</h4>
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
                <tr v-for="(entry, idx) in JSON.parse(selectedRequest.status_history)" :key="idx">
                  <td>{{ entry.status }}</td>
                  <td>{{ entry.by }}</td>
                  <td>{{ entry.at }}</td>
                  <td>{{ entry.remarks || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="flex justify-end mt-8">
          <button class="btn-secondaryStyle btn-sm" @click="showViewModal = false">Close</button>
        </div>
      </div>
    </div>

    <!-- Confirm Modal -->
    <div
      v-if="showConfirmModal"
      class="fixed inset-0 flex items-center justify-center bg-gray-500/20 z-50"
    >
      <div class="bg-white rounded-lg p-6 w-full max-w-sm shadow-lg">
        <h2 class="text-lg font-bold mb-4">Confirm {{ confirmAction }}</h2>
        <div v-if="['reject', 'hold'].includes(confirmAction)" class="mb-4">
          <label class="text-sm text-gray-500">Return To:</label>
          <select v-model="returnTo" class="input-search w-full">
            <option value="SCM">SCM</option>
            <option value="Requestor">Requestor</option>
            <option value="Finance">Finance</option>
          </select>
        </div>
        <textarea
          v-model="confirmRemarks"
          class="textarea bg-white border border-black w-full"
          placeholder="Remarks (required)"
          rows="3"
        ></textarea>
        <div class="flex justify-end gap-2 mt-4">
          <button class="btn-secondaryStyle" @click="showConfirmModal = false">Cancel</button>
          <button class="btn-primaryStyle" @click="handleConfirm">Confirm</button>
        </div>
      </div>
    </div>

    <!-- Bulk Action Modal -->
    <div
      v-if="showBulkModal"
      class="fixed inset-0 flex items-center justify-center bg-gray-500/20 z-50"
    >
      <div class="bg-white rounded-lg p-6 w-full max-w-sm shadow-lg">
        <h2 class="text-lg font-bold mb-4">
          Bulk {{ bulkAction.charAt(0).toUpperCase() + bulkAction.slice(1) }}
        </h2>
        <div v-if="['reject', 'hold'].includes(bulkAction)" class="mb-4">
          <label class="text-sm text-gray-500">Return/Hold To:</label>
          <select v-model="bulkTarget" class="input-search w-full">
            <option value="SCM">SCM</option>
            <option value="Requestor">Requestor</option>
            <option value="Finance" v-if="bulkAction === 'hold'">Finance</option>
          </select>
        </div>
        <div class="mb-4">
          <label class="text-sm text-gray-500">Remarks:</label>
          <textarea
            v-model="bulkRemarks"
            class="textarea bg-white border border-black w-full"
            placeholder="Remarks (required)"
            rows="3"
            required
          ></textarea>
        </div>
        <div class="flex justify-end gap-2">
          <button class="btn-secondaryStyle" @click="showBulkModal = false">Cancel</button>
          <button class="btn-primaryStyle" :disabled="!bulkRemarks" @click="handleBulkConfirm">
            Confirm
          </button>
        </div>
      </div>
    </div>

    <Toast :show="showToast" :message="toastMessage" :type="toastType" />
  </div>
</template>
