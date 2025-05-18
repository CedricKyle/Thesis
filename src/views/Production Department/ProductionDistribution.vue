<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import Toast from '@/components/Admin Components/HR/Toast.vue'

// Mock data
const mockBranches = [
  { id: 1, name: 'Main Branch' },
  { id: 2, name: 'North Branch' },
  { id: 3, name: 'South Branch' },
]

const mockBatches = [
  {
    id: 1,
    batch_number: 'BATCH-001',
    product_name: 'Product A',
    quantity: 100,
    unit: 'pcs',
    expiry_date: '2024-12-31',
  },
  {
    id: 2,
    batch_number: 'BATCH-002',
    product_name: 'Product B',
    quantity: 50,
    unit: 'boxes',
    expiry_date: '2024-12-31',
  },
]

const mockRequests = [
  {
    id: 1,
    request_id: 'REQ-0001',
    branch_name: 'Main Branch',
    requested_at: '2024-03-20',
    items: [
      {
        product_name: 'Product A',
        category: 'Category 1',
        quantity: 10,
        unit: 'pcs',
        notes: 'Urgent',
      },
    ],
    status: 'pending',
    requestedByEmployee: { full_name: 'John Doe' },
  },
]

// State
const activeTab = ref('new')
const searchQuery = ref('')
const selectedBatches = ref([])
const selectedBranch = ref('')
const distributionDate = ref(new Date().toISOString().split('T')[0])
const remarks = ref('')
const toast = ref({ show: false, message: '', type: 'info', customClass: '' })
const page = ref(1)
const rowsPerPage = ref(10)
const availableBatches = ref([])
const branches = ref([])
const branchRequests = ref([])
const loading = ref(false)
const requestFilter = ref('all')
const showRequestModal = ref(false)
const selectedRequest = ref(null)

// Computed properties
const filteredBatches = computed(() => {
  return availableBatches.value.filter(
    (batch) =>
      batch.batch_number.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      batch.product_name.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

const paginatedBatches = computed(() => {
  return filteredBatches.value.slice(
    (page.value - 1) * rowsPerPage.value,
    page.value * rowsPerPage.value,
  )
})

const totalPages = computed(() => Math.ceil(filteredBatches.value.length / rowsPerPage.value))

const filteredBranchRequests = computed(() => {
  let filtered = branchRequests.value
  if (requestFilter.value !== 'all') {
    filtered = filtered.filter((request) => request.status === requestFilter.value)
  }
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (request) =>
        request.request_id?.toLowerCase().includes(query) ||
        request.branch_name?.toLowerCase().includes(query) ||
        request.requestedByEmployee?.full_name?.toLowerCase().includes(query),
    )
  }
  return filtered
})

// Helper functions
function showToast(message, type = 'info', customClass = '') {
  toast.value = { show: true, message, type, customClass }
  setTimeout(() => {
    toast.value.show = false
  }, 2500)
}

// Mock API calls
async function fetchAvailableBatches() {
  loading.value = true
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))
    availableBatches.value = mockBatches
  } catch (error) {
    showToast('Error loading available batches', 'error')
  } finally {
    loading.value = false
  }
}

async function fetchBranches() {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))
    branches.value = mockBranches
  } catch (error) {
    showToast('Error loading branches', 'error')
  }
}

function addBatchToDistribution(batch) {
  if (selectedBatches.value.find((b) => b.id === batch.id)) {
    showToast('Batch already selected', 'warning')
    return
  }
  selectedBatches.value.push({
    ...batch,
    distribution_quantity: 0,
  })
}

function removeBatchFromDistribution(batchId) {
  selectedBatches.value = selectedBatches.value.filter((b) => b.id !== batchId)
}

function validateDistribution() {
  if (!selectedBranch.value) {
    showToast('Please select a branch', 'error')
    return false
  }
  if (selectedBatches.value.length === 0) {
    showToast('Please select at least one batch', 'error')
    return false
  }
  if (selectedBatches.value.some((b) => b.distribution_quantity <= 0)) {
    showToast('Please enter valid quantities for all batches', 'error')
    return false
  }
  return true
}

async function submitDistribution() {
  if (!validateDistribution()) return
  loading.value = true
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))
    showToast('Distribution submitted successfully', 'success')
    selectedBatches.value = []
    selectedBranch.value = ''
    distributionDate.value = new Date().toISOString().split('T')[0]
    remarks.value = ''
    fetchAvailableBatches()
  } catch (error) {
    showToast('Error submitting distribution', 'error')
  } finally {
    loading.value = false
  }
}

async function fetchBranchRequests() {
  loading.value = true
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))
    branchRequests.value = mockRequests
  } catch (error) {
    showToast('Error loading branch requests', 'error')
  } finally {
    loading.value = false
  }
}

async function fetchDistributionHistory() {
  loading.value = true
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))
    branchRequests.value = [] // Empty for now
  } catch (error) {
    showToast('Error loading distribution history', 'error')
  } finally {
    loading.value = false
  }
}

async function viewRequestDetails(requestId) {
  loading.value = true
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))
    selectedRequest.value = mockRequests.find((r) => r.id === requestId)
    showRequestModal.value = true
  } catch (error) {
    showToast('Error loading request details', 'error')
  } finally {
    loading.value = false
  }
}

async function updateRequestStatus(requestId, newStatus, notes = null) {
  loading.value = true
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))
    const request = mockRequests.find((r) => r.id === requestId)
    if (request) {
      request.status = newStatus
    }
    showToast('Request status updated', 'success')
  } catch (error) {
    showToast('Error updating request status', 'error')
  } finally {
    loading.value = false
  }
}

async function approveRequest(requestId) {
  await updateRequestStatus(requestId, 'approved')
}

async function rejectRequest(requestId) {
  await updateRequestStatus(requestId, 'rejected')
}

// Lifecycle hooks
onMounted(() => {
  fetchAvailableBatches()
  fetchBranches()
  if (activeTab.value === 'requests') {
    fetchBranchRequests()
  }
})

watch(activeTab, (newTab) => {
  if (newTab === 'requests') {
    fetchBranchRequests()
  } else if (newTab === 'history') {
    fetchDistributionHistory()
  } else if (newTab === 'new') {
    fetchAvailableBatches()
  }
})
</script>

<template>
  <div class="bg-white rounded-lg shadow">
    <!-- Header -->
    <div class="p-4 border-b">
      <h1 class="text-xl font-bold text-gray-800">Distribution Management</h1>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex border-b px-4">
      <button
        v-for="tab in ['new', 'history', 'requests']"
        :key="tab"
        @click="activeTab = tab"
        :class="[
          'px-4 py-2 text-sm font-medium border-b-2 -mb-px',
          activeTab === tab
            ? 'border-primaryColor text-primaryColor'
            : 'border-transparent text-gray-500 hover:text-gray-700',
        ]"
      >
        {{
          tab === 'new'
            ? 'New Distribution'
            : tab === 'history'
              ? 'Distribution History'
              : 'Branch Requests'
        }}
      </button>
    </div>

    <!-- Content Area -->
    <div class="p-4">
      <!-- New Distribution Tab -->
      <div v-if="activeTab === 'new'">
        <!-- Distribution Details -->
        <div class="bg-gray-50 p-4 rounded-lg mb-6">
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="text-sm font-semibold text-gray-600">Destination Branch</label>
              <select
                v-model="selectedBranch"
                class="select !bg-white !border-black !text-black select-bordered w-full mt-1"
              >
                <option value="">Select branch...</option>
                <option v-for="branch in branches" :key="branch.id" :value="branch.id">
                  {{ branch.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="text-sm font-semibold text-gray-600">Distribution Date</label>
              <input
                v-model="distributionDate"
                type="date"
                class="input !bg-white !border-black !text-black w-full mt-1"
              />
            </div>
            <div>
              <label class="text-sm font-semibold text-gray-600">Remarks</label>
              <input
                v-model="remarks"
                type="text"
                placeholder="Enter remarks..."
                class="input !bg-white !border-black !text-black w-full mt-1"
              />
            </div>
          </div>
        </div>

        <!-- Available Batches -->
        <div class="mb-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-bold text-black">Available Batches</h2>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search batches..."
              class="input-search input-sm w-64 border border-black"
            />
          </div>

          <div class="overflow-x-auto">
            <table class="table table-compact w-full">
              <thead>
                <tr class="bg-primaryColor text-white">
                  <th class="text-xs">Batch Number</th>
                  <th class="text-xs">Product Name</th>
                  <th class="text-xs">Available Quantity</th>
                  <th class="text-xs">Unit</th>
                  <th class="text-xs">Expiry Date</th>
                  <th class="text-xs">Action</th>
                </tr>
              </thead>
              <tbody class="text-xs text-black">
                <tr v-if="loading">
                  <td colspan="6" class="text-center py-4">Loading available batches...</td>
                </tr>
                <tr v-else-if="paginatedBatches.length === 0">
                  <td colspan="6" class="text-center py-4 text-gray-500">No batches available</td>
                </tr>
                <tr v-for="batch in paginatedBatches" :key="batch.id" class="hover:bg-gray-50">
                  <td>{{ batch.batch_number }}</td>
                  <td>{{ batch.product_name }}</td>
                  <td>{{ batch.quantity }}</td>
                  <td>{{ batch.unit }}</td>
                  <td>{{ new Date(batch.expiry_date).toLocaleDateString() }}</td>
                  <td>
                    <button
                      class="btn-secondaryStyle btn-xs"
                      @click="addBatchToDistribution(batch)"
                    >
                      Add
                    </button>
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
              v-model="page"
              :disabled="totalPages <= 1"
            >
              <option v-for="p in totalPages" :key="p" :value="p">{{ p }}</option>
            </select>
            <span class="text-black text-xs">of {{ totalPages }}</span>
            <span class="ml-4 text-xs text-black">Rows per page:</span>
            <select
              class="select !bg-white !border-black !text-black select-xs w-16"
              v-model="rowsPerPage"
              @change="page = 1"
            >
              <option :value="5">5</option>
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
            </select>
          </div>
        </div>

        <!-- Selected Batches -->
        <div v-if="selectedBatches.length > 0">
          <h2 class="text-lg font-bold text-black mb-4">Selected Batches</h2>
          <div class="overflow-x-auto">
            <table class="table table-compact w-full">
              <thead>
                <tr class="bg-primaryColor text-white">
                  <th class="text-xs">Batch Number</th>
                  <th class="text-xs">Product Name</th>
                  <th class="text-xs">Available Quantity</th>
                  <th class="text-xs">Distribution Quantity</th>
                  <th class="text-xs">Unit</th>
                  <th class="text-xs">Action</th>
                </tr>
              </thead>
              <tbody class="text-xs text-black">
                <tr v-for="batch in selectedBatches" :key="batch.id" class="hover:bg-gray-50">
                  <td>{{ batch.batch_number }}</td>
                  <td>{{ batch.product_name }}</td>
                  <td>{{ batch.quantity }}</td>
                  <td>
                    <input
                      v-model.number="batch.distribution_quantity"
                      type="number"
                      min="0"
                      :max="batch.quantity"
                      class="input !bg-white !border-black !text-black input-xs w-20"
                    />
                  </td>
                  <td>{{ batch.unit }}</td>
                  <td>
                    <button
                      class="btn-secondaryStyle btn-xs"
                      @click="removeBatchFromDistribution(batch.id)"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex justify-end mt-4">
            <button class="btn-secondaryStyle" @click="submitDistribution" :disabled="loading">
              {{ loading ? 'Submitting...' : 'Submit Distribution' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Distribution History Tab -->
      <div v-if="activeTab === 'history'">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-bold text-black">Distribution History</h2>
          <div class="flex gap-2">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search distributions..."
              class="input-search input-sm w-64 border border-black"
            />
            <button
              @click="fetchDistributionHistory"
              class="btn btn-sm bg-primaryColor text-white"
              :disabled="loading"
            >
              <span v-if="loading">Loading...</span>
              <span v-else>Refresh</span>
            </button>
          </div>
        </div>

        <div class="text-center py-8" v-if="loading">
          <p class="text-gray-500">Loading distribution history...</p>
        </div>

        <div class="text-center py-8 text-gray-500" v-else>
          Distribution history will be implemented here
        </div>
      </div>

      <!-- Branch Requests Tab -->
      <div v-if="activeTab === 'requests'">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-bold text-black">Branch Requests</h2>
          <div class="flex gap-2">
            <div class="flex gap-2 items-center">
              <span class="text-sm text-gray-600">Status:</span>
              <select
                v-model="requestFilter"
                class="select select-sm !bg-white !border-black !text-black"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="fulfilled">Fulfilled</option>
              </select>
            </div>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search requests..."
              class="input-search input-sm w-64 border border-black"
            />
            <button
              @click="fetchBranchRequests"
              class="btn btn-sm bg-primaryColor text-white"
              :disabled="loading"
            >
              <span v-if="loading">Loading...</span>
              <span v-else>Refresh</span>
            </button>
          </div>
        </div>

        <!-- Requests Table -->
        <div class="overflow-x-auto">
          <table class="table table-compact w-full">
            <thead>
              <tr class="bg-primaryColor text-white">
                <th class="text-xs">Request ID</th>
                <th class="text-xs">Branch</th>
                <th class="text-xs">Request Date</th>
                <th class="text-xs">Items</th>
                <th class="text-xs">Status</th>
                <th class="text-xs">Requested By</th>
                <th class="text-xs">Action</th>
              </tr>
            </thead>
            <tbody class="text-xs text-black">
              <tr v-if="loading">
                <td colspan="7" class="text-center py-4">Loading branch requests...</td>
              </tr>
              <tr v-else-if="filteredBranchRequests.length === 0">
                <td colspan="7" class="text-center py-4">No branch requests found</td>
              </tr>
              <tr
                v-for="request in filteredBranchRequests"
                :key="request.id || request.request_id"
                class="hover:bg-gray-50"
              >
                <td>
                  {{ request.request_id || `REQ-${request.id?.toString().padStart(4, '0')}` }}
                </td>
                <td>{{ request.branch_name }}</td>
                <td>
                  {{
                    new Date(
                      request.requested_at || request.request_date || Date.now(),
                    ).toLocaleDateString()
                  }}
                </td>
                <td>
                  {{
                    typeof request.items === 'object' && request.items?.length
                      ? request.items.length
                      : request.total_items ||
                        (request.product_names ? request.product_names.split(',').length : 0) ||
                        '?'
                  }}
                </td>
                <td>
                  <span
                    :class="{
                      'badge badge-sm badge-warning badge-outline': request.status === 'pending',
                      'badge badge-sm badge-success badge-outline': request.status === 'approved',
                      'badge badge-sm badge-error badge-outline': request.status === 'rejected',
                      'badge badge-sm badge-info badge-outline': request.status === 'fulfilled',
                    }"
                  >
                    {{ request.status }}
                  </span>
                </td>
                <td>
                  {{
                    request.requestedByEmployee?.full_name || request.requested_by || 'Branch User'
                  }}
                </td>
                <td>
                  <button
                    class="btn-secondaryStyle btn-xs"
                    @click="viewRequestDetails(request.id || request.request_id)"
                  >
                    View
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <!-- Request Details Modal -->
  <div v-if="showRequestModal" class="modal modal-open">
    <div class="modal-box max-w-2xl">
      <h3 class="font-bold text-lg mb-4">Request Details</h3>

      <div v-if="selectedRequest" class="space-y-4">
        <!-- Request Info -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm font-semibold text-gray-600">Request ID</p>
            <p class="text-sm">
              {{
                selectedRequest.request_id ||
                `REQ-${selectedRequest.id.toString().padStart(4, '0')}`
              }}
            </p>
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-600">Branch</p>
            <p class="text-sm">{{ selectedRequest.branch_name }}</p>
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-600">Request Date</p>
            <p class="text-sm">
              {{
                new Date(
                  selectedRequest.requested_at || selectedRequest.request_date,
                ).toLocaleDateString()
              }}
            </p>
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-600">Status</p>
            <p class="text-sm">
              <span
                :class="{
                  'badge badge-sm badge-warning badge-outline':
                    selectedRequest.status === 'pending',
                  'badge badge-sm badge-success badge-outline':
                    selectedRequest.status === 'approved',
                  'badge badge-sm badge-error badge-outline': selectedRequest.status === 'rejected',
                  'badge badge-sm badge-info badge-outline': selectedRequest.status === 'fulfilled',
                }"
              >
                {{ selectedRequest.status }}
              </span>
            </p>
          </div>
        </div>

        <!-- Remarks -->
        <div v-if="selectedRequest.remarks">
          <p class="text-sm font-semibold text-gray-600">Remarks</p>
          <p class="text-sm p-2 bg-gray-50 rounded">{{ selectedRequest.remarks }}</p>
        </div>

        <!-- Requested Items -->
        <div class="mt-4">
          <p class="text-sm font-semibold text-gray-600 mb-2">Requested Items</p>
          <div class="overflow-x-auto">
            <table class="table table-compact w-full">
              <thead>
                <tr class="bg-gray-100">
                  <th class="text-xs">Product</th>
                  <th class="text-xs">Category</th>
                  <th class="text-xs">Quantity</th>
                  <th class="text-xs">Unit</th>
                  <th class="text-xs">Notes</th>
                </tr>
              </thead>
              <tbody class="text-xs">
                <tr v-if="loading">
                  <td colspan="5" class="text-center py-2">Loading items...</td>
                </tr>
                <tr v-else-if="!selectedRequest.items || selectedRequest.items.length === 0">
                  <td colspan="5" class="text-center py-2">No items found</td>
                </tr>
                <tr v-for="(item, index) in selectedRequest.items" :key="index">
                  <td>{{ item.product_name }}</td>
                  <td>{{ item.category }}</td>
                  <td>{{ item.quantity }}</td>
                  <td>{{ item.unit }}</td>
                  <td>{{ item.notes || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Approval Actions -->
        <div v-if="selectedRequest.status === 'pending'" class="flex justify-end gap-2 mt-4">
          <button
            class="btn btn-error btn-sm"
            @click="rejectRequest(selectedRequest.id || selectedRequest.request_id)"
            :disabled="loading"
          >
            {{ loading ? 'Processing...' : 'Reject' }}
          </button>
          <button
            class="btn btn-success btn-sm"
            @click="approveRequest(selectedRequest.id || selectedRequest.request_id)"
            :disabled="loading"
          >
            {{ loading ? 'Processing...' : 'Approve' }}
          </button>
        </div>

        <!-- Fulfillment Action -->
        <div v-if="selectedRequest.status === 'approved'" class="flex justify-end gap-2 mt-4">
          <button
            class="btn btn-primary btn-sm"
            @click="createDistributionFromRequest(selectedRequest)"
            :disabled="loading"
          >
            {{ loading ? 'Processing...' : 'Create Distribution' }}
          </button>
        </div>
      </div>

      <div class="modal-action">
        <button class="btn" @click="showRequestModal = false">Close</button>
      </div>
    </div>
  </div>

  <Toast
    :show="toast.show"
    :message="toast.message"
    :type="toast.type"
    :customClass="toast.customClass"
  />
</template>
