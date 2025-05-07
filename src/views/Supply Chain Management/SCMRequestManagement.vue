<script setup>
import { ref, onMounted, computed } from 'vue'
import BaseTable from '@/components/common/BaseTable.vue'
import Toast from '@/components/Admin Components/HR/Toast.vue'
import { useRequestStore } from '@/stores/Branch Operation & Department Stores/requestStore'
import { DEPARTMENTS } from '@/composables/Admin Composables/User & Role/role/permissionsId'

const requestStore = useRequestStore()
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')
const showViewModal = ref(false)
const selectedRequest = ref(null)
const showConfirmModal = ref(false)
const confirmAction = ref(null)
const confirmMessage = ref('')
const actionRequest = ref(null)
const selectedRequests = ref([])
const selectAll = ref(false)
const showPrintPreview = ref(false)
const printData = ref([])

// Get unique branch IDs from requests
const branchOptions = computed(() => {
  const ids = new Set()
  requestStore.filteredRequests.forEach((req) => {
    if (req.requester?.branch_id !== undefined && req.requester?.branch_id !== null) {
      ids.add(String(req.requester.branch_id))
    }
  })
  return Array.from(ids)
})

// Get unique departments from requests
const departmentOptions = computed(() => {
  const depts = new Set()
  requestStore.filteredRequests.forEach((req) => {
    if (req.requester?.department) depts.add(req.requester.department)
  })
  return Array.from(depts)
})

const filterStatus = ref('')
const filterBranch = ref('')
const filterDepartment = ref('')
const filterDate = ref('')

onMounted(async () => {
  await requestStore.loadRequests()
  setTimeout(() => {
    document.querySelector('.select-all-checkbox')?.addEventListener('change', (e) => {
      selectAll.value = e.target.checked
      if (selectAll.value) {
        selectedRequests.value = filteredRequests.value.map((req) => req.id)
        document.querySelectorAll('.row-checkbox').forEach((cb) => (cb.checked = true))
      } else {
        selectedRequests.value = []
        document.querySelectorAll('.row-checkbox').forEach((cb) => (cb.checked = false))
      }
    })
  }, 500)
})

const filteredRequests = computed(() => {
  return requestStore.filteredRequests.filter((req) => {
    const matchStatus = filterStatus.value ? req.status === filterStatus.value : true
    const matchBranch = filterBranch.value
      ? String(req.requester?.branch_id || '') === String(filterBranch.value)
      : true
    const matchDept = filterDepartment.value
      ? (req.requester?.department || '') === filterDepartment.value
      : true
    const matchDate = filterDate.value ? req.date_requested?.startsWith(filterDate.value) : true
    return matchStatus && matchBranch && matchDept && matchDate
  })
})

const loading = computed(() => requestStore.loading)

const columns = [
  {
    title: `<input type="checkbox" class="checkbox checkbox-xs checkbox-neutral select-all-checkbox" />`,
    field: 'select',
    headerSort: false,
    width: 40,
    formatter: (cell) => {
      const data = cell.getRow().getData()
      return `<input type="checkbox" class="checkbox checkbox-xs checkbox-neutral row-checkbox" data-id="${data.id}" />`
    },
    cellClick: (e, cell) => {
      const data = cell.getRow().getData()
      const checked = e.target.checked
      if (checked) {
        if (!selectedRequests.value.includes(data.id)) selectedRequests.value.push(data.id)
      } else {
        selectedRequests.value = selectedRequests.value.filter((id) => id !== data.id)
      }
    },
  },
  { title: 'Request ID', field: 'id', sorter: 'number', width: 100 },
  { title: 'Item', field: 'item', sorter: 'string' },
  { title: 'Quantity', field: 'quantity', sorter: 'number' },
  {
    title: 'Requested By',
    field: 'requester.full_name',
    sorter: 'string',
    formatter: function (cell) {
      const data = cell.getRow().getData()
      return data.requester?.full_name || data.requested_by
    },
  },
  {
    title: 'Branch',
    field: 'requester.branch_id',
    sorter: 'number',
    formatter: function (cell) {
      const data = cell.getRow().getData()
      return data.requester?.branch_id || '—'
    },
  },
  {
    title: 'Department',
    field: 'requester.department',
    sorter: 'string',
    formatter: function (cell) {
      const data = cell.getRow().getData()
      return data.requester?.department || ''
    },
  },
  {
    title: 'Date Requested',
    field: 'date_requested',
    sorter: 'date',
    formatter: function (cell) {
      const value = cell.getValue()
      if (!value) return ''
      return value.split('T')[0]
    },
  },
  {
    title: 'Status',
    field: 'status',
    formatter: function (cell) {
      const status = cell.getValue()
      if (status === 'Approved by SCM') {
        return `<span class="badge badge-outline badge-success h-5 text-xs">Approved by SCM</span>`
      } else if (status === 'Rejected by SCM' || status === 'Rejected by Finance') {
        return `<span class="badge badge-outline badge-error h-5 text-xs">${status}</span>`
      } else if (status === 'Forwarded to Finance') {
        return `<span class="badge badge-outline badge-info h-5 text-xs">Forwarded to Finance</span>`
      } else if (status.startsWith('On Hold')) {
        return `<span class="badge badge-outline badge-warning h-5 text-xs">${status}</span>`
      } else if (status === 'Cancelled') {
        return `<span class="badge badge-outline badge-neutral h-5 text-xs">Cancelled</span>`
      } else {
        return `<span class="badge badge-outline badge-warning h-5 text-xs">${status}</span>`
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
      let actions = `
        <button class="btn btn-sm btn-circle hover:bg-primaryColor/80 border-none btn-ghost view-button" title="View">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
      `
      if (data.status === 'Pending') {
        actions += `
          <button class="btn btn-sm btn-circle hover:bg-green-400 border-none btn-ghost approve-button" title="Approve">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7"/>
            </svg>
          </button>
          <button class="btn btn-sm btn-circle hover:bg-red-400 border-none btn-ghost reject-button" title="Reject">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        `
      }
      if (data.status === 'Approved by SCM') {
        actions += `
          <button class="btn btn-sm btn-circle hover:bg-blue-400 border-none btn-ghost forward-button" title="Forward to Finance">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        `
      }
      return `<div class="flex gap-2">${actions}</div>`
    },
    cellClick: (e, cell) => {
      const record = cell.getRow().getData()
      if (e.target.closest('.view-button')) {
        openViewModal(record)
      } else if (e.target.closest('.approve-button')) {
        openConfirmModal('approve', record, 'Approve this request?')
      } else if (e.target.closest('.reject-button')) {
        openConfirmModal('reject', record, 'Reject this request?')
      } else if (e.target.closest('.forward-button')) {
        openConfirmModal('forward', record, 'Forward this request to Finance?')
      }
    },
    headerSort: false,
    width: 220,
  },
]

const approveRequest = async (request) => {
  await requestStore.updateRequest(request.id, { status: 'Approved by SCM' })
  showToastMessage('Request approved!', 'success')
}

const rejectRequest = async (request) => {
  await requestStore.updateRequest(request.id, {
    status: 'Rejected',
    requestor_rejection_remarks: request.requestor_rejection_remarks || '',
  })
  showToastMessage('Request rejected!', 'error')
}

const forwardRequest = async (request) => {
  await requestStore.updateRequest(request.id, {
    status: 'Forwarded to Finance',
    finance_remarks: request.finance_remarks || '',
  })
  showToastMessage('Request forwarded to Finance!', 'info')
}

function openViewModal(request) {
  selectedRequest.value = request
  showViewModal.value = true
}

function openConfirmModal(action, request, message) {
  confirmAction.value = action
  actionRequest.value = request
  confirmMessage.value = message
  showConfirmModal.value = true
}

async function handleConfirm() {
  if (!confirmAction.value || !actionRequest.value) return
  if (confirmAction.value === 'approve') {
    await approveRequest(actionRequest.value)
  } else if (confirmAction.value === 'reject') {
    if (!actionRequest.value.requestor_rejection_remarks) {
      showToastMessage('Rejection remarks are required!', 'error')
      return
    }
    await rejectRequest(actionRequest.value)
  } else if (confirmAction.value === 'forward') {
    await forwardRequest(actionRequest.value)
  }
  showConfirmModal.value = false
  confirmAction.value = null
  actionRequest.value = null
}

const bulkApprove = async () => {
  if (!selectedRequests.value.length) return
  try {
    await requestStore.batchUpdateStatus({
      requestIds: selectedRequests.value,
      newStatus: 'Approved by SCM',
      remarks: 'Batch approved by SCM',
    })
    showToastMessage('Selected requests approved!', 'success')
    selectedRequests.value = []
  } catch (err) {
    showToastMessage('Some requests failed to approve.', 'error')
  }
}

const bulkForward = async () => {
  if (!selectedRequests.value.length) return
  try {
    await requestStore.batchUpdateStatus({
      requestIds: selectedRequests.value,
      newStatus: 'Forwarded to Finance',
      remarks: 'Batch forwarded to Finance',
    })
    showToastMessage('Selected requests forwarded to Finance!', 'info')
    selectedRequests.value = []
  } catch (err) {
    showToastMessage('Some requests failed to forward.', 'error')
  }
}

function openPrintPreview() {
  printData.value = filteredRequests.value // or any filtered data you want to print
  showPrintPreview.value = true
}

function printTable() {
  // Print only the modal content
  const printContents = document.querySelector('.modal-box').innerHTML
  const originalContents = document.body.innerHTML
  document.body.innerHTML = printContents
  window.print()
  document.body.innerHTML = originalContents
  window.location.reload() // reload to restore app state
}

function showToastMessage(message, type = 'success', duration = 2500) {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, duration)
}

const statusHistory = computed(() => {
  try {
    return selectedRequest.value?.status_history
      ? JSON.parse(selectedRequest.value.status_history)
      : []
  } catch {
    return []
  }
})
</script>

<template>
  <div class="container bg-white rounded-md p-5 text-black">
    <h1 class="text-2xl font-semibold mb-4">SCM Request Management</h1>
    <div class="flex gap-4 mb-4">
      <select v-model="filterStatus" class="input-search cursor-pointer">
        <option value="">All Status</option>
        <option value="Pending">Pending</option>
        <option value="Approved">Approved</option>
        <option value="Rejected">Rejected</option>
        <option value="Forwarded">Forwarded</option>
      </select>
      <select v-model="filterBranch" class="input-search cursor-pointer">
        <option value="">All Branches</option>
        <option v-for="id in branchOptions" :key="id" :value="id">{{ id }}</option>
      </select>
      <select v-model="filterDepartment" class="input-search cursor-pointer">
        <option value="">All Departments</option>
        <option v-for="dept in departmentOptions" :key="dept" :value="dept">{{ dept }}</option>
      </select>
      <input v-model="filterDate" type="date" class="input-search" />
    </div>

    <BaseTable :data="filteredRequests" :columns="columns" :loading="loading" />
    <div class="flex gap-2 mt-4 justify-end">
      <button
        class="btn-primaryStyle"
        :disabled="selectedRequests.length === 0"
        @click="bulkApprove"
      >
        Bulk Approve
      </button>
      <button
        class="btn-primaryStyle"
        :disabled="selectedRequests.length === 0"
        @click="bulkForward"
      >
        Bulk Forward to Finance
      </button>
      <button class="btn-secondaryStyle" @click="openPrintPreview">Print Preview</button>
    </div>
    <Toast :show="showToast" :message="toastMessage" :type="toastType" />

    <!-- View Request Modal -->
    <div
      v-if="showViewModal"
      class="fixed inset-0 flex items-center justify-center bg-gray-500/20 z-50"
    >
      <div class="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <h2 class="text-lg font-bold mb-4">Request Details</h2>
        <div v-if="selectedRequest">
          <p class="flex justify-between text-sm">
            <span class="text-sm text-gray-500">Item:</span> {{ selectedRequest.item }}
          </p>
          <p class="flex justify-between text-sm">
            <span class="text-sm text-gray-500">Quantity:</span> {{ selectedRequest.quantity }}
          </p>
          <p class="flex justify-between text-sm">
            <span class="text-sm text-gray-500">Requested By:</span>
            {{ selectedRequest.requester?.full_name || selectedRequest.requested_by }}
          </p>
          <p class="flex justify-between text-sm">
            <span class="text-sm text-gray-500">Branch:</span>
            {{ selectedRequest.requester?.branch_id || '—' }}
          </p>
          <p class="flex justify-between text-sm">
            <span class="text-sm text-gray-500">Department:</span>
            {{ selectedRequest.requester?.department || '' }}
          </p>
          <p class="flex justify-between text-sm">
            <span class="text-sm text-gray-500">Date Requested:</span>
            {{ selectedRequest.date_requested?.split('T')[0] }}
          </p>
          <p class="flex justify-between text-sm">
            <span class="text-sm text-gray-500">Status:</span>
            <span
              class="badge badge-outline badge-sm"
              :class="
                selectedRequest.status === 'Pending'
                  ? 'badge-warning'
                  : selectedRequest.status === 'Approved'
                    ? 'badge-success'
                    : 'badge-error'
              "
              >{{ selectedRequest.status }}</span
            >
          </p>
          <p class="flex justify-between text-sm">
            <span class="text-sm text-gray-500">Remarks:</span> {{ selectedRequest.remarks }}
          </p>
          <p class="flex justify-between text-sm">
            <span class="text-sm text-gray-500">Finance Remarks:</span>
            {{ selectedRequest.finance_remarks || '—' }}
          </p>
          <div v-if="statusHistory.length" class="mt-4">
            <h4 class="font-semibold text-sm mb-2">Status History</h4>
            <ul class="text-xs space-y-1">
              <li v-for="(entry, idx) in statusHistory" :key="idx">
                <span class="font-bold">{{ entry.status }}</span>
                <span>by {{ entry.by }}</span>
                <span>on {{ entry.at }}</span>
                <span v-if="entry.remarks">— {{ entry.remarks }}</span>
              </li>
            </ul>
          </div>
        </div>
        <div class="flex justify-end mt-8">
          <button class="btn-secondaryStyle btn-sm" @click="showViewModal = false">Close</button>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div
      v-if="showConfirmModal"
      class="fixed inset-0 flex items-center justify-center bg-gray-500/20 z-50"
    >
      <div class="bg-white rounded-lg p-6 w-full max-w-sm shadow-lg">
        <h2 class="text-lg font-bold mb-4">Confirm Action</h2>
        <p class="mb-6">{{ confirmMessage }}</p>
        <div v-if="confirmAction === 'reject'" class="mb-4">
          <label class="text-sm text-gray-500">Rejection Remarks:</label>
          <textarea
            v-model="actionRequest.requestor_rejection_remarks"
            class="textarea bg-white border border-black w-full"
            placeholder="State reason for rejection"
            rows="3"
            required
          ></textarea>
        </div>
        <div v-if="confirmAction === 'forward'" class="mb-4">
          <label class="text-sm text-gray-500">Finance Remarks:</label>
          <textarea
            v-model="actionRequest.finance_remarks"
            class="textarea bg-white border border-black w-full"
            placeholder="Add finance remarks (optional)"
            rows="3"
          ></textarea>
        </div>
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
        <div class="flex justify-end gap-2">
          <button class="btn-secondaryStyle" @click="showConfirmModal = false">Cancel</button>
          <button class="btn-primaryStyle" @click="handleConfirm">Confirm</button>
        </div>
      </div>
    </div>

    <!-- Print Preview Modal -->
    <dialog v-if="showPrintPreview" open class="modal z-50">
      <div class="modal-box bg-white text-black max-w-4xl w-full">
        <h3 class="font-bold text-lg mb-2">Print Preview: SCM Requests</h3>
        <div class="scm-print-area">
          <table class="table text-black w-full text-xs border border-gray-300 rounded-md">
            <thead class="text-xs text-black">
              <tr>
                <th>Request ID</th>
                <th>Item</th>
                <th>Quantity</th>
                <th>Requested By</th>
                <th>Branch</th>
                <th>Department</th>
                <th>Status</th>
                <th>Date Requested</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in printData" :key="row.id">
                <td>{{ row.id }}</td>
                <td>{{ row.item }}</td>
                <td>{{ row.quantity }}</td>
                <td>{{ row.requester?.full_name || row.requested_by }}</td>
                <td>{{ row.requester?.branch_id || '—' }}</td>
                <td>{{ row.requester?.department || '' }}</td>
                <td>{{ row.status }}</td>
                <td>{{ row.date_requested?.split('T')[0] }}</td>
              </tr>
            </tbody>
          </table>

          <div style="margin-top: 48px">
            <div style="display: flex; justify-content: space-between">
              <div style="text-align: center">
                <div style="height: 48px"></div>
                <div style="border-top: 1px solid #333; width: 200px; margin: 0 auto"></div>
                <span style="font-size: 12px">Prepared By</span>
              </div>
              <div style="text-align: center">
                <div style="height: 48px"></div>
                <div style="border-top: 1px solid #333; width: 200px; margin: 0 auto"></div>
                <span style="font-size: 12px">Checked By</span>
              </div>
              <div style="text-align: center">
                <div style="height: 48px"></div>
                <div style="border-top: 1px solid #333; width: 200px; margin: 0 auto"></div>
                <span style="font-size: 12px">Approved By</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-action">
          <button class="btn-primaryStyle" @click="printTable">Print</button>
          <button class="btn-secondaryStyle" @click="showPrintPreview = false">Close</button>
        </div>
      </div>
    </dialog>
  </div>
</template>
