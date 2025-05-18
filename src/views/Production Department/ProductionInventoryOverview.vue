<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useProductionBatchStore } from '@/stores/Production Store/productionBatchStore'
import Toast from '@/components/Admin Components/HR/Toast.vue'
import axios from '@/plugins/axios'
import ProductionForecasting from '@/components/Production Component/ProductionForecasting.vue'

// State Management
const activeTab = ref('monitoring') // monitoring, adjustment, forecasting
const searchQuery = ref('')
const productionBatchStore = useProductionBatchStore()

// Forecasting state
const forecastPeriod = ref('weekly') // weekly, monthly, quarterly
const selectedProduct = ref(null)
const forecastData = ref(null)
const isLoadingForecast = ref(false)

// TODO: Import and use production batch store
// const productionBatchStore = useProductionBatchStore()

const toast = ref({
  show: false,
  message: '',
  type: 'info',
  customClass: '',
})

// Pagination
const monitoringPage = ref(1)
const monitoringRowsPerPage = ref(10)

// Stats from store
const stats = computed(() => productionBatchStore.stats)

const finishedGoodsStats = computed(() => {
  const goods = Array.isArray(productionBatchStore.finishedGoods)
    ? productionBatchStore.finishedGoods
    : []
  return {
    total: goods.length,
    inStock: goods.filter(
      (fg) => fg.batch?.primary_stock + fg.batch?.secondary_stock > fg.batch?.reorder_point,
    ).length,
    lowStock: goods.filter(
      (fg) =>
        fg.batch?.primary_stock + fg.batch?.secondary_stock <= fg.batch?.reorder_point &&
        fg.batch?.primary_stock + fg.batch?.secondary_stock > 0,
    ).length,
    outOfStock: goods.filter((fg) => fg.batch?.primary_stock + fg.batch?.secondary_stock === 0)
      .length,
  }
})

// Filtered and paginated inventory
const filteredInventory = computed(() => {
  let filtered = productionBatchStore.batches

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (batch) =>
        batch.batch_number.toLowerCase().includes(query) ||
        batch.product_name.toLowerCase().includes(query),
    )
  }

  return filtered
})

const paginatedInventory = computed(() => {
  return filteredInventory.value.slice(
    (monitoringPage.value - 1) * monitoringRowsPerPage.value,
    monitoringPage.value * monitoringRowsPerPage.value,
  )
})

const monitoringTotalPages = computed(() =>
  Math.ceil(filteredInventory.value.length / monitoringRowsPerPage.value),
)

// Add new ref for modal
const showDetailsModal = ref(false)
const selectedBatch = ref(null)

// Expiring soon, most produced, least used state
const expiringSoon = ref([
  // Example data, replace with API data
  {
    batch_number: 'BN-001',
    product_name: 'Frozen Lumpia',
    expiry_date: '2024-06-10',
    quantity: 50,
    unit: 'packs',
  },
  {
    batch_number: 'BN-002',
    product_name: 'Ready-to-Cook Siomai',
    expiry_date: '2024-06-12',
    quantity: 30,
    unit: 'packs',
  },
])
const mostProduced = ref([
  { product_name: 'Frozen Lumpia', total_produced: 1200, unit: 'packs' },
  { product_name: 'Ready-to-Cook Siomai', total_produced: 950, unit: 'packs' },
])
const leastUsed = ref([
  { product_name: 'Frozen Kikiam', total_used: 20, unit: 'packs' },
  { product_name: 'Ready-to-Cook Tofu', total_used: 15, unit: 'packs' },
])

// Function to view batch details
function viewBatchDetails(batch) {
  selectedBatch.value = batch
  showDetailsModal.value = true
}

function showToast(message, type = 'info', customClass = '') {
  toast.value = { show: true, message, type, customClass }
  setTimeout(() => {
    toast.value.show = false
  }, 2500)
}

// Sample forecast data for all products
const allProductsForecast = ref([
  {
    product_name: 'Frozen Lumpia',
    forecast_period: 'weekly',
    historical_data: [
      { date: '2024-01', actual: 100 },
      { date: '2024-02', actual: 120 },
      { date: '2024-03', actual: 110 },
    ],
    forecast: [
      { date: '2024-04', predicted: 115, lower_bound: 105, upper_bound: 125 },
      { date: '2024-05', predicted: 125, lower_bound: 115, upper_bound: 135 },
      { date: '2024-06', predicted: 130, lower_bound: 120, upper_bound: 140 },
    ],
    metrics: {
      mae: 5.2,
      rmse: 6.8,
      accuracy: 0.92,
    },
  },
  {
    product_name: 'Ready-to-Cook Siomai',
    forecast_period: 'weekly',
    historical_data: [
      { date: '2024-01', actual: 80 },
      { date: '2024-02', actual: 95 },
      { date: '2024-03', actual: 85 },
    ],
    forecast: [
      { date: '2024-04', predicted: 90, lower_bound: 80, upper_bound: 100 },
      { date: '2024-05', predicted: 95, lower_bound: 85, upper_bound: 105 },
      { date: '2024-06', predicted: 100, lower_bound: 90, upper_bound: 110 },
    ],
    metrics: {
      mae: 4.5,
      rmse: 5.8,
      accuracy: 0.89,
    },
  },
  {
    product_name: 'Frozen Kikiam',
    forecast_period: 'weekly',
    historical_data: [
      { date: '2024-01', actual: 60 },
      { date: '2024-02', actual: 75 },
      { date: '2024-03', actual: 65 },
    ],
    forecast: [
      { date: '2024-04', predicted: 70, lower_bound: 60, upper_bound: 80 },
      { date: '2024-05', predicted: 75, lower_bound: 65, upper_bound: 85 },
      { date: '2024-06', predicted: 80, lower_bound: 70, upper_bound: 90 },
    ],
    metrics: {
      mae: 3.8,
      rmse: 4.9,
      accuracy: 0.91,
    },
  },
])

// Update the generateForecast function
async function generateForecast() {
  isLoadingForecast.value = true
  try {
    const response = await productionBatchStore.generateForecast(forecastPeriod.value)
    forecastData.value = response
    showToast('Forecast generated!', 'success')
  } catch (error) {
    showToast('Error generating forecast', 'error')
  } finally {
    isLoadingForecast.value = false
  }
}

onMounted(async () => {
  try {
    await productionBatchStore.fetchBatches()
    await productionBatchStore.fetchFinishedGoodsWithBatch(false)
  } catch (error) {
    showToast('Error loading batches', 'error')
  }
})

const showAdjustmentModal = ref(false)
const adjustmentGood = ref(null)
const adjustmentType = ref('primary')
const adjustmentQty = ref(0)

function openAdjustmentModal(fg) {
  adjustmentGood.value = fg
  adjustmentType.value = 'primary'
  adjustmentQty.value = 0
  showAdjustmentModal.value = true
}

async function saveAdjustment() {
  try {
    // TODO: Implement backend logic to update the stock
    showToast('Stock adjusted (implement backend logic)', 'success')
    showAdjustmentModal.value = false
    await productionBatchStore.fetchFinishedGoodsWithBatch()
  } catch (err) {
    showToast('Failed to adjust stock', 'error')
  }
}

const isEditing = ref(false)
const editName = ref('')
const editImage = ref('')
const editImageFile = ref(null)

function startEdit() {
  isEditing.value = true
  editName.value = selectedBatch.value.item_name
  editImage.value = selectedBatch.value.image
  editImageFile.value = null
}

function cancelEdit() {
  isEditing.value = false
  editName.value = ''
  editImage.value = ''
  editImageFile.value = null
}

const API_URL = import.meta.env.VITE_API_URL

async function saveEdit() {
  try {
    let imageUrl = editImage.value
    if (editImageFile.value) {
      const formData = new FormData()
      formData.append('image', editImageFile.value)
      const res = await axios.post('/api/production/batch-upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      imageUrl = `${API_URL}` + res.data.imageUrl
    }
    await productionBatchStore.updateFinishedGood({
      id: selectedBatch.value.id,
      item_name: editName.value,
      image: imageUrl,
    })
    showToast('Finished good updated!', 'success')
    isEditing.value = false
    await productionBatchStore.fetchFinishedGoodsWithBatch()
    selectedBatch.value.item_name = editName.value
    selectedBatch.value.image = imageUrl
  } catch (err) {
    showToast('Failed to update finished good', 'error')
  }
}

function onEditImageChange(event) {
  const file = event.target.files[0]
  if (file) {
    editImageFile.value = file
    // Show preview
    editImage.value = URL.createObjectURL(file)
  }
}

const showConfirmModal = ref(false)
const confirmActionType = ref('') // 'archive' or 'restore'
const confirmGood = ref(null)

function openArchiveModal(fg) {
  confirmGood.value = fg
  confirmActionType.value = 'archive'
  showConfirmModal.value = true
}
function openRestoreModal(fg) {
  confirmGood.value = fg
  confirmActionType.value = 'restore'
  showConfirmModal.value = true
}
async function confirmAction() {
  try {
    if (confirmActionType.value === 'archive') {
      await productionBatchStore.softDeleteFinishedGood(confirmGood.value.id)
      showToast('Finished good archived!', 'success')
    } else if (confirmActionType.value === 'restore') {
      await productionBatchStore.restoreFinishedGood(confirmGood.value.id)
      showToast('Finished good restored!', 'success')
    }
    await productionBatchStore.fetchFinishedGoodsWithBatch()
  } catch (err) {
    showToast('Action failed', 'error')
  }
  showConfirmModal.value = false
  confirmGood.value = null
  confirmActionType.value = ''
}

const showArchived = ref(false)
const visibleFinishedGoods = computed(() =>
  Array.isArray(productionBatchStore.finishedGoods)
    ? productionBatchStore.finishedGoods.filter((fg) => fg.batch)
    : [],
)

watch(showArchived, async (val) => {
  await productionBatchStore.fetchFinishedGoodsWithBatch(val)
})

const fetchGoods = () =>
  productionBatchStore.fetchFinishedGoods({ showArchived: showArchived.value })

onMounted(fetchGoods)
watch(showArchived, fetchGoods)

const restoreGood = async (good) => {
  try {
    await productionBatchStore.restoreFinishedGood(good.id)
    showToast('Finished good restored!', 'success')
    fetchGoods()
  } catch (err) {
    showToast('Failed to restore finished good', 'error')
  }
}
const archiveGood = async (good) => {
  try {
    await productionBatchStore.softDeleteFinishedGood(good.id)
    showToast('Finished good archived!', 'success')
    fetchGoods()
  } catch (err) {
    showToast('Failed to archive finished good', 'error')
  }
}

const refreshBatches = async () => {
  try {
    await productionBatchStore.fetchBatches()
    showToast('Batches refreshed!', 'success')
  } catch (err) {
    showToast('Failed to refresh batches', 'error')
  }
}
</script>

<template>
  <div class="bg-white rounded-lg shadow">
    <!-- Header -->
    <div class="p-4 border-b">
      <h1 class="text-xl font-bold text-gray-800">Production Batch Overview</h1>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex border-b px-4">
      <button
        v-for="tab in ['monitoring', 'adjustment', 'forecasting']"
        :key="tab"
        @click="activeTab = tab"
        :class="[
          'px-4 py-2 text-sm font-medium border-b-2 -mb-px',
          activeTab === tab
            ? 'border-primaryColor text-primaryColor'
            : 'border-transparent text-gray-500 hover:text-gray-700',
        ]"
      >
        {{ tab.charAt(0).toUpperCase() + tab.slice(1) }}
      </button>
    </div>

    <!-- Content Area -->
    <div class="p-4">
      <!-- Monitoring Tab -->
      <div v-if="activeTab === 'monitoring'">
        <!-- Search -->
        <div class="flex justify-between items-center mb-4">
          <div class="flex gap-4">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search batches..."
              class="input-search input-sm w-64 border border-black"
            />
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-4 gap-4 mb-6">
          <div class="stat bg-blue-50 rounded-lg p-4">
            <div class="stat-title text-xs text-gray-500">Total Batches</div>
            <div class="stat-value text-blue-500 text-2xl">{{ finishedGoodsStats.total }}</div>
          </div>
          <div class="stat bg-green-50 rounded-lg p-4">
            <div class="stat-title text-xs text-gray-500">In Stock</div>
            <div class="stat-value text-green-500 text-2xl">{{ finishedGoodsStats.inStock }}</div>
          </div>
          <div class="stat bg-yellow-50 rounded-lg p-4">
            <div class="stat-title text-xs text-gray-500">Low Stock</div>
            <div class="stat-value text-yellow-500 text-2xl">{{ finishedGoodsStats.lowStock }}</div>
          </div>
          <div class="stat bg-red-50 rounded-lg p-4">
            <div class="stat-title text-xs text-gray-500">Out of Stock</div>
            <div class="stat-value text-red-500 text-2xl">{{ finishedGoodsStats.outOfStock }}</div>
          </div>
        </div>

        <!-- Batch Table -->
        <div class="flex items-center mb-4">
          <input type="checkbox" id="showArchived" v-model="showArchived" class="mr-2" />
          <label for="showArchived" class="text-sm text-black">
            Show Archived Finished Goods Only
          </label>
        </div>

        <div class="overflow-x-auto">
          <table class="table table-compact w-full">
            <thead>
              <tr class="bg-primaryColor text-white">
                <th class="text-xs">Batch Number</th>
                <th class="text-xs">Product Name</th>
                <th class="text-xs">Primary Stock</th>
                <th class="text-xs">Status</th>
                <th class="text-xs">Secondary Stock</th>
                <th class="text-xs">Status</th>
                <th class="text-xs">Unit</th>
                <th class="text-xs">Production Date</th>
                <th class="text-xs">Expiry Date</th>
                <th class="text-xs">Action</th>
              </tr>
            </thead>
            <tbody class="text-xs text-black">
              <tr v-for="fg in visibleFinishedGoods" :key="fg.id" class="hover:bg-gray-50">
                <td>{{ fg.batch?.batch_number || '—' }}</td>
                <td>{{ fg.item_name }}</td>
                <td>{{ fg.batch?.primary_stock ?? '—' }}</td>
                <td>
                  <span
                    v-if="fg.batch"
                    :class="{
                      'badge badge-sm badge-success badge-outline':
                        fg.batch.primary_stock > fg.batch.reorder_point,
                      'badge badge-sm badge-warning badge-outline':
                        fg.batch.primary_stock <= fg.batch.reorder_point &&
                        fg.batch.primary_stock > 0,
                      'badge badge-sm badge-error badge-outline': fg.batch.primary_stock === 0,
                    }"
                  >
                    {{
                      fg.batch.primary_stock > fg.batch.reorder_point
                        ? 'In Stock'
                        : fg.batch.primary_stock === 0
                          ? 'Out of Stock'
                          : 'Low Stock'
                    }}
                  </span>
                  <span v-else>—</span>
                </td>
                <td>{{ fg.batch?.secondary_stock ?? '—' }}</td>
                <td>
                  <span
                    v-if="fg.batch"
                    :class="{
                      'badge badge-sm badge-success badge-outline':
                        fg.batch.secondary_stock > fg.batch.reorder_point,
                      'badge badge-sm badge-warning badge-outline':
                        fg.batch.secondary_stock <= fg.batch.reorder_point &&
                        fg.batch.secondary_stock > 0,
                      'badge badge-sm badge-error badge-outline': fg.batch.secondary_stock === 0,
                    }"
                  >
                    {{
                      fg.batch.secondary_stock > fg.batch.reorder_point
                        ? 'In Stock'
                        : fg.batch.secondary_stock === 0
                          ? 'Out of Stock'
                          : 'Low Stock'
                    }}
                  </span>
                  <span v-else>—</span>
                </td>
                <td>{{ fg.batch?.unit || '—' }}</td>
                <td>
                  {{
                    fg.batch?.production_date
                      ? new Date(fg.batch.production_date).toLocaleDateString()
                      : '—'
                  }}
                </td>
                <td>{{ fg.expiry_date ? new Date(fg.expiry_date).toLocaleDateString() : '—' }}</td>
                <td>
                  <button class="btn-secondaryStyle btn-xs" @click="viewBatchDetails(fg)">
                    View
                  </button>
                  <button
                    v-if="showArchived"
                    @click="openRestoreModal(fg)"
                    class="btn-primaryStyle btn-xs ml-1"
                  >
                    Restore
                  </button>
                  <button v-else @click="openArchiveModal(fg)" class="btn-errorStyle btn-xs ml-1">
                    Archive
                  </button>
                </td>
              </tr>
              <tr v-if="!visibleFinishedGoods.length">
                <td colspan="10" class="text-center py-4 text-gray-500">
                  No finished goods available
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
            v-model="monitoringPage"
            :disabled="monitoringTotalPages <= 1"
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
          <button class="btn-secondaryStyle" @click="refreshBatches">Refresh Batches</button>
        </div>
      </div>

      <!-- Adjustment Tab -->
      <div v-if="activeTab === 'adjustment'">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-bold text-black">Batch Adjustment</h2>
        </div>

        <div class="overflow-x-auto">
          <table class="table table-compact w-full">
            <thead>
              <tr class="bg-primaryColor text-white">
                <th class="text-xs">Batch Number</th>
                <th class="text-xs">Product Name</th>
                <th class="text-xs">Primary Stock</th>
                <th class="text-xs">Secondary Stock</th>
                <th class="text-xs">Total Stock</th>
                <th class="text-xs">Unit</th>
                <th class="text-xs">Action</th>
              </tr>
            </thead>
            <tbody class="text-xs text-black">
              <tr
                v-for="fg in productionBatchStore.finishedGoods"
                :key="fg.id"
                class="hover:bg-gray-50"
              >
                <td>{{ fg.batch.batch_number }}</td>
                <td>{{ fg.item_name }}</td>
                <td>{{ fg.batch.primary_stock }}</td>
                <td>{{ fg.batch.secondary_stock }}</td>
                <td>{{ fg.batch.primary_stock + fg.batch.secondary_stock }}</td>
                <td>{{ fg.batch.unit }}</td>
                <td>
                  <button class="btn-secondaryStyle btn-xs" @click="openAdjustmentModal(fg)">
                    Adjust
                  </button>
                </td>
              </tr>
              <tr v-if="!productionBatchStore.finishedGoods.length">
                <td colspan="7" class="text-center py-4 text-gray-500">
                  No finished goods available
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Forecasting Tab -->
      <div v-if="activeTab === 'forecasting'">
        <ProductionForecasting
          :forecastData="forecastData"
          :forecastPeriod="forecastPeriod"
          :isLoadingForecast="isLoadingForecast"
          :generateForecast="generateForecast"
        />
      </div>
    </div>
  </div>

  <!-- Batch Details Modal -->
  <div v-if="showDetailsModal" class="modal modal-open">
    <div class="modal-box bg-white">
      <h3 class="font-bold text-lg mb-4 text-black">Batch Details</h3>

      <div v-if="selectedBatch" class="space-y-4">
        <div class="grid grid-cols-2 gap-4 text-black">
          <div>
            <p class="text-sm font-semibold text-gray-600">Batch Number</p>
            <p class="text-sm text-black">{{ selectedBatch.batch.batch_number }}</p>
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-600">Product Name</p>
            <template v-if="isEditing">
              <input v-model="editName" class="input-search input-bordered w-full mb-2" />
            </template>
            <template v-else>
              <p class="text-sm text-black">{{ selectedBatch.item_name }}</p>
            </template>
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-600">Produced Qty</p>
            <p class="text-sm">{{ selectedBatch.produced_qty }} {{ selectedBatch.unit }}</p>
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-600">Primary Stock</p>
            <p class="text-sm">
              {{ selectedBatch.batch.primary_stock }} {{ selectedBatch.batch.unit }}
            </p>
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-600">Secondary Stock</p>
            <p class="text-sm">
              {{ selectedBatch.batch.secondary_stock }} {{ selectedBatch.batch.unit }}
            </p>
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-600">Reorder Point</p>
            <p class="text-sm">{{ selectedBatch.batch.reorder_point }}</p>
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-600">Status</p>
            <span
              :class="{
                'badge badge-sm badge-success badge-outline':
                  selectedBatch.batch.primary_stock + selectedBatch.batch.secondary_stock >
                  selectedBatch.batch.reorder_point,
                'badge badge-sm badge-warning badge-outline':
                  selectedBatch.batch.primary_stock + selectedBatch.batch.secondary_stock <=
                    selectedBatch.batch.reorder_point &&
                  selectedBatch.batch.primary_stock + selectedBatch.batch.secondary_stock > 0,
                'badge badge-sm badge-error badge-outline':
                  selectedBatch.batch.primary_stock + selectedBatch.batch.secondary_stock === 0,
              }"
            >
              {{
                selectedBatch.batch.primary_stock + selectedBatch.batch.secondary_stock >
                selectedBatch.batch.reorder_point
                  ? 'In Stock'
                  : selectedBatch.batch.primary_stock + selectedBatch.batch.secondary_stock === 0
                    ? 'Out of Stock'
                    : 'Low Stock'
              }}
            </span>
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-600">Production Date</p>
            <p class="text-sm">
              {{ new Date(selectedBatch.batch.production_date).toLocaleDateString() }}
            </p>
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-600">Expiry Date</p>
            <p class="text-sm">{{ new Date(selectedBatch.expiry_date).toLocaleDateString() }}</p>
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-600">Production Manager</p>
            <p class="text-sm">{{ selectedBatch.batch.production_manager }}</p>
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-600">Last Updated</p>
            <p class="text-sm">
              {{ new Date(selectedBatch.batch.updated_at).toLocaleDateString() }}
            </p>
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-600">Remarks</p>
            <p class="text-sm">{{ selectedBatch.batch.remarks || 'No remarks' }}</p>
          </div>
          <div v-if="isEditing">
            <p class="text-sm font-semibold text-gray-600">Product Image</p>
            <input type="file" accept="image/*" @change="onEditImageChange" class="mb-2" />
            <img
              v-if="editImage"
              :src="editImage"
              alt="Preview"
              class="w-32 h-32 object-cover rounded"
            />
          </div>
          <div v-else-if="selectedBatch.image">
            <p class="text-sm font-semibold text-gray-600">Product Image</p>
            <img
              :src="selectedBatch.image"
              alt="Product Image"
              class="w-32 h-32 object-cover rounded"
            />
          </div>
        </div>
      </div>

      <div class="modal-action">
        <template v-if="isEditing">
          <button class="btn-secondaryStyle" @click="cancelEdit">Cancel</button>
          <button class="btn-primaryStyle" @click="saveEdit">Save</button>
        </template>
        <template v-else>
          <button class="btn-secondaryStyle" @click="showDetailsModal = false">Close</button>
          <button class="btn-primaryStyle" @click="startEdit">Edit</button>
        </template>
      </div>
    </div>
  </div>

  <dialog v-if="showAdjustmentModal" open class="modal z-50">
    <div class="modal-box bg-white text-black max-w-md">
      <h3 class="font-bold text-lg mb-2">Adjust Stock</h3>
      <div class="divider"></div>
      <p class="mb-2">
        Product: <b>{{ adjustmentGood?.item_name }}</b>
      </p>
      <div class="mb-2">
        <label class="block text-xs font-bold">Type</label>
        <select v-model="adjustmentType" class="select select-bordered w-full">
          <option value="primary">Primary Stock</option>
          <option value="secondary">Secondary Stock</option>
        </select>
      </div>
      <div class="mb-2">
        <label class="block text-xs font-bold">Quantity</label>
        <input
          type="number"
          v-model.number="adjustmentQty"
          class="input-search input-bordered w-full"
          min="0"
        />
      </div>
      <div class="modal-action justify-center gap-4">
        <button class="btn-secondaryStyle" @click="showAdjustmentModal = false">Cancel</button>
        <button class="btn-primaryStyle" @click="saveAdjustment">Save</button>
      </div>
    </div>
  </dialog>

  <Toast
    :show="toast.show"
    :message="toast.message"
    :type="toast.type"
    :customClass="toast.customClass"
  />

  <!-- Confirm Modal -->
  <dialog v-if="showConfirmModal" open class="modal z-50">
    <div class="modal-box bg-white w-96">
      <h3 class="font-bold text-md text-black">Confirm Action</h3>
      <div
        class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
      ></div>
      <p class="py-4 text-center text-black text-sm">
        Are you sure you want to
        <span class="font-bold">
          {{ confirmActionType === 'archive' ? 'archive' : 'restore' }}
        </span>
        this finished good?
      </p>
      <div class="modal-action justify-center gap-4">
        <button class="btn-primaryStyle" @click="confirmAction">Yes</button>
        <button class="btn-secondaryStyle" @click="showConfirmModal = false">Cancel</button>
      </div>
    </div>
  </dialog>
</template>
