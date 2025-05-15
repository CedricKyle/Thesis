<script setup>
import { ref, onMounted, computed } from 'vue'
import CashReleaseReceiptModal from './CashReleaseRecieptModal.vue'
import { useTreasurySCMStore } from '@/stores/Finance Stores/treasurySCMStore'
import Toast from '@/components/Admin Components/HR/Toast.vue'
import { useAuthStore } from '@/stores/Authentication/authStore'

const treasuryStore = useTreasurySCMStore()
const authStore = useAuthStore()

const requests = computed(() =>
  treasuryStore.requests.filter((req) => req.payment_status === 'For Release'),
)

const showReleaseModal = ref(false)
const selectedRequest = ref(null)
const releaseAmount = ref(0)
const receiptFile = ref(null)
const loading = ref(false)
const showReceiptModal = ref(false)
const receiptData = ref(null)
const releasedHistoryPage = ref(1)
const rowsPerPage = ref(10)

const releasedRequests = computed(() =>
  treasuryStore.requests.filter((req) => req.payment_status === 'Released'),
)

const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1)
const yearOptions = [2023, 2024, 2025] // Adjust as needed

const selectedMonth = ref(new Date().getMonth() + 1)
const selectedYear = ref(new Date().getFullYear())

function isSameMonthYear(dateStr, month, year) {
  const d = new Date(dateStr)
  return d.getMonth() + 1 === month && d.getFullYear() === year
}

const filteredReleasedRequests = computed(() =>
  releasedRequests.value.filter((req) =>
    isSameMonthYear(req.released_at, selectedMonth.value, selectedYear.value),
  ),
)
const releasedHistoryTotalPages = computed(() =>
  Math.ceil(filteredReleasedRequests.value.length / rowsPerPage.value),
)
const paginatedReleasedHistory = computed(() =>
  filteredReleasedRequests.value.slice(
    (releasedHistoryPage.value - 1) * rowsPerPage.value,
    releasedHistoryPage.value * rowsPerPage.value,
  ),
)

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

const openReleaseModal = (request) => {
  selectedRequest.value = request
  releaseAmount.value = request.total_amount
  showReleaseModal.value = true
}

const closeReleaseModal = () => {
  showReleaseModal.value = false
  selectedRequest.value = null
  releaseAmount.value = 0
  receiptFile.value = null
}

const handleReceiptUpload = (e) => {
  receiptFile.value = e.target.files[0]
}

const confirmReleaseCash = async () => {
  loading.value = true
  try {
    await treasuryStore.releaseCash(
      selectedRequest.value.request_id,
      releaseAmount.value,
      receiptFile.value,
    )
    closeReleaseModal()
    showToast('Cash released successfully!', 'success')
  } catch (err) {
    showToast(treasuryStore.error || 'Failed to release cash', 'error')
  } finally {
    loading.value = false
  }
}

const openReceiptModal = (request) => {
  receiptData.value = {
    ...request,
    received_by: request.preparedBy?.full_name || 'SCM Representative',
    amount: request.total_amount,
    items: request.requestItems || request.items || [],
    prepared_by_name: request.preparedBy?.full_name || request.prepared_by || 'N/A',
    approved_by_name: request.approvedBy?.full_name || request.approved_by || 'N/A',
    processed_by: request.releasedBy?.full_name || authStore.user?.full_name || 'Treasury Officer',
  }
  showReceiptModal.value = true
}

const closeReceiptModal = () => {
  showReceiptModal.value = false
  receiptData.value = null
}

onMounted(() => {
  treasuryStore.fetchForReleaseRequests()
})
</script>

<template>
  <div>
    <h1 class="text-xl font-bold mb-4">Treasury - SCM Cash Release</h1>
    <table class="w-full text-xs border border-gray-300 mb-6">
      <thead class="bg-primaryColor text-white">
        <tr>
          <th class="border px-2 py-1">Request ID</th>
          <th class="border px-2 py-1">Description</th>
          <th class="border px-2 py-1">Date</th>
          <th class="border px-2 py-1">Amount</th>
          <th class="border px-2 py-1">Status</th>
          <th class="border px-2 py-1">Receipt</th>
          <th class="border px-2 py-1">Action</th>
        </tr>
      </thead>
      <tbody class="text-xs text-black">
        <tr v-for="req in requests" :key="req.request_id">
          <td class="border px-2 py-1">{{ req.request_id }}</td>
          <td class="border px-2 py-1">{{ req.description }}</td>
          <td class="border px-2 py-1">{{ new Date(req.request_date).toLocaleString() }}</td>
          <td class="border px-2 py-1">
            ₱{{ Number(req.total_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
          </td>
          <td class="border px-2 py-1">
            <span
              :class="{
                'badge badge-outline badge-warning text-xs badge-sm':
                  req.payment_status === 'For Release',
                'badge badge-outline badge-success text-xs badge-sm':
                  req.payment_status === 'Released',
              }"
            >
              {{ req.payment_status }}
            </span>
          </td>
          <td class="border px-2 py-1">
            <a
              v-if="req.payment_status === 'Released'"
              href="javascript:void(0)"
              class="text-blue-600 underline"
              @click="openReceiptModal(req)"
            >
              View Receipt
            </a>
            <span v-else class="text-gray-400">No Receipt</span>
          </td>
          <td class="border px-2 py-1">
            <button
              v-if="req.payment_status === 'For Release'"
              class="btn btn-xs btn-primary"
              @click="openReleaseModal(req)"
            >
              Release Cash
            </button>
            <span v-else class="text-green-700 font-bold">Released</span>
          </td>
        </tr>
        <tr v-if="!requests.length">
          <td colspan="7" class="text-center py-4 text-gray-500">No data available</td>
        </tr>
      </tbody>
    </table>

    <!-- Released History Table -->
    <div class="mt-8 text-black">
      <div class="flex justify-between mb-2">
        <h3 class="font-semibold text-black">Released Cash History</h3>
      </div>
      <div class="flex gap-2 mb-2">
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
      <div class="overflow-x-auto">
        <table class="table text-black w-full text-xs border border-gray-300 rounded-md">
          <thead class="text-black text-xs">
            <tr class="border border-gray-300 rounded-md">
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
                  @click="openReceiptModal(req)"
                >
                  View Receipt
                </a>
                <span v-else class="text-gray-400">No Receipt</span>
              </td>
            </tr>
            <tr v-if="!paginatedReleasedHistory.length">
              <td colspan="10" class="text-center py-4 text-gray-500">
                No released cash history found for this month.
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

    <!-- Release Cash Modal -->
    <dialog :open="showReleaseModal" class="modal">
      <div class="modal-box bg-white max-w-md p-6 rounded-lg shadow-lg">
        <h3 class="font-bold text-lg text-black mb-2">Release Cash</h3>
        <div class="mb-2">
          <label class="text-sm font-bold text-black">Amount:</label>
          <input
            type="number"
            v-model="releaseAmount"
            class="input-search input-sm w-full"
            :max="selectedRequest?.total_amount"
            min="1"
            required
          />
        </div>
        <div class="mb-2">
          <label class="text-sm font-bold text-black">Upload Receipt (optional):</label>
          <input type="file" @change="handleReceiptUpload" />
        </div>
        <div class="flex justify-end gap-4 mt-4">
          <button class="btn-secondaryStyle" @click="closeReleaseModal">Cancel</button>
          <button class="btn-primaryStyle" @click="confirmReleaseCash" :disabled="loading">
            Confirm Release
          </button>
        </div>
      </div>
    </dialog>

    <CashReleaseReceiptModal
      :show="showReceiptModal"
      :receipt="receiptData"
      :onClose="closeReceiptModal"
    >
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
          <tr v-for="(item, idx) in selectedRequest.requestItems" :key="item.id">
            <td class="border px-2 py-1">{{ idx + 1 }}</td>
            <td class="border px-2 py-1">{{ item.item_name }}</td>
            <td class="border px-2 py-1">{{ item.quantity }}</td>
            <td class="border px-2 py-1">{{ item.unit }}</td>
            <td class="border px-2 py-1">
              ₱{{ Number(item.unit_price).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
            </td>
            <td class="border px-2 py-1">
              ₱{{ Number(item.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
            </td>
          </tr>
        </tbody>
      </table>
    </CashReleaseReceiptModal>

    <Toast
      :show="toast.show"
      :message="toast.message"
      :type="toast.type"
      :customClass="toast.customClass"
    />
  </div>
</template>
