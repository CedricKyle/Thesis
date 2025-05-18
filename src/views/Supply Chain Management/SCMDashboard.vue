<script setup>
import { ref, computed, onMounted } from 'vue'
import { useInventoryStore } from '@/stores/SCM Stores/inventoryStore'
import { useInventoryStockStore } from '@/stores/SCM Stores/inventoryStockStore'
import { useInventoryReceivingStore } from '@/stores/SCM Stores/inventoryReceivingStore'
import { useSCMRequestStore } from '@/stores/SCM Stores/scmRequestStore'
import { Bar, Pie } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  BarElement,
  LinearScale,
} from 'chart.js'
import { Package, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-vue-next'
import dayjs from 'dayjs'

// Register Chart.js components
ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, BarElement, LinearScale)

const inventoryStore = useInventoryStore()
const inventoryStockStore = useInventoryStockStore()
const inventoryReceivingStore = useInventoryReceivingStore()
const scmRequestStore = useSCMRequestStore()

// Date range state
const dateRange = ref('1month') // options: '1day', '7days', '1month'

// Stats computed properties
const stats = computed(() => ({
  totalItems: inventoryStore.inventory.length,
  lowStock: inventoryStore.inventory.filter(
    (i) => Number(i.quantity) > 0 && Number(i.quantity) <= Number(i.reorder_point),
  ).length,
  outOfStock: inventoryStore.inventory.filter((i) => Number(i.quantity) === 0).length,
  totalValue: inventoryStore.inventory.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unit_price || 0),
    0,
  ),
}))

// Category distribution data for pie chart
const categoryData = computed(() => {
  const categories = {}
  inventoryStore.inventory.forEach((item) => {
    categories[item.category] = (categories[item.category] || 0) + 1
  })

  return {
    labels: Object.keys(categories),
    datasets: [
      {
        data: Object.values(categories),
        backgroundColor: ['#466114', '#F87A14', '#ef4444', '#3b82f6', '#8b5cf6'],
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  }
})

// Stock level trend data for bar chart
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const stockTrendData = computed(() => {
  const stockInByMonth = Array(12).fill(0)
  const stockOutByMonth = Array(12).fill(0)

  inventoryStockStore.stockIns.forEach((item) => {
    const date = dayjs(item.date || item.created_at)
    const month = date.month()
    stockInByMonth[month] += Number(item.quantity)
  })

  inventoryStockStore.stockOuts.forEach((item) => {
    const date = dayjs(item.date || item.created_at)
    const month = date.month()
    stockOutByMonth[month] += Number(item.quantity)
  })

  return {
    labels: months,
    datasets: [
      {
        label: 'Stock In',
        data: stockInByMonth,
        backgroundColor: '#466114',
      },
      {
        label: 'Stock Out',
        data: stockOutByMonth,
        backgroundColor: '#ef4444',
      },
    ],
  }
})

// Chart options
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        padding: 20,
        font: { size: 14 },
        usePointStyle: true,
        pointStyle: 'circle',
      },
    },
  },
}

// Top 5 low stock items
const lowStockItems = computed(() =>
  inventoryStore.inventory
    .filter(
      (item) => Number(item.quantity) > 0 && Number(item.quantity) <= Number(item.reorder_point),
    )
    .sort((a, b) => Number(a.quantity) - Number(b.quantity))
    .slice(0, 5),
)

const outOfStockItems = computed(() =>
  inventoryStore.inventory
    .filter((item) => Number(item.quantity) === 0)
    .sort((a, b) => a.item_name.localeCompare(b.item_name))
    .slice(0, 5),
)

// DSS Forecasting: Simple average of last 3 months INCLUDING current month
const forecastMonths = 3

const forecastedStockOut = computed(() => {
  const now = dayjs()
  const stockOutByMonth = Array(12).fill(0)
  inventoryStockStore.stockOuts.forEach((item) => {
    const date = dayjs(item.date || item.created_at)
    const month = date.month()
    stockOutByMonth[month] += Number(item.quantity)
  })
  let monthsToAverage = []
  for (let i = 0; i < forecastMonths; i++) {
    monthsToAverage.push((now.month() - i + 12) % 12)
  }
  // LOGGING
  console.log('Stock Out By Month:', stockOutByMonth)
  console.log('Months to Average (Stock Out):', monthsToAverage)
  console.log('Values to Average (Stock Out):', monthsToAverage.map(m => stockOutByMonth[m]))
  const total = monthsToAverage.reduce((sum, m) => sum + stockOutByMonth[m], 0)
  console.log('Total Stock Out for Averaging:', total)
  console.log('Forecasted Stock Out:', Math.round(total / forecastMonths))
  return Math.round(total / forecastMonths)
})

const forecastedStockIn = computed(() => {
  const now = dayjs()
  const stockInByMonth = Array(12).fill(0)
  inventoryStockStore.stockIns.forEach((item) => {
    const date = dayjs(item.date || item.created_at)
    const month = date.month()
    stockInByMonth[month] += Number(item.quantity)
  })
  let monthsToAverage = []
  for (let i = 0; i < forecastMonths; i++) {
    monthsToAverage.push((now.month() - i + 12) % 12)
  }
  // LOGGING
  console.log('Stock In By Month:', stockInByMonth)
  console.log('Months to Average (Stock In):', monthsToAverage)
  console.log('Values to Average (Stock In):', monthsToAverage.map(m => stockInByMonth[m]))
  const total = monthsToAverage.reduce((sum, m) => sum + stockInByMonth[m], 0)
  console.log('Total Stock In for Averaging:', total)
  console.log('Forecasted Stock In:', Math.round(total / forecastMonths))
  return Math.round(total / forecastMonths)
})

const itemStockOutForecasts = computed(() => {
  const now = dayjs()
  const perItem = {}
  inventoryStore.inventory.forEach((item) => {
    perItem[item.item_code] = Array(12).fill(0)
  })
  inventoryStockStore.stockOuts.forEach((stockOut) => {
    const date = dayjs(stockOut.date || stockOut.created_at)
    const month = date.month()
    const code = stockOut.item_code
    if (perItem[code] !== undefined) {
      perItem[code][month] += Number(stockOut.quantity)
    }
  })
  const result = []
  for (const code in perItem) {
    let monthsToAverage = []
    for (let i = 0; i < forecastMonths; i++) {
      monthsToAverage.push((now.month() - i + 12) % 12)
    }
    const total = monthsToAverage.reduce((sum, m) => sum + perItem[code][m], 0)
    const forecast = Math.round(total / forecastMonths)
    const item = inventoryStore.inventory.find((i) => i.item_code === code)
    result.push({
      item_code: code,
      item_name: item?.item_name || code,
      category: item?.category || '',
      forecast,
    })
  }
  return result
})

const itemStockInForecasts = computed(() => {
  const now = dayjs()
  const perItem = {}
  inventoryStore.inventory.forEach((item) => {
    perItem[item.item_code] = Array(12).fill(0)
  })
  inventoryStockStore.stockIns.forEach((stockIn) => {
    const date = dayjs(stockIn.date || stockIn.created_at)
    const month = date.month()
    const code = stockIn.item_code
    if (perItem[code] !== undefined) {
      perItem[code][month] += Number(stockIn.quantity)
    }
  })
  const result = []
  for (const code in perItem) {
    let monthsToAverage = []
    for (let i = 0; i < forecastMonths; i++) {
      monthsToAverage.push((now.month() - i + 12) % 12)
    }
    const total = monthsToAverage.reduce((sum, m) => sum + perItem[code][m], 0)
    const forecast = Math.round(total / forecastMonths)
    const item = inventoryStore.inventory.find((i) => i.item_code === code)
    result.push({
      item_code: code,
      item_name: item?.item_name || code,
      category: item?.category || '',
      forecast,
    })
  }
  return result
})

// Pagination for DSS tables
const dssStockOutPage = ref(1)
const dssStockInPage = ref(1)
const dssRowsPerPage = 10

const paginatedItemStockOutForecasts = computed(() => {
  const start = (dssStockOutPage.value - 1) * dssRowsPerPage
  return itemStockOutForecasts.value.slice(start, start + dssRowsPerPage)
})
const paginatedItemStockInForecasts = computed(() => {
  const start = (dssStockInPage.value - 1) * dssRowsPerPage
  return itemStockInForecasts.value.slice(start, start + dssRowsPerPage)
})

const dssStockOutTotalPages = computed(() =>
  Math.ceil(itemStockOutForecasts.value.length / dssRowsPerPage)
)
const dssStockInTotalPages = computed(() =>
  Math.ceil(itemStockInForecasts.value.length / dssRowsPerPage)
)

const loading = ref(true)
onMounted(async () => {
  await Promise.all([
    inventoryStore.fetchInventory(),
    inventoryStockStore.fetchStockIns(),
    inventoryStockStore.fetchStockOuts(),
    inventoryReceivingStore.fetchReceivings(),
    scmRequestStore.fetchRequests(),
  ])
  loading.value = false
})
</script>

<template>
  <div class="min-h-screen overflow-y-auto pb-6">
    <div v-if="loading">Loading...</div>
    <div v-else>
      <!-- Date Range Selector -->
      <div class="w-full flex justify-between mb-4">
        <div class="flex gap-2">
          <button
            class="btn-secondaryStyle"
            :class="dateRange === '1day' ? 'bg-primaryColor text-white' : 'bg-gray-200'"
            @click="dateRange = '1day'"
          >
            Today
          </button>
          <button
            class="btn-secondaryStyle"
            :class="dateRange === '7days' ? 'bg-primaryColor text-white' : 'bg-gray-200'"
            @click="dateRange = '7days'"
          >
            7 Days
          </button>
          <button
            class="btn-secondaryStyle"
            :class="dateRange === '1month' ? 'bg-primaryColor text-white' : 'bg-gray-200'"
            @click="dateRange = '1month'"
          >
            1 Month
          </button>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-4 gap-4 mb-6">
        <!-- Total Items -->
        <div class="card bg-white shadow-md">
          <div class="card-body">
            <div class="card-header flex justify-between">
              <h1 class="text-gray-600">Total Items</h1>
            </div>
            <div class="card-content mt-4 flex justify-between">
              <h1 class="text-4xl font-bold text-black">{{ stats.totalItems }}</h1>
              <Package class="w-9 h-9 text-white rounded-full p-2 bg-[#466114]" />
            </div>
          </div>
        </div>

        <!-- Low Stock -->
        <div class="card bg-white shadow-md">
          <div class="card-body">
            <div class="card-header flex justify-between">
              <h1 class="text-gray-600">Low Stock</h1>
            </div>
            <div class="card-content mt-4 flex justify-between">
              <h1 class="text-4xl font-bold text-black">{{ stats.lowStock }}</h1>
              <AlertTriangle class="w-9 h-9 text-white rounded-full p-2 bg-[#F87A14]" />
            </div>
          </div>
        </div>

        <!-- Out of Stock -->
        <div class="card bg-white shadow-md">
          <div class="card-body">
            <div class="card-header flex justify-between">
              <h1 class="text-gray-600">Out of Stock</h1>
            </div>
            <div class="card-content mt-4 flex justify-between">
              <h1 class="text-4xl font-bold text-black">{{ stats.outOfStock }}</h1>
              <TrendingDown class="w-9 h-9 text-white rounded-full p-2 bg-[#ef4444]" />
            </div>
          </div>
        </div>

        <!-- Total Value -->
        <div class="card bg-white shadow-md">
          <div class="card-body">
            <div class="card-header flex justify-between">
              <h1 class="text-gray-600">Total Value</h1>
            </div>
            <div class="card-content mt-4 flex justify-between">
              <h1 class="text-4xl font-bold text-black">
                ₱{{ stats.totalValue.toLocaleString() }}
              </h1>
              <TrendingUp class="w-9 h-9 text-white rounded-full p-2 bg-[#3b82f6]" />
            </div>
          </div>
        </div>

        <!-- DSS Forecast Card -->
        <div class="card bg-white shadow-md">
          <div class="card-body">
            <div class="card-header flex justify-between">
              <h1 class="text-gray-600">Forecasted Stock Out (Next Month)</h1>
            </div>
            <div class="card-content mt-4 flex justify-between">
              <h1 class="text-4xl font-bold text-black">{{ forecastedStockOut }}</h1>
              <TrendingUp class="w-9 h-9 text-white rounded-full p-2 bg-[#8b5cf6]" />
            </div>
          </div>
        </div>

        <!-- DSS Forecast Card for Stock In -->
        <div class="card bg-white shadow-md">
          <div class="card-body">
            <div class="card-header flex justify-between">
              <h1 class="text-gray-600">Forecasted Stock In (Next Month)</h1>
            </div>
            <div class="card-content mt-4 flex justify-between">
              <h1 class="text-4xl font-bold text-black">{{ forecastedStockIn }}</h1>
              <TrendingUp class="w-9 h-9 text-white rounded-full p-2 bg-[#3b82f6]" />
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="grid grid-cols-2 gap-4 mb-6">
        <!-- Stock Trend Chart -->
        <div class="bg-white p-6 rounded shadow">
          <h2 class="font-semibold mb-4 text-black">Stock Movement Trend</h2>
          <div class="h-[400px]">
            <Bar :data="stockTrendData" :options="chartOptions" />
          </div>
        </div>

        <!-- Category Distribution Chart -->
        <div class="bg-white p-6 rounded shadow">
          <h2 class="font-semibold mb-4 text-black">Category Distribution</h2>
          <div class="h-[400px]">
            <Pie :data="categoryData" :options="chartOptions" />
          </div>
        </div>
      </div>

      <!-- Low Stock Alerts -->
      <div class="bg-white p-4 rounded shadow mb-6 text-black">
        <h2 class="font-semibold mb-4">Low Stock Alerts</h2>
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr>
                <th class="text-left px-2 py-1">Item Code</th>
                <th class="text-left px-2 py-1">Item Name</th>
                <th class="text-left px-2 py-1">Category</th>
                <th class="text-center px-2 py-1">Current Stock</th>
                <th class="text-center px-2 py-1">Min. Stock Level</th>
                <th class="text-center px-2 py-1">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in lowStockItems" :key="item.id">
                <td class="px-2 py-1">{{ item.item_code }}</td>
                <td class="px-2 py-1">{{ item.item_name }}</td>
                <td class="px-2 py-1">{{ item.category }}</td>
                <td class="text-center px-2 py-1">{{ item.quantity }}</td>
                <td class="text-center px-2 py-1">{{ item.reorder_point }}</td>
                <td class="text-center px-2 py-1">
                  <span
                    :class="{
                      'badge badge-sm badge-error badge-outline': item.quantity === 0,
                      'badge badge-sm badge-warning badge-outline': item.quantity > 0,
                    }"
                  >
                    {{ item.quantity === 0 ? 'Out of Stock' : 'Low Stock' }}
                  </span>
                </td>
              </tr>
              <tr v-if="lowStockItems.length === 0">
                <td colspan="6" class="text-center py-4 text-gray-500">No low stock items</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Out of Stock Alerts -->
      <div class="bg-white p-4 rounded shadow mb-6 text-black">
        <h2 class="font-semibold mb-4">Out of Stock Alerts</h2>
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr>
                <th class="text-left px-2 py-1">Item Code</th>
                <th class="text-left px-2 py-1">Item Name</th>
                <th class="text-left px-2 py-1">Category</th>
                <th class="text-center px-2 py-1">Current Stock</th>
                <th class="text-center px-2 py-1">Min. Stock Level</th>
                <th class="text-center px-2 py-1">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in outOfStockItems" :key="item.id">
                <td class="px-2 py-1">{{ item.item_code }}</td>
                <td class="px-2 py-1">{{ item.item_name }}</td>
                <td class="px-2 py-1">{{ item.category }}</td>
                <td class="text-center px-2 py-1">{{ item.quantity }}</td>
                <td class="text-center px-2 py-1">{{ item.reorder_point }}</td>
                <td class="text-center px-2 py-1">
                  <span class="badge badge-sm badge-error badge-outline">Out of Stock</span>
                </td>
              </tr>
              <tr v-if="outOfStockItems.length === 0">
                <td colspan="6" class="text-center py-4 text-gray-500">No out of stock items</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 mb-6">
        <!-- DSS Forecasting (Overall) -->
        <div class="bg-white p-4 rounded shadow mb-6 text-black">
          <h2 class="font-semibold mb-4">DSS Forecasting</h2>
          <p>
            <div class="flex justify-between">
              <b>Forecasted Stock Out for Next Month:</b>
              <span class="text-lg font-bold bg-primaryColor text-white rounded-full p-1">{{
                forecastedStockOut
              }}</span>
            </div>
            <br />
            <span class="text-xs text-gray-500 text-right"
              >Based on average of last {{ forecastMonths }} months' stock out.</span
            >
          </p>
        </div>

        <!-- DSS Forecasting (Overall, Stock In) -->
        <div class="bg-white p-4 rounded shadow mb-6 text-black">
          <h2 class="font-semibold mb-4">DSS Forecasting</h2>
          <p>
            <div class="flex justify-between">
              <b>Forecasted Stock In for Next Month:</b>
              <span class="text-lg font-bold bg-secondaryColor text-white rounded-full p-1">{{
                forecastedStockIn
              }}</span>
            </div>
            <br />
            <span class="text-xs text-gray-500"
              >Based on average of last {{ forecastMonths }} months' stock in.</span
            >
          </p>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4 mb-6">
        <!-- DSS Forecasting (Per Item, Stock Out) -->
        <div class="bg-white p-4 rounded shadow mb-6 text-black">
          <h2 class="font-semibold mb-4">DSS Forecasting (Per Item, Stock Out)</h2>
          <table class="min-w-full text-sm">
            <thead>
              <tr>
                <th class="text-left px-2 py-1">Item Code</th>
                <th class="text-left px-2 py-1">Item Name</th>
                <th class="text-left px-2 py-1">Category</th>
                <th class="text-center px-2 py-1">Forecasted Stock Out (Next Month)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in paginatedItemStockOutForecasts" :key="item.item_code">
                <td class="px-2 py-1">{{ item.item_code }}</td>
                <td class="px-2 py-1">{{ item.item_name }}</td>
                <td class="px-2 py-1">{{ item.category }}</td>
                <td class="text-center px-2 py-1">{{ item.forecast }}</td>
              </tr>
            </tbody>
          </table>
          <!-- Pagination Controls -->
          <div class="flex items-center gap-2 mt-2">
            <span class="text-xs">Page</span>
            <select
              class="select select-xs w-16"
              v-model="dssStockOutPage"
              :disabled="dssStockOutTotalPages <= 1"
            >
              <option v-for="page in dssStockOutTotalPages" :key="page" :value="page">
                {{ page }}
              </option>
            </select>
            <span class="text-xs">of {{ dssStockOutTotalPages }}</span>
          </div>
        </div>

        <!-- DSS Forecasting (Per Item, Stock In) -->
        <div class="bg-white p-4 rounded shadow mb-6 text-black">
          <h2 class="font-semibold mb-4">DSS Forecasting (Per Item, Stock In)</h2>
          <table class="min-w-full text-sm">
            <thead>
              <tr>
                <th class="text-left px-2 py-1">Item Code</th>
                <th class="text-left px-2 py-1">Item Name</th>
                <th class="text-left px-2 py-1">Category</th>
                <th class="text-center px-2 py-1">Forecasted Stock In (Next Month)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in paginatedItemStockInForecasts" :key="item.item_code">
                <td class="px-2 py-1">{{ item.item_code }}</td>
                <td class="px-2 py-1">{{ item.item_name }}</td>
                <td class="px-2 py-1">{{ item.category }}</td>
                <td class="text-center px-2 py-1">{{ item.forecast }}</td>
              </tr>
            </tbody>
          </table>
          <!-- Pagination Controls -->
          <div class="flex items-center gap-2 mt-2">
            <span class="text-xs">Page</span>
            <select
              class="select select-xs w-16"
              v-model="dssStockInPage"
              :disabled="dssStockInTotalPages <= 1"
            >
              <option v-for="page in dssStockInTotalPages" :key="page" :value="page">
                {{ page }}
              </option>
            </select>
            <span class="text-xs">of {{ dssStockInTotalPages }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
</style>
