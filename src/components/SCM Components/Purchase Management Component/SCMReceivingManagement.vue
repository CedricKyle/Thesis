<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useDeliveryStore } from '@/stores/SCM Stores/deliveryStore'
import { useAuthStore } from '@/stores/Authentication/authStore'
import { useInventoryStore } from '@/stores/SCM Stores/inventoryStore'
import Toast from '@/components/Admin Components/HR/Toast.vue'

const deliveryStore = useDeliveryStore()
const authStore = useAuthStore()
const inventoryStore = useInventoryStore()

const deliveries = computed(() => deliveryStore.deliveries.filter((d) => d.status === 'Pending'))
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

const categoryOptions = [
  'Food Ingredients',
  'Office Supplies',
  'Kitchen Equipment',
  'Cleaning Supplies',
  'Service Equipment',
  'Raw Materials',
  'Packaging Materials',
  'Others',
]

// Date filter for Received Supplies History
const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1)
const yearOptions = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i)

const selectedMonth = ref(new Date().getMonth() + 1)
const selectedYear = ref(new Date().getFullYear())

function isSameMonthYear(dateStr, month, year) {
  const d = new Date(dateStr)
  return d.getMonth() + 1 === month && d.getFullYear() === year
}

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

const receivedHistory = computed(() =>
  deliveryStore.deliveries.filter((d) => d.status === 'Received'),
)
const paidReceivings = ref(new Set()) // Store paid IDs

// Fetch deliveries on mount
onMounted(() => {
  deliveryStore.fetchDeliveries()
  inventoryStore.fetchInventory()
})

// Filter received history by month/year
const filteredReceivedHistory = computed(() =>
  receivedHistory.value.filter((rec) =>
    isSameMonthYear(rec.delivery_date, selectedMonth.value, selectedYear.value),
  ),
)

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
    // 1. Prepare items for backend
    const preparedItems = editItems.value.map((item) => {
      let item_code = ''
      if (item.stockStatus === 'Restock') {
        item_code = item.selectedItemCode
      }
      // Only send reorder_point if user set it, otherwise let backend handle default
      let reorder_point = item.reorder_point
      if (
        reorder_point === undefined ||
        reorder_point === null ||
        reorder_point === '' ||
        isNaN(reorder_point)
      ) {
        reorder_point = undefined
      }
      return {
        ...item,
        item_code,
        category: item.selectedCategory || '',
        reorder_point: item.stockStatus === 'New Stock' ? reorder_point : undefined,
      }
    })

    // 2. Update delivery details if edited
    await deliveryStore.updateDelivery(selectedDelivery.value.id, {
      supplier: editSupplier.value,
      delivery_date: editDeliveryDate.value,
      items: preparedItems.filter((item) => item.item_name),
    })

    // 3. Receive delivery (triggers backend inventory logic)
    const response = await deliveryStore.receiveDelivery(selectedDelivery.value.id, {
      received_by: authStore.user?.full_name || 'Unknown User',
      // Add receipt_url, remarks, etc. if needed
    })

    showToast('Delivery received successfully!', 'success')

    // Show generated item codes if any
    if (response?.generatedItemCodes && response.generatedItemCodes.length > 0) {
      const codes = response.generatedItemCodes
        .map((i) => `${i.item_name}: ${i.item_code}`)
        .join('\n')
      showToast('Generated Item Codes:\n' + codes, 'info')
    }
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
    editItems.value = Array.isArray(items)
      ? items.map((item) => ({
          ...item,
          stockStatus: 'New Stock',
          selectedCategory: '',
          selectedItemCode: '',
          reorder_point:
            item.quantity && !isNaN(item.quantity)
              ? Math.max(1, Math.floor(Number(item.quantity) * 0.3)) // never 0 by default
              : undefined,
        }))
      : []
  }
})

// Helper to check if item_code exists in inventory
function getStockStatus(item) {
  if (!item || !item.item_code) return 'New Stock'
  const found = inventoryStore.inventory.find((inv) => inv.item_code === item.item_code)
  return found ? 'Restock' : 'New Stock'
}

// Helper: Get item codes for a category
function getItemCodesByCategory(category) {
  return inventoryStore.inventory
    .filter((inv) => inv.category === category)
    .map((inv) => ({ code: inv.item_code, name: inv.item_name }))
}

function handleStockStatusChange(item) {
  if (item.stockStatus === 'New Stock') {
    // Check if item name exists in inventory
    const existing = inventoryStore.inventory.find(
      (inv) => inv.item_name.trim().toLowerCase() === item.item_name.trim().toLowerCase(),
    )
    if (existing) {
      // Option 1: Show warning
      showToast(
        `Item "${item.item_name}" already exists in inventory. System will auto-restock instead.`,
        'warning',
      )
      // Option 2: Auto-switch to Restock and pre-select item code
      item.stockStatus = 'Restock'
      item.selectedCategory = existing.category
      item.selectedItemCode = existing.item_code
    }
  }
}

// Mark as paid (UI only)
const showMarkAsPaidModal = ref(false)
const selectedReceivingForPaid = ref(null)

function openMarkAsPaidModal(receiving) {
  selectedReceivingForPaid.value = receiving
  showMarkAsPaidModal.value = true
}

async function confirmMarkAsPaid() {
  try {
    await deliveryStore.markAsPaid(
      selectedReceivingForPaid.value.id,
      authStore.user?.full_name || 'Unknown User',
    )
    await deliveryStore.fetchDeliveries()
    showToast('Marked as paid!', 'success')
    showMarkAsPaidModal.value = false
    selectedReceivingForPaid.value = null
  } catch (err) {
    showToast(deliveryStore.error || 'Failed to mark as paid', 'error')
  }
}

// View/Print
const showReceiptModal = ref(false)
const selectedReceiving = ref(null)
const receiptContentRef = ref(null)

function openReceiptModal(receiving) {
  selectedReceiving.value = receiving
  showReceiptModal.value = true
}

function closeReceiptModal() {
  showReceiptModal.value = false
  selectedReceiving.value = null
}

const receiptTotalAmount = computed(() => {
  if (!selectedReceiving.value) return 0
  let items = selectedReceiving.value.items
  if (typeof items === 'string') {
    try {
      items = JSON.parse(items)
    } catch {
      items = []
    }
  }
  if (!Array.isArray(items)) return 0
  return items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0)
})

function printReceipt() {
  const printArea = document.getElementById('print-area')
  const receiptHtml = receiptContentRef.value?.outerHTML
  if (!printArea || !receiptHtml) {
    showToast('Nothing to print!', 'error')
    return
  }
  printArea.innerHTML = receiptHtml
  printArea.style.display = 'block'
  window.print()
  printArea.innerHTML = ''
  printArea.style.display = 'none'
}
</script>

<template>
  <div>
    <h1 class="text-xl font-bold mb-4 text-black">Receiving Management</h1>
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
              class="btn-primaryStyle btn-xs"
              @click="openReceiveModal(delivery)"
            >
              Receive
            </button>
            <button
              v-if="delivery.status === 'Pending'"
              class="btn-errorStyle btn-xs ml-2"
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

    <div class="mt-8">
      <h2 class="text-lg font-bold mb-2 text-black">Received Supplies History</h2>
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
      <table class="table w-full text-xs border border-gray-300">
        <thead class="text-xs text-black">
          <tr>
            <th>Request ID</th>
            <th>Supplier</th>
            <th>Date</th>
            <th>Status</th>
            <th>Paid</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody class="text-xs text-black">
          <tr v-for="receiving in filteredReceivedHistory" :key="receiving.id">
            <td>{{ receiving.request_id }}</td>
            <td>{{ receiving.supplier }}</td>
            <td>{{ new Date(receiving.delivery_date).toLocaleString() }}</td>
            <td>
              <span class="badge badge-success badge-sm badge-outline">Received</span>
            </td>
            <td>
              <span
                :class="{
                  'badge badge-success badge-sm badge-outline': receiving.paid_status === 'Paid',
                  'badge badge-warning badge-sm badge-outline': receiving.paid_status !== 'Paid',
                }"
              >
                {{ receiving.paid_status === 'Paid' ? 'Paid' : 'Unpaid' }}
              </span>
            </td>
            <td>
              <button class="btn-secondaryStyle btn-xs" @click="openReceiptModal(receiving)">
                View
              </button>
              <button
                class="btn-primaryStyle btn-xs ml-1"
                v-if="receiving.paid_status !== 'Paid'"
                @click="openMarkAsPaidModal(receiving)"
              >
                Mark as Paid
              </button>
            </td>
          </tr>
          <tr v-if="!filteredReceivedHistory.length">
            <td colspan="6" class="text-center py-4 text-gray-500">
              No received supplies history for this month.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Receive Modal -->
    <dialog :open="showReceiveModal" class="modal">
      <div class="modal-box bg-white max-w-5xl p-6 rounded-lg shadow-lg">
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
          <b class="text-xs">Supplier:</b>
          <input
            v-model="editSupplier"
            class="input input-sm border border-gray-300 bg-white ml-2"
            placeholder="Supplier"
          />
        </div>
        <div class="mb-2 text-sm text-black">
          <b class="text-xs">Delivery Date:</b>
          <input
            v-model="editDeliveryDate"
            type="datetime-local"
            class="input input-sm border border-gray-300 bg-white ml-2"
          />
        </div>
        <div class="mb-2 text-sm text-black">
          <b>Items:</b>
          <table class="w-full text-xs border border-black mt-2">
            <thead class="text-xs text-black">
              <tr>
                <th class="border px-2 py-1">#</th>
                <th class="border px-2 py-1">Item Name</th>
                <th class="border px-2 py-1">Qty</th>
                <th class="border px-2 py-1">Unit</th>
                <th class="border px-2 py-1">Unit Price</th>
                <th class="border px-2 py-1">Amount</th>
                <th class="border px-2 py-1">Stock Status</th>
                <th class="border px-2 py-1">Category</th>
                <th class="border px-2 py-1">Item Code</th>
                <th class="border px-2 py-1">Reorder Point</th>
              </tr>
            </thead>
            <tbody class="text-xs text-black">
              <tr v-for="(item, idx) in editItems" :key="idx">
                <td class="border px-2 py-1">{{ idx + 1 }}</td>
                <td class="border px-2 py-1">{{ item.item_name }}</td>
                <td class="border px-2 py-1">{{ item.quantity }}</td>
                <td class="border px-2 py-1">{{ item.unit }}</td>
                <td class="border px-2 py-1">{{ item.unit_price }}</td>
                <td class="border px-2 py-1">{{ item.amount }}</td>
                <td class="border px-2 py-1">
                  <select
                    v-model="item.stockStatus"
                    class="select select-xs bg-white border border-gray-300"
                    @change="handleStockStatusChange(item)"
                  >
                    <option value="New Stock">New Stock</option>
                    <option value="Restock">Restock</option>
                  </select>
                </td>
                <td class="border px-2 py-1">
                  <select
                    v-model="item.selectedCategory"
                    class="select select-xs bg-white border border-gray-300 w-[60%]"
                  >
                    <option v-for="cat in categoryOptions" :key="cat" :value="cat">
                      {{ cat }}
                    </option>
                  </select>
                </td>
                <td class="border px-2 py-1" v-if="item.stockStatus === 'Restock'">
                  <select
                    v-model="item.selectedItemCode"
                    class="select select-xs bg-white border border-gray-300"
                  >
                    <option value="">Select Item Code</option>
                    <option
                      v-for="code in getItemCodesByCategory(item.selectedCategory)"
                      :key="code.code"
                      :value="code.code"
                    >
                      {{ code.code }} - {{ code.name }}
                    </option>
                  </select>
                </td>
                <td class="border px-2 py-1">
                  <input
                    v-if="item.stockStatus === 'New Stock'"
                    v-model.number="item.reorder_point"
                    type="number"
                    min="1"
                    class="input input-xs border border-gray-300 w-20"
                    :placeholder="Math.floor(Number(item.quantity) * 0.3)"
                  />
                  <span v-else class="text-gray-400">—</span>
                </td>
              </tr>
              <tr>
                <td colspan="8" class="border px-2 py-1 text-right font-bold">Total Amount</td>
                <td class="border px-2 py-1 font-bold text-center">
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
            <b>Received By:</b> {{ authStore.user?.full_name || 'Charles A. Alvaran' }}
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

    <!-- Receipt Modal -->
    <dialog :open="showReceiptModal" class="modal">
      <div class="modal-box bg-white max-w-2xl p-6 rounded-lg shadow-lg">
        <div v-if="selectedReceiving" ref="receiptContentRef" class="scm-print-area">
          <h3 class="font-bold text-lg text-black mb-2">Receiving Receipt</h3>
          <div class="mb-2 text-xs text-black">
            <b>Request ID:</b> {{ selectedReceiving.request_id }}
          </div>
          <div class="mb-2 text-xs text-black">
            <b>Supplier:</b> {{ selectedReceiving.supplier }}
          </div>
          <div class="mb-2 text-xs text-black">
            <b>Date:</b> {{ new Date(selectedReceiving.delivery_date).toLocaleString() }}
          </div>
          <div class="mb-2 text-xs text-black">
            <b>Status:</b> <span class="badge badge-success badge-sm badge-outline">Received</span>
          </div>
          <div class="mb-2 text-xs text-black">
            <b>Paid:</b>
            <span
              :class="{
                'badge badge-success badge-sm badge-outline':
                  selectedReceiving.paid_status === 'Paid',
                'badge badge-warning badge-sm badge-outline':
                  selectedReceiving.paid_status !== 'Paid',
              }"
            >
              {{ selectedReceiving.paid_status === 'Paid' ? 'Paid' : 'Unpaid' }}
            </span>
          </div>
          <div class="mt-2">
            <b class="text-xs text-black">Items:</b>
            <table class="table w-full text-xs border border-gray-300 mt-2">
              <thead class="text-xs text-black">
                <tr>
                  <th>Item Name</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Unit Price</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody class="text-xs text-black">
                <tr
                  v-for="item in typeof selectedReceiving.items === 'string'
                    ? JSON.parse(selectedReceiving.items)
                    : selectedReceiving.items"
                  :key="item.id"
                >
                  <td>{{ item.item_name }}</td>
                  <td>{{ item.quantity }}</td>
                  <td>{{ item.unit }}</td>
                  <td>{{ item.unit_price }}</td>
                  <td>{{ item.amount }}</td>
                </tr>
                <tr>
                  <td colspan="4" class="text-right font-bold">Total Amount</td>
                  <td class="font-bold">
                    {{
                      receiptTotalAmount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="mt-2 text-right text-base font-bold text-black">
            Grand Total: ₱{{
              receiptTotalAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            }}
          </div>

          <!-- Signature lines -->
          <div class="mt-8 pt-8 flex flex-row justify-between items-end">
            <div class="flex flex-col items-center w-1/3">
              <div class="border-t border-gray-400 w-40 mb-1"></div>
              <div class="text-xs text-gray-600">Supplier Signature over printed name</div>
            </div>
            <div class="flex flex-col items-center w-1/3">
              <div class="border-t border-gray-400 w-40 mb-1"></div>
              <div class="text-xs text-gray-600">Received By (Warehouse/Inventory)</div>
            </div>
          </div>
        </div>
        <div class="flex justify-end mt-4">
          <button class="btn-secondaryStyle mr-2" @click="closeReceiptModal">Close</button>
          <button class="btn-primaryStyle" @click="printReceipt">Print</button>
        </div>
      </div>
    </dialog>

    <!-- Mark as Paid Modal -->
    <dialog :open="showMarkAsPaidModal" class="modal">
      <div class="modal-box bg-white max-w-md p-6 rounded-lg shadow-lg">
        <h3 class="font-bold text-lg text-black mb-2">Confirm Mark as Paid</h3>
        <div class="mb-2 text-sm text-black">
          <b>Request ID:</b> {{ selectedReceivingForPaid?.request_id }}<br />
          <b>Supplier:</b> {{ selectedReceivingForPaid?.supplier }}
        </div>
        <p class="mb-4 text-sm text-black">Are you sure you want to mark this delivery as paid?</p>
        <div class="flex justify-end gap-4 mt-4">
          <button class="btn-secondaryStyle" @click="showMarkAsPaidModal = false">Cancel</button>
          <button class="btn-primaryStyle" @click="confirmMarkAsPaid">Yes, Mark as Paid</button>
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
