<script setup>
import { ref, computed, onMounted } from 'vue'
import { useProductionBatchStore } from '@/stores/Production Store/productionBatchStore'
import { useInventoryStore } from '@/stores/SCM Stores/inventoryStore'
import dayjs from 'dayjs'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'
import axios from '@/plugins/axios'
import { useSCMRequestStore } from '@/stores/SCM Stores/scmRequestStore'

const productionBatchStore = useProductionBatchStore()
const inventoryStore = useInventoryStore()
const scmRequestStore = useSCMRequestStore()
const loading = ref(true)
const bom = ref({}) // Will be loaded from backend

onMounted(async () => {
  await productionBatchStore.fetchBatches()
  // Fetch BOM from backend (replace with your real endpoint)
  const res = await axios.get('/api/production/bom')
  bom.value = res.data // { product_name: { material: qtyPerUnit, ... }, ... }
  loading.value = false
})

const forecastMonths = 3

const forecastedProductionOut = computed(() => {
  const now = dayjs()
  // Array of 12 months, each value is total produced for that month
  const producedByMonth = Array(12).fill(0)
  productionBatchStore.batches.forEach((batch) => {
    const date = dayjs(batch.production_date || batch.created_at)
    const month = date.month()
    producedByMonth[month] += Number(batch.primary_stock || 0) + Number(batch.secondary_stock || 0)
  })
  let monthsToAverage = []
  for (let i = 0; i < forecastMonths; i++) {
    monthsToAverage.push((now.month() - i + 12) % 12)
  }
  // For debugging
  console.log('Produced By Month:', producedByMonth)
  console.log('Months to Average:', monthsToAverage)
  console.log(
    'Values to Average:',
    monthsToAverage.map((m) => producedByMonth[m]),
  )
  const total = monthsToAverage.reduce((sum, m) => sum + producedByMonth[m], 0)
  return Math.round(total / forecastMonths)
})

const perProductForecast = computed(() => {
  const now = dayjs()
  const perProduct = {}
  productionBatchStore.batches.forEach((batch) => {
    if (!perProduct[batch.product_name]) perProduct[batch.product_name] = Array(12).fill(0)
    const date = dayjs(batch.production_date || batch.created_at)
    const month = date.month()
    perProduct[batch.product_name][month] +=
      Number(batch.primary_stock || 0) + Number(batch.secondary_stock || 0)
  })
  const result = []
  for (const name in perProduct) {
    let monthsToAverage = []
    for (let i = 0; i < forecastMonths; i++) {
      monthsToAverage.push((now.month() - i + 12) % 12)
    }
    const total = monthsToAverage.reduce((sum, m) => sum + perProduct[name][m], 0)
    result.push({
      product_name: name,
      forecast: Math.round(total / forecastMonths),
    })
  }
  return result
})

const perProductForecastWithUnit = computed(() => {
  // Find the latest batch for each product to get the unit
  return perProductForecast.value.map((product) => {
    // Find the latest batch for this product (by production_date)
    const batch = productionBatchStore.batches
      .filter((b) => b.product_name === product.product_name)
      .sort((a, b) => new Date(b.production_date) - new Date(a.production_date))[0]
    return {
      ...product,
      unit: batch ? batch.unit : '',
    }
  })
})

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale)

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

// Compute actual production per month
const actualProductionByMonth = computed(() => {
  const arr = Array(12).fill(0)
  productionBatchStore.batches.forEach((batch) => {
    const date = dayjs(batch.production_date || batch.created_at)
    const month = date.month()
    arr[month] += Number(batch.primary_stock || 0) + Number(batch.secondary_stock || 0)
  })
  return arr
})

// Compute forecast for next 3 months (repeat last forecast)
const forecastedProduction = computed(() => {
  // Use your existing forecast logic
  const now = dayjs()
  let monthsToAverage = []
  for (let i = 0; i < forecastMonths; i++) {
    monthsToAverage.push((now.month() - i + 12) % 12)
  }
  const total = monthsToAverage.reduce((sum, m) => sum + actualProductionByMonth.value[m], 0)
  const forecast = Math.round(total / forecastMonths)
  // Build forecast array: fill current and next 2 months with forecast value
  const arr = Array(12).fill(null)
  for (let i = 0; i < forecastMonths; i++) {
    arr[(now.month() + i + 1) % 12] = forecast // forecast for next months
  }
  return arr
})

// Chart.js data
const lineChartData = computed(() => ({
  labels: months,
  datasets: [
    {
      label: 'Actual Production',
      data: actualProductionByMonth.value,
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      tension: 0.3,
      fill: false,
      pointStyle: 'circle',
      pointRadius: 4,
      pointBorderWidth: 2,
    },
    {
      label: 'Forecasted Production',
      data: forecastedProduction.value,
      borderColor: 'rgba(248, 122, 20, 0.9)',
      backgroundColor: 'rgba(248, 122, 20, 0.2)',
      borderWidth: 3,
      tension: 0.3,
      fill: false,
      pointStyle: 'circle',
      pointRadius: 4,
      pointBorderWidth: 2,
    },
  ],
}))

const lineChartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: 'Production Forecasting (Actual vs Forecasted)',
    },
  },
  scales: {
    y: {
      beginAtZero: true,
    },
  },
}

// Pagination for DSS Per Product Forecast
const dssProductPage = ref(1)
const dssProductRowsPerPage = 10

const paginatedPerProductForecast = computed(() => {
  const start = (dssProductPage.value - 1) * dssProductRowsPerPage
  return perProductForecast.value.slice(start, start + dssProductRowsPerPage)
})

const dssProductTotalPages = computed(() =>
  Math.ceil(perProductForecast.value.length / dssProductRowsPerPage),
)

// Get current inventory per product from inventoryStore
const currentInventory = computed(() => {
  const map = {}
  inventoryStore.inventory.forEach((item) => {
    map[item.item_name] = Number(item.quantity)
  })
  return map
})

// Get forecasted orders per product from your order/request store
const forecastedOrders = computed(() => {
  const map = {}
  const nextMonth = dayjs().add(1, 'month').month()
  scmRequestStore.requests.forEach((req) => {
    req.items.forEach((item) => {
      const reqMonth = dayjs(item.request_date).month()
      if (reqMonth === nextMonth) {
        map[item.product_name] = (map[item.product_name] || 0) + Number(item.quantity)
      }
    })
  })
  return map
})

const inventoryImpact = computed(() => {
  return perProductForecast.value.map((product) => {
    const name = product.product_name
    const current = currentInventory.value[name] || 0
    const forecastProd = product.forecast
    const forecastOrder = forecastedOrders.value[name] || 0
    return {
      product_name: name,
      projected_inventory: current + forecastProd - forecastOrder,
    }
  })
})

const orderFulfillment = computed(() => {
  return perProductForecast.value.map((product) => {
    const name = product.product_name
    const forecastProd = product.forecast
    const forecastOrder = forecastedOrders.value[name] || 0
    const fulfillment =
      forecastOrder === 0 ? 100 : Math.min(100, (forecastProd / forecastOrder) * 100)
    return {
      product_name: name,
      fulfillment: fulfillment.toFixed(1),
      backlog: Math.max(0, forecastOrder - forecastProd),
    }
  })
})

const demandIncreasePercent = ref(0)

const scenarioOrderFulfillment = computed(() => {
  return perProductForecast.value.map((product) => {
    const name = product.product_name
    const forecastProd = product.forecast
    const baseOrder = forecastedOrders.value[name] || 0
    const scenarioOrder = Math.round(baseOrder * (1 + demandIncreasePercent.value / 100))
    const fulfillment =
      scenarioOrder === 0 ? 100 : Math.min(100, (forecastProd / scenarioOrder) * 100)
    return {
      product_name: name,
      scenarioOrder,
      fulfillment: fulfillment.toFixed(1),
      backlog: Math.max(0, scenarioOrder - forecastProd),
    }
  })
})

const paginatedPerProductForecastWithUnit = computed(() => {
  const start = (dssProductPage.value - 1) * dssProductRowsPerPage
  return perProductForecastWithUnit.value.slice(start, start + dssProductRowsPerPage)
})
</script>

<template>
  <div>
    <div v-if="loading">Loading...</div>
    <div v-else class="grid grid-cols-2 gap-4 my-6">
      <div class="card bg-white shadow-md">
        <div class="card-body">
          <div class="card-header flex justify-between">
            <h1 class="text-gray-600">Forecasted Production Out (Next Month)</h1>
          </div>
          <div class="card-content mt-4 flex justify-between">
            <h1 class="text-4xl font-bold text-black">{{ forecastedProductionOut }}</h1>
          </div>
          <div class="text-xs text-gray-500 mt-2">
            Based on average of last {{ forecastMonths }} months' production.
          </div>
        </div>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-4 my-6">
      <div class="bg-white p-4 rounded shadow mb-6 text-black">
        <h2 class="font-semibold mb-4">DSS Forecasting (Per Product, Production Out)</h2>
        <table class="min-w-full text-sm">
          <thead>
            <tr>
              <th class="text-left px-2 py-1">Product Name</th>
              <th class="text-center px-2 py-1">Forecasted Production (Next Month)</th>
              <th class="text-center px-2 py-1">Unit</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in paginatedPerProductForecastWithUnit" :key="item.product_name">
              <td class="px-2 py-1">{{ item.product_name }}</td>
              <td class="text-center px-2 py-1">{{ item.forecast }}</td>
              <td class="text-center px-2 py-1">{{ item.unit }}</td>
            </tr>
          </tbody>
        </table>
        <!-- Pagination Controls -->
        <div class="flex items-center gap-2 mt-2">
          <span class="text-xs">Page</span>
          <select
            class="select select-xs w-16"
            v-model="dssProductPage"
            :disabled="dssProductTotalPages <= 1"
          >
            <option v-for="page in dssProductTotalPages" :key="page" :value="page">
              {{ page }}
            </option>
          </select>
          <span class="text-xs">of {{ dssProductTotalPages }}</span>
        </div>
      </div>
      <div class="bg-white p-4 rounded shadow mb-6 text-black">
        <h2 class="font-semibold mb-4">Production Forecasting Trend</h2>
        <div class="flex justify-center">
          <div class="w-full max-w-2xl min-w-[350px]">
            <Line :data="lineChartData" :options="lineChartOptions" />
          </div>
        </div>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-4 my-6">
      <div class="bg-white p-4 rounded shadow mb-6 text-black">
        <h2 class="font-semibold mb-4">Projected Inventory (End of Next Month)</h2>
        <table class="min-w-full text-sm">
          <thead>
            <tr>
              <th class="text-left px-2 py-1">Product</th>
              <th class="text-center px-2 py-1">Projected Inventory</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in inventoryImpact" :key="item.product_name">
              <td class="px-2 py-1">{{ item.product_name }}</td>
              <td class="text-center px-2 py-1">{{ item.projected_inventory }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="bg-white p-4 rounded shadow mb-6 text-black">
        <h2 class="font-semibold mb-4">Order Fulfillment (Next Month)</h2>
        <table class="min-w-full text-sm">
          <thead>
            <tr>
              <th class="text-left px-2 py-1">Product</th>
              <th class="text-center px-2 py-1">Fulfillment Rate (%)</th>
              <th class="text-center px-2 py-1">Backlog</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in orderFulfillment" :key="item.product_name">
              <td class="px-2 py-1">{{ item.product_name }}</td>
              <td class="text-center px-2 py-1">{{ item.fulfillment }}</td>
              <td class="text-center px-2 py-1">{{ item.backlog }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="gap-4 my-6">
      <div class="bg-white p-4 rounded shadow mb-6 text-black">
        <h2 class="font-semibold mb-4">Scenario Analysis: What if Demand Changes?</h2>
        <div class="mb-2">
          <label>Increase Demand by (%)</label>
          <input
            type="number"
            v-model.number="demandIncreasePercent"
            class="input-search input-xs w-20 ml-2"
          />
        </div>
        <table class="min-w-full text-sm">
          <thead>
            <tr>
              <th class="text-left px-2 py-1">Product</th>
              <th class="text-center px-2 py-1">Scenario Demand</th>
              <th class="text-center px-2 py-1">Fulfillment Rate (%)</th>
              <th class="text-center px-2 py-1">Backlog</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in scenarioOrderFulfillment" :key="item.product_name">
              <td class="px-2 py-1">{{ item.product_name }}</td>
              <td class="text-center px-2 py-1">{{ item.scenarioOrder }}</td>
              <td class="text-center px-2 py-1">{{ item.fulfillment }}</td>
              <td class="text-center px-2 py-1">{{ item.backlog }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
