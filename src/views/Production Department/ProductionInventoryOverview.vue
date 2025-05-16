<script setup>
import { ref, computed, onMounted } from 'vue'
import Toast from '@/components/Admin Components/HR/Toast.vue'

// State Management
const activeTab = ref('monitoring') // monitoring, adjustment, forecasting
const searchQuery = ref('')

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

// Stats
const stats = computed(() => ({
  total: 4, // Total number of batches
  inStock: 2, // Batches with stock above reorder point
  lowStock: 1, // Batches with stock below reorder point but not zero
  outOfStock: 1, // Batches with zero stock
}))

// Filtered and paginated inventory
const filteredInventory = computed(() => {
  // Sample data for production batches
  const sampleBatches = [
    {
      id: 1,
      batch_number: 'BN-2024-001',
      product_name: 'Frozen Lumpia',
      primary_stock: 150,
      secondary_stock: 50,
      reorder_point: 100,
      unit: 'packs',
      production_date: '2024-03-01',
      expiry_date: '2024-06-01',
      production_manager: 'John Doe',
      updated_at: '2024-03-15',
      raw_materials: [
        {
          id: 1,
          item_code: 'RM-001',
          item_name: 'Lumpia Wrapper',
          quantity_used: 200,
          unit: 'pcs',
        },
        { id: 2, item_code: 'RM-002', item_name: 'Ground Pork', quantity_used: 5, unit: 'kg' },
        { id: 3, item_code: 'RM-003', item_name: 'Vegetables Mix', quantity_used: 3, unit: 'kg' },
      ],
      remarks: 'Good quality batch',
    },
    {
      id: 2,
      batch_number: 'BN-2024-002',
      product_name: 'Ready-to-Cook Siomai',
      primary_stock: 80,
      secondary_stock: 20,
      reorder_point: 75,
      unit: 'packs',
      production_date: '2024-03-05',
      expiry_date: '2024-06-05',
      production_manager: 'Jane Smith',
      updated_at: '2024-03-16',
      raw_materials: [
        {
          id: 4,
          item_code: 'RM-004',
          item_name: 'Siomai Wrapper',
          quantity_used: 100,
          unit: 'pcs',
        },
        { id: 5, item_code: 'RM-005', item_name: 'Ground Chicken', quantity_used: 4, unit: 'kg' },
        { id: 6, item_code: 'RM-006', item_name: 'Carrots', quantity_used: 2, unit: 'kg' },
      ],
      remarks: 'Standard production run',
    },
    {
      id: 3,
      batch_number: 'BN-2024-003',
      product_name: 'Frozen Kikiam',
      primary_stock: 0,
      secondary_stock: 30,
      reorder_point: 50,
      unit: 'packs',
      production_date: '2024-03-10',
      expiry_date: '2024-06-10',
      production_manager: 'John Doe',
      updated_at: '2024-03-17',
      raw_materials: [
        {
          id: 7,
          item_code: 'RM-007',
          item_name: 'Kikiam Wrapper',
          quantity_used: 150,
          unit: 'pcs',
        },
        { id: 8, item_code: 'RM-008', item_name: 'Fish Paste', quantity_used: 6, unit: 'kg' },
        { id: 9, item_code: 'RM-009', item_name: 'Taro', quantity_used: 3, unit: 'kg' },
      ],
      remarks: 'Low stock alert',
    },
    {
      id: 4,
      batch_number: 'BN-2024-004',
      product_name: 'Ready-to-Cook Tofu',
      primary_stock: 200,
      secondary_stock: 0,
      reorder_point: 150,
      unit: 'packs',
      production_date: '2024-03-15',
      expiry_date: '2024-06-15',
      production_manager: 'Jane Smith',
      updated_at: '2024-03-18',
      raw_materials: [
        { id: 10, item_code: 'RM-010', item_name: 'Tofu', quantity_used: 10, unit: 'kg' },
        { id: 11, item_code: 'RM-011', item_name: 'Soy Sauce', quantity_used: 2, unit: 'L' },
        { id: 12, item_code: 'RM-012', item_name: 'Cornstarch', quantity_used: 1, unit: 'kg' },
      ],
      remarks: 'New batch production',
    },
  ]

  // TODO: Implement actual filtering logic
  return sampleBatches
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
    // TODO: Call API to generate forecast for all products
    // const response = await productionBatchStore.generateForecast({
    //   period: forecastPeriod.value
    // })
    // allProductsForecast.value = response.data

    // For now, we'll just update the period in our sample data
    allProductsForecast.value = allProductsForecast.value.map((product) => ({
      ...product,
      forecast_period: forecastPeriod.value,
    }))

    forecastData.value = allProductsForecast.value
  } catch (error) {
    showToast('Error generating forecast', 'error')
  } finally {
    isLoadingForecast.value = false
  }
}

onMounted(() => {
  // TODO: Fetch production batches
  // productionBatchStore.fetchBatches()
})
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

        <!-- Batch Table -->
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
              <tr v-for="batch in paginatedInventory" :key="batch.id" class="hover:bg-gray-50">
                <td>{{ batch.batch_number }}</td>
                <td>{{ batch.product_name }}</td>
                <td>{{ batch.primary_stock }}</td>
                <td>
                  <span
                    :class="{
                      'badge badge-sm badge-success badge-outline':
                        batch.primary_stock > batch.reorder_point,
                      'badge badge-sm badge-warning badge-outline':
                        batch.primary_stock <= batch.reorder_point && batch.primary_stock > 0,
                      'badge badge-sm badge-error badge-outline': batch.primary_stock === 0,
                    }"
                  >
                    {{
                      batch.primary_stock > batch.reorder_point
                        ? 'In Stock'
                        : batch.primary_stock === 0
                          ? 'Out of Stock'
                          : 'Low Stock'
                    }}
                  </span>
                </td>
                <td>{{ batch.secondary_stock }}</td>
                <td>
                  <span
                    :class="{
                      'badge badge-sm badge-success badge-outline':
                        batch.secondary_stock > batch.reorder_point,
                      'badge badge-sm badge-warning badge-outline':
                        batch.secondary_stock <= batch.reorder_point && batch.secondary_stock > 0,
                      'badge badge-sm badge-error badge-outline': batch.secondary_stock === 0,
                    }"
                  >
                    {{
                      batch.secondary_stock > batch.reorder_point
                        ? 'In Stock'
                        : batch.secondary_stock === 0
                          ? 'Out of Stock'
                          : 'Low Stock'
                    }}
                  </span>
                </td>
                <td>{{ batch.unit }}</td>
                <td>{{ new Date(batch.production_date).toLocaleDateString() }}</td>
                <td>{{ new Date(batch.expiry_date).toLocaleDateString() }}</td>
                <td>
                  <button class="btn-secondaryStyle btn-xs" @click="viewBatchDetails(batch)">
                    View
                  </button>
                </td>
              </tr>
              <tr v-if="!paginatedInventory.length">
                <td colspan="10" class="text-center py-4 text-gray-500">No batches available</td>
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
          <button class="btn-secondaryStyle" @click="productionBatchStore.fetchBatches()">
            Refresh Batches
          </button>
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
                <th class="text-xs">Current Quantity</th>
                <th class="text-xs">Unit</th>
                <th class="text-xs">Action</th>
              </tr>
            </thead>
            <tbody class="text-xs text-black">
              <tr v-for="batch in filteredInventory" :key="batch.id" class="hover:bg-gray-50">
                <td>{{ batch.batch_number }}</td>
                <td>{{ batch.product_name }}</td>
                <td>{{ batch.quantity }}</td>
                <td>{{ batch.unit }}</td>
                <td>
                  <button class="btn-secondaryStyle btn-xs">Adjust</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Forecasting Tab -->
      <div v-if="activeTab === 'forecasting'">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-bold text-black">Production Forecasting & Insights</h2>
        </div>

        <!-- Forecast Controls -->
        <div class="bg-gray-50 p-4 rounded-lg mb-6">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-semibold text-gray-600">Forecast Period</label>
              <select
                v-model="forecastPeriod"
                class="select !bg-white !border-black !text-black select-bordered w-full mt-1"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
            <div class="flex items-end">
              <button
                class="btn-secondaryStyle w-full"
                @click="generateForecast"
                :disabled="isLoadingForecast"
              >
                {{ isLoadingForecast ? 'Generating...' : 'Generate Forecast' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Forecast Results -->
        <div v-if="forecastData" class="space-y-6">
          <!-- Overall Forecast Metrics -->
          <div class="grid grid-cols-3 gap-4">
            <div class="stat bg-blue-50 rounded-lg p-4">
              <div class="stat-title text-xs text-gray-500">Average MAE</div>
              <div class="stat-value text-blue-500 text-2xl">
                {{
                  (
                    forecastData.reduce((sum, p) => sum + p.metrics.mae, 0) / forecastData.length
                  ).toFixed(1)
                }}
              </div>
            </div>
            <div class="stat bg-green-50 rounded-lg p-4">
              <div class="stat-title text-xs text-gray-500">Average RMSE</div>
              <div class="stat-value text-green-500 text-2xl">
                {{
                  (
                    forecastData.reduce((sum, p) => sum + p.metrics.rmse, 0) / forecastData.length
                  ).toFixed(1)
                }}
              </div>
            </div>
            <div class="stat bg-purple-50 rounded-lg p-4">
              <div class="stat-title text-xs text-gray-500">Average Accuracy</div>
              <div class="stat-value text-purple-500 text-2xl">
                {{
                  (
                    (forecastData.reduce((sum, p) => sum + p.metrics.accuracy, 0) /
                      forecastData.length) *
                    100
                  ).toFixed(1)
                }}%
              </div>
            </div>
          </div>

          <!-- Product Forecasts -->
          <div
            v-for="product in forecastData"
            :key="product.product_name"
            class="bg-white rounded-lg shadow p-4"
          >
            <h3 class="text-lg font-semibold text-gray-800 mb-4">{{ product.product_name }}</h3>

            <!-- Product Metrics -->
            <div class="grid grid-cols-3 gap-4 mb-4">
              <div class="stat bg-blue-50 rounded-lg p-4">
                <div class="stat-title text-xs text-gray-500">MAE</div>
                <div class="stat-value text-blue-500 text-xl">{{ product.metrics.mae }}</div>
              </div>
              <div class="stat bg-green-50 rounded-lg p-4">
                <div class="stat-title text-xs text-gray-500">RMSE</div>
                <div class="stat-value text-green-500 text-xl">{{ product.metrics.rmse }}</div>
              </div>
              <div class="stat bg-purple-50 rounded-lg p-4">
                <div class="stat-title text-xs text-gray-500">Accuracy</div>
                <div class="stat-value text-purple-500 text-xl">
                  {{ (product.metrics.accuracy * 100).toFixed(1) }}%
                </div>
              </div>
            </div>

            <!-- Forecast Table -->
            <div class="overflow-x-auto">
              <table class="table table-compact w-full">
                <thead>
                  <tr class="bg-primaryColor text-white">
                    <th class="text-xs">Period</th>
                    <th class="text-xs">Historical Data</th>
                    <th class="text-xs">Forecast</th>
                    <th class="text-xs">Lower Bound</th>
                    <th class="text-xs">Upper Bound</th>
                  </tr>
                </thead>
                <tbody class="text-xs text-black">
                  <tr v-for="(item, index) in product.historical_data" :key="'hist-' + index">
                    <td>{{ item.date }}</td>
                    <td>{{ item.actual }}</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                  </tr>
                  <tr v-for="(item, index) in product.forecast" :key="'forecast-' + index">
                    <td>{{ item.date }}</td>
                    <td>-</td>
                    <td>{{ item.predicted }}</td>
                    <td>{{ item.lower_bound }}</td>
                    <td>{{ item.upper_bound }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Product Recommendations -->
            <div class="mt-4 bg-gray-50 p-4 rounded-lg">
              <h4 class="text-sm font-semibold text-gray-600 mb-2">Recommendations</h4>
              <ul class="text-sm space-y-2">
                <li>
                  • Prepare to produce {{ product.forecast[0].predicted }} units for
                  {{ product.forecast[0].date }}
                </li>
                <li>
                  • Expected range: {{ product.forecast[0].lower_bound }} -
                  {{ product.forecast[0].upper_bound }} units
                </li>
                <li>• Forecast confidence: {{ (product.metrics.accuracy * 100).toFixed(1) }}%</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Insights Section -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <!-- Expiring Soon -->
          <div class="bg-red-50 rounded-lg p-4">
            <h3 class="font-semibold text-red-700 mb-2 text-sm">Expiring Soon</h3>
            <table class="table table-compact w-full text-xs">
              <thead>
                <tr>
                  <th>Batch #</th>
                  <th>Product</th>
                  <th>Expiry</th>
                  <th>Qty</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in expiringSoon" :key="item.batch_number">
                  <td>{{ item.batch_number }}</td>
                  <td>{{ item.product_name }}</td>
                  <td class="text-red-600 font-bold">{{ item.expiry_date }}</td>
                  <td>{{ item.quantity }} {{ item.unit }}</td>
                </tr>
                <tr v-if="!expiringSoon.length">
                  <td colspan="4" class="text-center text-gray-400">No expiring batches</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Most Produced -->
          <div class="bg-green-50 rounded-lg p-4">
            <h3 class="font-semibold text-green-700 mb-2 text-sm">Most Produced</h3>
            <table class="table table-compact w-full text-xs">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Total Produced</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in mostProduced" :key="item.product_name">
                  <td>{{ item.product_name }}</td>
                  <td>{{ item.total_produced }} {{ item.unit }}</td>
                </tr>
                <tr v-if="!mostProduced.length">
                  <td colspan="2" class="text-center text-gray-400">No data</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Least Used -->
          <div class="bg-yellow-50 rounded-lg p-4">
            <h3 class="font-semibold text-yellow-700 mb-2 text-sm">Least Used</h3>
            <table class="table table-compact w-full text-xs">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Total Used</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in leastUsed" :key="item.product_name">
                  <td>{{ item.product_name }}</td>
                  <td>{{ item.total_used }} {{ item.unit }}</td>
                </tr>
                <tr v-if="!leastUsed.length">
                  <td colspan="2" class="text-center text-gray-400">No data</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Batch Details Modal -->
  <div v-if="showDetailsModal" class="modal modal-open">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">Batch Details</h3>

      <div v-if="selectedBatch" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm font-semibold text-gray-600">Batch Number</p>
            <p class="text-sm">{{ selectedBatch.batch_number }}</p>
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-600">Product Name</p>
            <p class="text-sm">{{ selectedBatch.product_name }}</p>
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-600">Primary Stock</p>
            <p class="text-sm">{{ selectedBatch.primary_stock }} {{ selectedBatch.unit }}</p>
            <span
              :class="{
                'badge badge-sm badge-success badge-outline':
                  selectedBatch.primary_stock > selectedBatch.reorder_point,
                'badge badge-sm badge-warning badge-outline':
                  selectedBatch.primary_stock <= selectedBatch.reorder_point &&
                  selectedBatch.primary_stock > 0,
                'badge badge-sm badge-error badge-outline': selectedBatch.primary_stock === 0,
              }"
            >
              {{
                selectedBatch.primary_stock > selectedBatch.reorder_point
                  ? 'In Stock'
                  : selectedBatch.primary_stock === 0
                    ? 'Out of Stock'
                    : 'Low Stock'
              }}
            </span>
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-600">Secondary Stock</p>
            <p class="text-sm">{{ selectedBatch.secondary_stock }} {{ selectedBatch.unit }}</p>
            <span
              :class="{
                'badge badge-sm badge-success badge-outline':
                  selectedBatch.secondary_stock > selectedBatch.reorder_point,
                'badge badge-sm badge-warning badge-outline':
                  selectedBatch.secondary_stock <= selectedBatch.reorder_point &&
                  selectedBatch.secondary_stock > 0,
                'badge badge-sm badge-error badge-outline': selectedBatch.secondary_stock === 0,
              }"
            >
              {{
                selectedBatch.secondary_stock > selectedBatch.reorder_point
                  ? 'In Stock'
                  : selectedBatch.secondary_stock === 0
                    ? 'Out of Stock'
                    : 'Low Stock'
              }}
            </span>
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-600">Status</p>
            <p class="text-sm">
              <span
                :class="{
                  'badge badge-sm badge-success badge-outline':
                    Number(selectedBatch.primary_stock) + Number(selectedBatch.secondary_stock) >
                    selectedBatch.reorder_point,
                  'badge badge-sm badge-warning badge-outline':
                    Number(selectedBatch.primary_stock) + Number(selectedBatch.secondary_stock) <=
                      selectedBatch.reorder_point &&
                    Number(selectedBatch.primary_stock) + Number(selectedBatch.secondary_stock) > 0,
                  'badge badge-sm badge-error badge-outline':
                    Number(selectedBatch.primary_stock) + Number(selectedBatch.secondary_stock) ===
                    0,
                }"
              >
                {{
                  Number(selectedBatch.primary_stock) + Number(selectedBatch.secondary_stock) >
                  selectedBatch.reorder_point
                    ? 'In Stock'
                    : Number(selectedBatch.primary_stock) +
                          Number(selectedBatch.secondary_stock) ===
                        0
                      ? 'Out of Stock'
                      : 'Low Stock'
                }}
              </span>
            </p>
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-600">Production Date</p>
            <p class="text-sm">
              {{ new Date(selectedBatch.production_date).toLocaleDateString() }}
            </p>
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-600">Expiry Date</p>
            <p class="text-sm">{{ new Date(selectedBatch.expiry_date).toLocaleDateString() }}</p>
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-600">Production Manager</p>
            <p class="text-sm">{{ selectedBatch.production_manager }}</p>
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-600">Last Updated</p>
            <p class="text-sm">{{ new Date(selectedBatch.updated_at).toLocaleDateString() }}</p>
          </div>
        </div>

        <!-- Raw Materials Used -->
        <div class="mt-4">
          <p class="text-sm font-semibold text-gray-600 mb-2">Raw Materials Used</p>
          <div class="overflow-x-auto">
            <table class="table table-compact w-full">
              <thead>
                <tr class="bg-gray-100">
                  <th class="text-xs">Item Code</th>
                  <th class="text-xs">Item Name</th>
                  <th class="text-xs">Quantity Used</th>
                  <th class="text-xs">Unit</th>
                </tr>
              </thead>
              <tbody class="text-xs">
                <tr v-for="material in selectedBatch.raw_materials" :key="material.id">
                  <td>{{ material.item_code }}</td>
                  <td>{{ material.item_name }}</td>
                  <td>{{ material.quantity_used }}</td>
                  <td>{{ material.unit }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Remarks -->
        <div class="mt-4">
          <p class="text-sm font-semibold text-gray-600">Remarks</p>
          <p class="text-sm">{{ selectedBatch.remarks || 'No remarks' }}</p>
        </div>
      </div>

      <div class="modal-action">
        <button class="btn-secondaryStyle" @click="showDetailsModal = false">Close</button>
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
