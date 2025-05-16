<script setup>
import { ref, computed, onMounted } from 'vue'
import { useInventoryStore } from '@/stores/SCM Stores/inventoryStore'
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

// Register Chart.js components
ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, BarElement, LinearScale)

const inventoryStore = useInventoryStore()

// Date range state
const dateRange = ref('1month') // options: '1day', '7days', '1month'

// Stats computed properties
const stats = computed(() => ({
  totalItems: inventoryStore.inventory.length,
  lowStock: inventoryStore.inventory.filter((i) => i.quantity <= i.reorder_point && i.quantity > 0)
    .length,
  outOfStock: inventoryStore.inventory.filter((i) => i.quantity === 0).length,
  totalValue: inventoryStore.inventory.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
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
const stockTrendData = computed(() => {
  // This is temporary data - replace with real data when available
  return {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Stock In',
        data: [65, 59, 80, 81, 56, 55],
        backgroundColor: '#466114',
      },
      {
        label: 'Stock Out',
        data: [28, 48, 40, 19, 86, 27],
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
    .filter((item) => item.quantity <= item.reorder_point)
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 5),
)

onMounted(() => {
  inventoryStore.fetchInventory()
})
</script>

<template>
  <div class="min-h-screen overflow-y-auto pb-6">
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
            <h1 class="text-4xl font-bold text-black">₱{{ stats.totalValue.toLocaleString() }}</h1>
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
