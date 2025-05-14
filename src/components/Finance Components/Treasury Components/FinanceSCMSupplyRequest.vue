<script setup>
import { ref, onMounted, computed } from 'vue'
import CashReleaseReceiptModal from './CashReleaseRecieptModal.vue'
import { useTreasurySCMStore } from '@/stores/Finance Stores/treasurySCMStore'
import Toast from '@/components/Admin Components/HR/Toast.vue'
import { useAuthStore } from '@/stores/Authentication/authStore'

const treasuryStore = useTreasurySCMStore()
const authStore = useAuthStore()

const requests = computed(() => treasuryStore.requests)

const showReleaseModal = ref(false)
const selectedRequest = ref(null)
const releaseAmount = ref(0)
const receiptFile = ref(null)
const loading = ref(false)
const showReceiptModal = ref(false)
const receiptData = ref(null)

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
      </tbody>
    </table>

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
    />

    <Toast
      :show="toast.show"
      :message="toast.message"
      :type="toast.type"
      :customClass="toast.customClass"
    />
  </div>
</template>
