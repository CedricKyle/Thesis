<script setup>
import { ref, computed, onMounted } from 'vue'
import Toast from '@/components/Admin Components/HR/Toast.vue'

// State Management
const activeTab = ref('new') // new, history, requests
const searchQuery = ref('')
const selectedBatches = ref([])
const selectedBranch = ref('')
const distributionDate = ref(new Date().toISOString().split('T')[0])
const remarks = ref('')

// TODO: Import and use production batch store
// const productionBatchStore = useProductionBatchStore()

const toast = ref({
  show: false,
  message: '',
  type: 'info',
  customClass: '',
})

// Pagination
const page = ref(1)
const rowsPerPage = ref(10)

// Mock data - replace with actual data from store
const availableBatches = ref([
  {
    id: 1,
    batch_number: 'BN-001',
    product_name: 'Frozen Lumpia',
    quantity: 100,
    unit: 'packs',
    expiry_date: '2024-06-10',
  },
  {
    id: 2,
    batch_number: 'BN-002',
    product_name: 'Ready-to-Cook Siomai',
    quantity: 50,
    unit: 'packs',
    expiry_date: '2024-06-12',
  },
])

const branches = ref([
  { id: 1, name: 'Main Branch' },
  { id: 2, name: 'North Branch' },
  { id: 3, name: 'South Branch' },
])

// Add new state for branch requests
const branchRequests = ref([
  {
    id: 1,
    branch_name: 'Main Branch',
    request_date: '2024-03-15',
    status: 'pending', // pending, approved, rejected
    items: [
      {
        product_name: 'Frozen Lumpia',
        quantity: 50,
        unit: 'packs',
        priority: 'high', // high, medium, low
        notes: 'Urgent request for weekend promotion',
      },
    ],
    total_items: 1,
    requested_by: 'John Doe',
    approved_by: null,
    approval_date: null,
  },
  {
    id: 2,
    branch_name: 'North Branch',
    request_date: '2024-03-14',
    status: 'approved',
    items: [
      {
        product_name: 'Ready-to-Cook Siomai',
        quantity: 30,
        unit: 'packs',
        priority: 'medium',
        notes: 'Regular stock replenishment',
      },
    ],
    total_items: 1,
    requested_by: 'Jane Smith',
    approved_by: 'Manager Name',
    approval_date: '2024-03-15',
  },
])

// Add new refs for request modal
const showRequestModal = ref(false)
const selectedRequest = ref(null)

// Computed
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

// Functions
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

  try {
    // TODO: Call API to submit distribution
    // await productionBatchStore.submitDistribution({
    //   branch_id: selectedBranch.value,
    //   date: distributionDate.value,
    //   batches: selectedBatches.value,
    //   remarks: remarks.value
    // })

    showToast('Distribution submitted successfully', 'success')
    // Reset form
    selectedBatches.value = []
    selectedBranch.value = ''
    distributionDate.value = new Date().toISOString().split('T')[0]
    remarks.value = ''
  } catch (error) {
    showToast('Error submitting distribution', 'error')
  }
}

function showToast(message, type = 'info', customClass = '') {
  toast.value = { show: true, message, type, customClass }
  setTimeout(() => {
    toast.value.show = false
  }, 2500)
}

// Add new functions for request management
function viewRequestDetails(request) {
  selectedRequest.value = request
  showRequestModal.value = true
}

function updateRequestStatus(requestId, newStatus) {
  const request = branchRequests.value.find((r) => r.id === requestId)
  if (request) {
    request.status = newStatus
    request.approval_date = newStatus === 'approved' ? new Date().toISOString().split('T')[0] : null
    request.approved_by = newStatus === 'approved' ? 'Current User' : null
    showToast(`Request ${newStatus} successfully`, 'success')
  }
}

onMounted(() => {
  // TODO: Fetch available batches and branches
  // productionBatchStore.fetchAvailableBatches()
  // productionBatchStore.fetchBranches()
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
                <tr v-if="!paginatedBatches.length">
                  <td colspan="6" class="text-center py-4 text-gray-500">No batches available</td>
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
            <button class="btn-secondaryStyle" @click="submitDistribution">
              Submit Distribution
            </button>
          </div>
        </div>
      </div>

      <!-- Distribution History Tab -->
      <div v-if="activeTab === 'history'">
        <!-- TODO: Implement distribution history view -->
        <div class="text-center py-8 text-gray-500">
          Distribution history will be implemented here
        </div>
      </div>

      <!-- Branch Requests Tab -->
      <div v-if="activeTab === 'requests'">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-bold text-black">Branch Requests</h2>
          <div class="flex gap-2">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search requests..."
              class="input-search input-sm w-64 border border-black"
            />
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
                <th class="text-xs">Total Items</th>
                <th class="text-xs">Priority</th>
                <th class="text-xs">Status</th>
                <th class="text-xs">Requested By</th>
                <th class="text-xs">Action</th>
              </tr>
            </thead>
            <tbody class="text-xs text-black">
              <tr v-for="request in branchRequests" :key="request.id" class="hover:bg-gray-50">
                <td>REQ-{{ request.id.toString().padStart(4, '0') }}</td>
                <td>{{ request.branch_name }}</td>
                <td>{{ new Date(request.request_date).toLocaleDateString() }}</td>
                <td>{{ request.total_items }}</td>
                <td>
                  <span
                    :class="{
                      'badge badge-sm badge-error badge-outline':
                        request.items[0].priority === 'high',
                      'badge badge-sm badge-warning badge-outline':
                        request.items[0].priority === 'medium',
                      'badge badge-sm badge-success badge-outline':
                        request.items[0].priority === 'low',
                    }"
                  >
                    {{ request.items[0].priority }}
                  </span>
                </td>
                <td>
                  <span
                    :class="{
                      'badge badge-sm badge-warning badge-outline': request.status === 'pending',
                      'badge badge-sm badge-success badge-outline': request.status === 'approved',
                      'badge badge-sm badge-error badge-outline': request.status === 'rejected',
                    }"
                  >
                    {{ request.status }}
                  </span>
                </td>
                <td>{{ request.requested_by }}</td>
                <td>
                  <button class="btn-secondaryStyle btn-xs" @click="viewRequestDetails(request)">
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
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">Request Details</h3>

      <div v-if="selectedRequest" class="space-y-4">
        <!-- Request Info -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm font-semibold text-gray-600">Request ID</p>
            <p class="text-sm">REQ-{{ selectedRequest.id.toString().padStart(4, '0') }}</p>
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-600">Branch</p>
            <p class="text-sm">{{ selectedRequest.branch_name }}</p>
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-600">Request Date</p>
            <p class="text-sm">{{ new Date(selectedRequest.request_date).toLocaleDateString() }}</p>
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
                }"
              >
                {{ selectedRequest.status }}
              </span>
            </p>
          </div>
        </div>

        <!-- Requested Items -->
        <div class="mt-4">
          <p class="text-sm font-semibold text-gray-600 mb-2">Requested Items</p>
          <div class="overflow-x-auto">
            <table class="table table-compact w-full">
              <thead>
                <tr class="bg-gray-100">
                  <th class="text-xs">Product</th>
                  <th class="text-xs">Quantity</th>
                  <th class="text-xs">Unit</th>
                  <th class="text-xs">Priority</th>
                  <th class="text-xs">Notes</th>
                </tr>
              </thead>
              <tbody class="text-xs">
                <tr v-for="item in selectedRequest.items" :key="item.product_name">
                  <td>{{ item.product_name }}</td>
                  <td>{{ item.quantity }}</td>
                  <td>{{ item.unit }}</td>
                  <td>
                    <span
                      :class="{
                        'badge badge-sm badge-error badge-outline': item.priority === 'high',
                        'badge badge-sm badge-warning badge-outline': item.priority === 'medium',
                        'badge badge-sm badge-success badge-outline': item.priority === 'low',
                      }"
                    >
                      {{ item.priority }}
                    </span>
                  </td>
                  <td>{{ item.notes }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Approval Actions -->
        <div v-if="selectedRequest.status === 'pending'" class="flex justify-end gap-2 mt-4">
          <button
            class="btn-secondaryStyle"
            @click="updateRequestStatus(selectedRequest.id, 'rejected')"
          >
            Reject
          </button>
          <button
            class="btn-secondaryStyle"
            @click="updateRequestStatus(selectedRequest.id, 'approved')"
          >
            Approve
          </button>
        </div>
      </div>

      <div class="modal-action">
        <button class="btn-secondaryStyle" @click="showRequestModal = false">Close</button>
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
