<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useDeliveryStore } from '@/stores/SCM Stores/deliveryStore'
import { useAuthStore } from '@/stores/Authentication/authStore'
import Toast from '@/components/Admin Components/HR/Toast.vue'

const deliveryStore = useDeliveryStore()
const authStore = useAuthStore()

const deliveries = computed(() => deliveryStore.deliveries)
const loading = computed(() => deliveryStore.loading)
const error = computed(() => deliveryStore.error)

const showReceiveModal = ref(false)
const selectedDelivery = ref(null)
const showCancelModal = ref(false)
const cancelDelivery = ref(null)
const cancelReason = ref('')
const showConfirmModal = ref(false)

const toast = ref({
  show: false,
  message: '',
  type: 'info',
  customClass: '',
})

const editSupplier = ref('')
const editDeliveryDate = ref('')
const editItems = ref([])

const computedTotalAmount = computed(() => {
  let items = selectedDelivery.value?.items
  if (typeof items === 'string') {
    try {
      items = JSON.parse(items)
    } catch {
      items = []
    }
  }
  if (!Array.isArray(items)) return 0
  return items
    .filter((i) => i.item_name)
    .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0)
})

function showToast(message, type = 'info', customClass = '') {
  toast.value = { show: true, message, type, customClass }
  setTimeout(() => {
    toast.value.show = false
  }, 2500)
}

// Fetch deliveries on mount
onMounted(() => {
  deliveryStore.fetchDeliveries()
})

function openReceiveModal(delivery) {
  selectedDelivery.value = delivery
  showReceiveModal.value = true
}
function closeReceiveModal() {
  showReceiveModal.value = false
  selectedDelivery.value = null
}
async function confirmReceive() {
  try {
    // 1. Update delivery details if edited
    await deliveryStore.updateDelivery(selectedDelivery.value.id, {
      supplier: editSupplier.value,
      delivery_date: editDeliveryDate.value,
      items: editItems.value.filter((item) => item.item_name),
    })
    console.log('authStore.user:', authStore.user)
    await deliveryStore.receiveDelivery(selectedDelivery.value.id, {
      received_by: authStore.user?.full_name || 'Unknown User',
      // Add receipt_url, remarks, etc. if needed
    })
    showToast('Delivery received successfully!', 'success')
  } catch (err) {
    showToast(deliveryStore.error || 'Failed to receive delivery', 'error')
  }
  closeReceiveModal()
}

function openCancelModal(delivery) {
  cancelDelivery.value = delivery
  cancelReason.value = ''
  showCancelModal.value = true
}
function closeCancelModal() {
  showCancelModal.value = false
  cancelDelivery.value = null
  cancelReason.value = ''
}
async function confirmCancelDelivery() {
  try {
    await deliveryStore.cancelDelivery(cancelDelivery.value.id, {
      canceled_by: authStore.user?.full_name || 'Unknown User',
      cancel_reason: cancelReason.value,
    })
    showToast('Delivery canceled successfully!', 'success')
  } catch (err) {
    showToast(deliveryStore.error || 'Failed to cancel delivery', 'error')
  }
  closeCancelModal()
}

function handleConfirmReceive() {
  showConfirmModal.value = false
  confirmReceive()
}

watch(error, (val) => {
  if (val) showToast(val, 'error')
})

function toDatetimeLocal(date) {
  if (!date) return ''
  const d = new Date(date)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

watch(showReceiveModal, (val) => {
  if (val && selectedDelivery.value) {
    editSupplier.value = selectedDelivery.value.supplier
    editDeliveryDate.value = toDatetimeLocal(selectedDelivery.value.delivery_date)
    let items = selectedDelivery.value.items
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items)
      } catch (e) {
        items = []
      }
    }
    editItems.value = Array.isArray(items) ? items.map((item) => ({ ...item })) : []
  }
})
</script>

<template>
  <div>
    <h1 class="text-xl font-bold mb-4">Receiving Management</h1>
    <table class="w-full text-xs border border-gray-300 mb-6">
      <thead class="bg-primaryColor text-white">
        <tr>
          <th class="border px-2 py-1">Request ID</th>
          <th class="border px-2 py-1">Supplier</th>
          <th class="border px-2 py-1">Delivery Date</th>
          <th class="border px-2 py-1">Status</th>
          <th class="border px-2 py-1">Action</th>
        </tr>
      </thead>
      <tbody class="text-xs text-black">
        <tr v-if="loading">
          <td colspan="5" class="text-center py-4 text-gray-500">Loading...</td>
        </tr>
        <tr v-if="error">
          <td colspan="5" class="text-center py-4 text-red-500">{{ error }}</td>
        </tr>
        <tr v-for="delivery in deliveries" :key="delivery.id">
          <td class="border px-2 py-1">{{ delivery.request_id }}</td>
          <td class="border px-2 py-1">{{ delivery.supplier }}</td>
          <td class="border px-2 py-1">
            {{ new Date(delivery.delivery_date).toLocaleString() }}
          </td>
          <td class="border px-2 py-1">
            <span
              :class="{
                'badge badge-outline badge-warning text-xs badge-sm': delivery.status === 'Pending',
                'badge badge-outline badge-success text-xs badge-sm':
                  delivery.status === 'Received',
              }"
            >
              {{ delivery.status }}
            </span>
          </td>
          <td class="border px-2 py-1">
            <button
              v-if="delivery.status === 'Pending'"
              class="btn btn-xs btn-primary"
              @click="openReceiveModal(delivery)"
            >
              Receive
            </button>
            <button
              v-if="delivery.status === 'Pending'"
              class="btn btn-xs btn-error ml-2"
              @click="openCancelModal(delivery)"
            >
              Cancel
            </button>
            <span v-else-if="delivery.status === 'Received'" class="text-green-700 font-bold"
              >Received</span
            >
            <span v-else-if="delivery.status === 'Canceled'" class="text-red-700 font-bold"
              >Canceled</span
            >
          </td>
        </tr>
        <tr v-if="!loading && !deliveries.length">
          <td colspan="5" class="text-center py-4 text-gray-500">No deliveries to receive</td>
        </tr>
      </tbody>
    </table>

    <!-- Receive Modal -->
    <dialog :open="showReceiveModal" class="modal">
      <div class="modal-box bg-white max-w-2xl p-6 rounded-lg shadow-lg">
        <div class="flex justify-between items-center mb-2 text-xs text-black">
          <div>
            <div class="font-bold text-lg text-secondaryColor">Countryside</div>
            <div class="font-semibold text-xs">Receiving Receipt</div>
          </div>
          <div class="text-xs text-gray-500">
            {{ new Date(selectedDelivery?.delivery_date || Date.now()).toLocaleString() }}
            <div class="mb-2"><b>Request ID:</b> {{ selectedDelivery?.request_id }}</div>
          </div>
        </div>
        <div class="mb-2 text-sm text-black">
          <b>Supplier:</b>
          <input
            v-model="editSupplier"
            class="input input-sm w-1/2 border border-gray-300 bg-white ml-2"
            placeholder="Supplier"
          />
        </div>
        <div class="mb-2 text-sm text-black">
          <b>Delivery Date:</b>
          <input
            v-model="editDeliveryDate"
            type="datetime-local"
            class="input input-sm border border-gray-300 bg-white ml-2"
          />
        </div>
        <div class="mb-2 text-sm text-black">
          <b>Items:</b>
          <table class="w-full text-xs border border-gray-300 mt-2">
            <thead class="text-xs text-black">
              <tr>
                <th class="border px-2 py-1">#</th>
                <th class="border px-2 py-1">Item Name</th>
                <th class="border px-2 py-1">Qty</th>
                <th class="border px-2 py-1">Unit</th>
                <th class="border px-2 py-1">Unit Price</th>
                <th class="border px-2 py-1">Amount</th>
              </tr>
            </thead>
            <tbody class="text-xs text-black">
              <tr
                v-for="(item, idx) in Array.isArray(selectedDelivery?.items)
                  ? selectedDelivery.items.filter((i) => i.item_name)
                  : typeof selectedDelivery?.items === 'string'
                    ? JSON.parse(selectedDelivery.items).filter((i) => i.item_name)
                    : []"
                :key="idx"
              >
                <td class="border px-2 py-1">{{ idx + 1 }}</td>
                <td class="border px-2 py-1">{{ item.item_name }}</td>
                <td class="border px-2 py-1">{{ item.quantity }}</td>
                <td class="border px-2 py-1">{{ item.unit }}</td>
                <td class="border px-2 py-1">{{ item.unit_price }}</td>
                <td class="border px-2 py-1">{{ item.amount }}</td>
              </tr>
              <tr>
                <td colspan="5" class="border px-2 py-1 text-right font-bold">Total Amount</td>
                <td class="border px-2 py-1 font-bold">
                  {{
                    Number(selectedDelivery?.SCMRequest?.total_amount || 0).toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                    )
                  }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="text-xs text-black">
          <b>Description/Remarks:</b>
          <input
            type="text"
            class="input input-sm w-full border border-gray-300 bg-white"
            placeholder="Enter remarks (optional)"
          />
        </div>
        <div class="flex justify-between items-center">
          <div class="text-xs text-black mt-1">
            <b>Attach Delivery Receipt (optional):</b>
            <input type="file" class="input input-sm border border-gray-300 bg-white" />
          </div>

          <div class="text-xs text-black">
            <b>Received By:</b> Cedric Kyle D. Belisario
            <!-- Replace with current user -->
          </div>
        </div>
        <div class="flex justify-end gap-4 mt-4">
          <button class="btn-secondaryStyle" @click="closeReceiveModal">Cancel</button>
          <button class="btn-primaryStyle" @click="showConfirmModal = true">Confirm Receive</button>
        </div>
      </div>
    </dialog>

    <!-- Confirmation Modal -->
    <dialog :open="showConfirmModal" class="modal">
      <div class="modal-box bg-white max-w-md p-6 rounded-lg shadow-lg">
        <h3 class="font-bold text-lg text-black mb-2">Confirm Receive</h3>
        <p class="mb-4 text-sm text-black">
          Are you sure you want to confirm receipt of this delivery?
        </p>
        <div class="flex justify-end gap-4 mt-4">
          <button class="btn-secondaryStyle" @click="showConfirmModal = false">Cancel</button>
          <button class="btn-primaryStyle" @click="handleConfirmReceive">Yes, Confirm</button>
        </div>
      </div>
    </dialog>

    <!-- Cancel Modal -->
    <dialog :open="showCancelModal" class="modal">
      <div class="modal-box bg-white max-w-md p-6 rounded-lg shadow-lg">
        <h3 class="font-bold text-lg text-black mb-2">Cancel Delivery</h3>
        <div class="mb-2 text-sm text-black">
          <b>Request ID:</b> {{ cancelDelivery?.request_id }}<br />
          <b>Supplier:</b> {{ cancelDelivery?.supplier }}
        </div>
        <div class="mb-2 text-sm text-black">
          <b>Reason for cancellation:</b>
          <textarea
            v-model="cancelReason"
            class="textarea w-full border border-gray-300 bg-white"
            placeholder="Enter reason"
          />
        </div>
        <div class="flex justify-end gap-4 mt-4">
          <button class="btn-secondaryStyle" @click="closeCancelModal">No, Keep</button>
          <button class="btn-errorStyle" @click="confirmCancelDelivery">Yes, Cancel</button>
        </div>
      </div>
    </dialog>

    <Toast
      :show="toast.show"
      :message="toast.message"
      :type="toast.type"
      :customClass="toast.customClass"
    />
  </div>
</template>
