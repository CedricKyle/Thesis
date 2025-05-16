<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useDeliveryStore } from '@/stores/SCM Stores/deliveryStore'
import { useInventoryStore } from '@/stores/SCM Stores/inventoryStore'
import { PERMISSION_IDS } from '@/composables/Admin Composables/User & Role/role/permissionsId'
import { useAuthStore } from '@/stores/Authentication/authStore'
import Toast from '@/components/Admin Components/HR/Toast.vue'
import { Pencil } from 'lucide-vue-next'
import { useInventoryStockStore } from '@/stores/SCM Stores/inventoryStockStore'

// State Management
const activeTab = ref('monitoring') // monitoring, stock-in, stock-out, adjustment
const searchQuery = ref('')
const filterType = ref('all')

const deliveryStore = useDeliveryStore()
const inventoryStore = useInventoryStore()
const authStore = useAuthStore()
const inventoryStockStore = useInventoryStockStore()

const toast = ref({
  show: false,
  message: '',
  type: 'info',
  customClass: '',
})

const showEditModal = ref(false)
const editItem = ref(null)
const editReorderPoint = ref(0)

const monitoringPage = ref(1)
const monitoringRowsPerPage = ref(10)

const monitoringTotalPages = computed(() =>
  Math.ceil(filteredInventory.value.length / monitoringRowsPerPage.value),
)

const paginatedInventory = computed(() =>
  filteredInventory.value.slice(
    (monitoringPage.value - 1) * monitoringRowsPerPage.value,
    monitoringPage.value * monitoringRowsPerPage.value,
  ),
)

const showStockInModal = ref(false)
const showStockOutModal = ref(false)
const selectedItem = ref(null)

const stockInForm = ref({
  item_code: '',
  quantity: 0,
  unit: '',
  date: new Date().toISOString().split('T')[0],
  supplier: '',
  remarks: '',
  document: null,
})

const stockOutForm = ref({
  item_code: '',
  quantity: 0,
  unit: '',
  date: new Date().toISOString().split('T')[0],
  reason: '',
  remarks: '',
  document: null,
})

function showToast(message, type = 'info', customClass = '') {
  toast.value = { show: true, message, type, customClass }
  setTimeout(() => {
    toast.value.show = false
  }, 2500)
}

onMounted(() => {
  inventoryStore.fetchInventory()
  deliveryStore.fetchDeliveries()
  inventoryStockStore.fetchStockIns()
  inventoryStockStore.fetchStockOuts()
})

// Computed Properties
const filteredInventory = computed(() => {
  return inventoryStore.inventory.filter((item) => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesType = filterType.value === 'all' || item.category === filterType.value
    return matchesSearch && matchesType
  })
})

// Stats Computed Properties
const stats = computed(() => ({
  total: inventoryStore.inventory.length,
  inStock: inventoryStore.inventory.filter((i) => i.quantity > i.reorder_point).length,
  lowStock: inventoryStore.inventory.filter((i) => i.quantity <= i.reorder_point && i.quantity > 0)
    .length,
  outOfStock: inventoryStore.inventory.filter((i) => i.quantity === 0).length,
}))

const receivedDeliveries = computed(() =>
  deliveryStore.deliveries
    .filter((delivery) => delivery.status === 'Received')
    .map((delivery) => ({
      ...delivery,
      items: typeof delivery.items === 'string' ? JSON.parse(delivery.items) : delivery.items,
    })),
)

const canEditReorderPoint = computed(() => true)

const uniqueCategories = computed(() => {
  const categories = new Set(inventoryStore.inventory.map((item) => item.category))
  return Array.from(categories).sort()
})

async function confirmAndReceiveDelivery(deliveryId, deliveryPayload, receivingPayload) {
  try {
    // 1. Mark delivery as received
    await deliveryStore.receiveDelivery(deliveryId, deliveryPayload)
    // 2. Refresh inventory
    await inventoryStore.fetchInventory()
    alert('Delivery received and inventory updated!')
  } catch (err) {
    alert('Error: ' + err)
  }
}

async function updateReorderPoint(item) {
  try {
    await inventoryStore.updateInventory(item.item_code, { reorder_point: item.reorder_point })
    showToast('Min. Stock Level updated!', 'success')
  } catch (err) {
    showToast('Failed to update Min. Stock Level', 'error')
  }
}

function openEditModal(item) {
  editItem.value = item
  editReorderPoint.value = item.reorder_point
  showEditModal.value = true
}

async function saveEditReorderPoint() {
  try {
    await inventoryStore.updateInventory(editItem.value.item_code, {
      reorder_point: editReorderPoint.value,
    })
    showToast('Min. Stock Level updated!', 'success')
    showEditModal.value = false
    editItem.value = null
  } catch (err) {
    showToast('Failed to update Min. Stock Level', 'error')
  }
}

watch([searchQuery, filterType], () => {
  monitoringPage.value = 1
})

async function handleStockIn() {
  try {
    await inventoryStockStore.createStockIn(stockInForm.value)
    await inventoryStore.fetchInventory() // Refresh inventory
    showStockInModal.value = false
    showToast('Stock in recorded successfully!', 'success')
    // Reset form
    stockInForm.value = {
      item_code: '',
      quantity: 0,
      unit: '',
      date: new Date().toISOString().split('T')[0],
      supplier: '',
      remarks: '',
      document: null,
    }
  } catch (err) {
    showToast(err.response?.data?.message || 'Failed to record stock in', 'error')
  }
}

async function handleStockOut() {
  try {
    await inventoryStockStore.createStockOut(stockOutForm.value)
    await inventoryStore.fetchInventory() // Refresh inventory
    showStockOutModal.value = false
    showToast('Stock out recorded successfully!', 'success')
    // Reset form
    stockOutForm.value = {
      item_code: '',
      quantity: 0,
      unit: '',
      date: new Date().toISOString().split('T')[0],
      reason: '',
      remarks: '',
      document: null,
    }
  } catch (err) {
    showToast(err.response?.data?.message || 'Failed to record stock out', 'error')
  }
}

function openStockInModal(item) {
  selectedItem.value = item
  stockInForm.value = {
    ...stockInForm.value,
    item_code: item.item_code,
    unit: item.unit,
  }
  showStockInModal.value = true
}

function openStockOutModal(item) {
  selectedItem.value = item
  stockOutForm.value = {
    ...stockOutForm.value,
    item_code: item.item_code,
    unit: item.unit,
  }
  showStockOutModal.value = true
}
</script>

<template>
  <div class="bg-white rounded-lg shadow">
    <!-- Header -->
    <div class="p-4 border-b">
      <h1 class="text-xl font-bold text-gray-800">Inventory Management System</h1>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex border-b px-4">
      <button
        v-for="tab in ['monitoring', 'stock-in', 'stock-out', 'adjustment']"
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
          tab
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
        }}
      </button>
      <button
        @click="activeTab = 'received-deliveries'"
        :class="[
          'px-4 py-2 text-sm font-medium border-b-2 -mb-px',
          activeTab === 'received-deliveries'
            ? 'border-primaryColor text-primaryColor'
            : 'border-transparent text-gray-500 hover:text-gray-700',
        ]"
      >
        Received Deliveries
      </button>
    </div>

    <!-- Content Area -->
    <div class="p-4">
      <!-- Monitoring Tab -->
      <div v-if="activeTab === 'monitoring'">
        <!-- Search and Filter -->
        <div class="flex justify-between items-center mb-4">
          <div class="flex gap-4">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search items..."
              class="input-search input-sm w-64 border border-black"
            />
            <select
              v-model="filterType"
              class="select !bg-white !border-black !text-black select-bordered select-sm"
            >
              <option value="all">All Items</option>
              <option v-for="category in uniqueCategories" :key="category" :value="category">
                {{
                  category
                    .split('_')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')
                }}
              </option>
            </select>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-4 gap-4 mb-6">
          <div class="stat bg-blue-50 rounded-lg p-4">
            <div class="stat-title text-xs text-gray-500">Total Items</div>
            <div class="stat-value text-blue-500 text-2xl">{{ stats.total }}</div>
          </div>
          <div class="stat bg-green-50 rounded-lg p-4">
            <div class="stat-title text-xs text-gray-500">In Stock</div>
            <div class="stat-value text-green-500 text-2xl">{{ stats.inStock }}</div>
          </div>
          <div class="stat bg-yellow-50 rounded-lg p-4">
            <div class="stat-title text-xs text-gray-500">Low Stock</div>
            <div class="stat-value text-yellow-500 text-2xl">{{ stats.lowStock }}</div>
          </div>
          <div class="stat bg-red-50 rounded-lg p-4">
            <div class="stat-title text-xs text-gray-500">Out of Stock</div>
            <div class="stat-value text-red-500 text-2xl">{{ stats.outOfStock }}</div>
          </div>
        </div>

        <!-- Inventory Table -->
        <div class="overflow-x-auto">
          <table class="table table-compact w-full">
            <thead>
              <tr class="bg-primaryColor text-white">
                <th class="text-xs">Item Code</th>
                <th class="text-xs">Item Name</th>
                <th class="text-xs">Type</th>
                <th class="text-xs">Current Stock</th>
                <th class="text-xs">Unit</th>
                <th class="text-xs">Min. Stock Level</th>
                <th class="text-xs">Status</th>
                <th class="text-xs">Last Updated</th>
              </tr>
            </thead>
            <tbody class="text-xs text-black">
              <tr
                v-for="item in paginatedInventory"
                :key="item.id"
                class="text-xs hover:bg-gray-50"
              >
                <td>{{ item.item_code }}</td>
                <td>{{ item.item_name }}</td>
                <td>{{ item.category }}</td>
                <td>{{ item.quantity }}</td>
                <td>{{ item.unit }}</td>
                <td>
                  {{ item.reorder_point }}
                  <button
                    v-if="canEditReorderPoint"
                    class="cursor-pointer btn-xs ml-2"
                    @click="openEditModal(item)"
                    title="Edit Min. Stock Level"
                  >
                    <Pencil class="w-3 h-3" />
                  </button>
                </td>
                <td>
                  <span
                    :class="{
                      'badge badge-sm badge-success badge-outline':
                        item.quantity > item.reorder_point,
                      'badge badge-sm badge-warning badge-outline':
                        item.quantity <= item.reorder_point && item.quantity > 0,
                      'badge badge-sm badge-error badge-outline': item.quantity === 0,
                    }"
                  >
                    {{
                      item.quantity > item.reorder_point
                        ? 'In Stock'
                        : item.quantity === 0
                          ? 'Out of Stock'
                          : 'Low Stock'
                    }}
                  </span>
                </td>
                <td>{{ new Date(item.updated_at).toLocaleDateString() }}</td>
              </tr>
              <tr v-if="!paginatedInventory.length">
                <td colspan="8" class="text-center py-4 text-gray-500">No data available</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex items-center gap-2 mt-4">
          <span class="text-black text-xs">Page</span>
          <select
            class="select !bg-white !border-black !text-black select-xs w-16"
            v-model="monitoringPage"
            :disabled="monitoringTotalPages <= 1"
            @change="() => $nextTick(() => window.scrollTo(0, 0))"
          >
            <option v-for="page in monitoringTotalPages" :key="page" :value="page">
              {{ page }}
            </option>
          </select>
          <span class="text-black text-xs">of {{ monitoringTotalPages }}</span>
          <span class="ml-4 text-xs text-black">Rows per page:</span>
          <select
            class="select !bg-white !border-black !text-black select-xs w-16"
            v-model="monitoringRowsPerPage"
            @change="monitoringPage = 1"
          >
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
          </select>
        </div>

        <div class="flex justify-end mt-4">
          <button class="btn-secondaryStyle" @click="inventoryStore.fetchInventory()">
            Refresh Inventory
          </button>
        </div>
      </div>

      <!-- Stock In Tab -->
      <div v-if="activeTab === 'stock-in'">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-bold text-black">Stock In</h2>
        </div>

        <div class="overflow-x-auto">
          <table class="table table-compact w-full">
            <thead>
              <tr class="bg-primaryColor text-white">
                <th class="text-xs">Item Code</th>
                <th class="text-xs">Item Name</th>
                <th class="text-xs">Current Stock</th>
                <th class="text-xs">Unit</th>
                <th class="text-xs">Action</th>
              </tr>
            </thead>
            <tbody class="text-xs text-black">
              <tr v-for="item in inventoryStore.inventory" :key="item.id" class="hover:bg-gray-50">
                <td>{{ item.item_code }}</td>
                <td>{{ item.item_name }}</td>
                <td>{{ item.quantity }}</td>
                <td>{{ item.unit }}</td>
                <td>
                  <button class="btn-secondaryStyle btn-xs" @click="openStockInModal(item)">
                    Stock In
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Stock Out Tab -->
      <div v-if="activeTab === 'stock-out'">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-bold text-black">Stock Out</h2>
        </div>

        <div class="overflow-x-auto">
          <table class="table table-compact w-full">
            <thead>
              <tr class="bg-primaryColor text-white">
                <th class="text-xs">Item Code</th>
                <th class="text-xs">Item Name</th>
                <th class="text-xs">Current Stock</th>
                <th class="text-xs">Unit</th>
                <th class="text-xs">Action</th>
              </tr>
            </thead>
            <tbody class="text-xs text-black">
              <tr v-for="item in inventoryStore.inventory" :key="item.id" class="hover:bg-gray-50">
                <td>{{ item.item_code }}</td>
                <td>{{ item.item_name }}</td>
                <td>{{ item.quantity }}</td>
                <td>{{ item.unit }}</td>
                <td>
                  <button
                    class="btn-secondaryStyle btn-xs"
                    @click="openStockOutModal(item)"
                    :disabled="item.quantity <= 0"
                  >
                    Stock Out
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Adjustment Tab -->
      <div v-if="activeTab === 'adjustment'" class="text-center py-8 text-gray-500">
        Stock Adjustment functionality coming soon...
      </div>

      <!-- Received Deliveries Tab -->
      <div v-if="activeTab === 'received-deliveries'">
        <h2 class="text-lg font-bold mb-2 text-black">Received Deliveries</h2>
        <div
          v-for="delivery in receivedDeliveries"
          :key="delivery.id"
          class="mb-6 border rounded p-4"
        >
          <div class="mb-2 text-xs text-black">
            <strong>Supplier:</strong> {{ delivery.supplier }}<br />
            <strong>Delivery Date:</strong> {{ new Date(delivery.delivery_date).toLocaleString()
            }}<br />
            <strong>Received By:</strong> {{ delivery.received_by }}
          </div>
          <table class="table table-compact w-full">
            <thead class="text-xs text-black">
              <tr>
                <th>Item Name</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Unit Price</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody class="text-xs text-black">
              <tr v-for="item in delivery.items" :key="item.id">
                <td>{{ item.item_name }}</td>
                <td>{{ item.quantity }}</td>
                <td>{{ item.unit }}</td>
                <td>{{ item.unit_price }}</td>
                <td>{{ item.amount }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <Toast
    :show="toast.show"
    :message="toast.message"
    :type="toast.type"
    :customClass="toast.customClass"
  />

  <dialog :open="showEditModal" class="modal">
    <div class="modal-box bg-white max-w-xs p-6 rounded-lg shadow-lg">
      <h3 class="font-bold text-md text-black mb-2">Edit Min. Stock Level</h3>
      <div class="mb-2 text-sm text-black">
        <b>Item:</b> {{ editItem?.item_name }}<br />
        <b>Current Min. Stock Level:</b> {{ editItem?.reorder_point }}
      </div>
      <div class="mb-4">
        <label class="block text-xs mb-1 text-black">New Min. Stock Level</label>
        <input
          v-model.number="editReorderPoint"
          type="number"
          min="0"
          class="input-search input-sm w-full border border-gray-300"
        />
      </div>
      <div class="flex justify-end gap-2">
        <button class="btn-secondaryStyle" @click="showEditModal = false">Cancel</button>
        <button class="btn-primaryStyle" @click="saveEditReorderPoint">Save</button>
      </div>
    </div>
  </dialog>

  <!-- Stock In Modal -->
  <dialog :open="showStockInModal" class="modal">
    <div class="modal-box bg-white max-w-md p-6 rounded-lg shadow-lg">
      <h3 class="font-bold text-lg text-black mb-4">Stock In</h3>
      <div class="mb-4">
        <label class="block text-sm font-medium text-black mb-1">Item</label>
        <input
          type="text"
          :value="selectedItem?.item_name"
          class="input-search w-full border border-black bg-white text-black"
          :class="{ 'bg-gray-600': !selectedItem }"
          disabled
        />
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium text-black mb-1">Quantity</label>
        <input
          v-model.number="stockInForm.quantity"
          type="number"
          min="1"
          class="input-search w-full"
        />
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium text-black mb-1">Date</label>
        <input v-model="stockInForm.date" type="date" class="input-search w-full" />
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium text-black mb-1">Supplier</label>
        <input v-model="stockInForm.supplier" type="text" class="input-search w-full" />
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium text-black mb-1">Remarks</label>
        <textarea
          v-model="stockInForm.remarks"
          class="textarea textarea-bordered w-full border border-black bg-white text-black"
          rows="3"
        ></textarea>
      </div>
      <div class="flex justify-end gap-2">
        <button class="btn-secondaryStyle" @click="showStockInModal = false">Cancel</button>
        <button class="btn-primaryStyle" @click="handleStockIn">Confirm</button>
      </div>
    </div>
  </dialog>

  <!-- Stock Out Modal -->
  <dialog :open="showStockOutModal" class="modal">
    <div class="modal-box bg-white max-w-md p-6 rounded-lg shadow-lg">
      <h3 class="font-bold text-lg text-black mb-4">Stock Out</h3>
      <div class="mb-4">
        <label class="block text-sm font-medium text-black mb-1">Item</label>
        <input
          type="text"
          :value="selectedItem?.item_name"
          class="input input-bordered w-full"
          disabled
        />
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium text-black mb-1">Quantity</label>
        <input
          v-model.number="stockOutForm.quantity"
          type="number"
          min="1"
          :max="selectedItem?.quantity"
          class="input input-bordered w-full"
        />
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium text-black mb-1">Date</label>
        <input v-model="stockOutForm.date" type="date" class="input input-bordered w-full" />
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium text-black mb-1">Reason</label>
        <input v-model="stockOutForm.reason" type="text" class="input input-bordered w-full" />
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium text-black mb-1">Remarks</label>
        <textarea
          v-model="stockOutForm.remarks"
          class="textarea textarea-bordered w-full"
          rows="3"
        ></textarea>
      </div>
      <div class="flex justify-end gap-2">
        <button class="btn-secondaryStyle" @click="showStockOutModal = false">Cancel</button>
        <button class="btn-primaryStyle" @click="handleStockOut">Confirm</button>
      </div>
    </div>
  </dialog>
</template>
