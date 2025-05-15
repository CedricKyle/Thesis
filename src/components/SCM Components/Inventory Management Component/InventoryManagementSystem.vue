<script setup>
import { ref, computed } from 'vue'

// State Management
const activeTab = ref('monitoring') // monitoring, stock-in, stock-out, adjustment
const inventory = ref([
  // Sample data - replace with actual data from your store later
  {
    id: 1,
    item_code: 'RM001',
    item_name: 'Raw Material 1',
    type: 'raw_material',
    quantity: 100,
    unit: 'kg',
    minimum_stock_level: 20,
    updated_at: new Date(),
  },
  // Add more sample items as needed
])

const searchQuery = ref('')
const filterType = ref('all')

// Computed Properties
const filteredInventory = computed(() => {
  return inventory.value.filter((item) => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesType = filterType.value === 'all' || item.type === filterType.value
    return matchesSearch && matchesType
  })
})

// Stats Computed Properties
const stats = computed(() => ({
  total: inventory.value.length,
  inStock: inventory.value.filter((i) => i.quantity > i.minimum_stock_level).length,
  lowStock: inventory.value.filter((i) => i.quantity <= i.minimum_stock_level && i.quantity > 0)
    .length,
  outOfStock: inventory.value.filter((i) => i.quantity === 0).length,
}))

function addToInventory(receivedItems) {
  receivedItems.forEach((received) => {
    const existing = inventory.value.find((item) => item.item_code === received.item_code)
    if (existing) {
      existing.quantity += Number(received.quantity)
      existing.updated_at = new Date()
    } else {
      inventory.value.push({
        ...received,
        quantity: Number(received.quantity),
        updated_at: new Date(),
      })
    }
  })
}

function simulateReceive() {
  addToInventory([
    {
      item_code: 'RM001',
      item_name: 'Raw Material 1',
      type: 'raw_material',
      quantity: 5,
      unit: 'kg',
      minimum_stock_level: 20,
    },
    {
      item_code: 'RM002',
      item_name: 'Bigas',
      quantity: 3,
      unit: 'pack',
      minimum_stock_level: 10,
    },
  ])
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
              class="input input-bordered input-sm w-64"
            />
            <select v-model="filterType" class="select select-bordered select-sm">
              <option value="all">All Items</option>
              <option value="raw_material">Raw Materials</option>
              <option value="finished_product">Finished Products</option>
            </select>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-4 gap-4 mb-6">
          <div class="stat bg-blue-50 rounded-lg p-4">
            <div class="stat-title text-xs">Total Items</div>
            <div class="stat-value text-blue-500 text-2xl">{{ stats.total }}</div>
          </div>
          <div class="stat bg-green-50 rounded-lg p-4">
            <div class="stat-title text-xs">In Stock</div>
            <div class="stat-value text-green-500 text-2xl">{{ stats.inStock }}</div>
          </div>
          <div class="stat bg-yellow-50 rounded-lg p-4">
            <div class="stat-title text-xs">Low Stock</div>
            <div class="stat-value text-yellow-500 text-2xl">{{ stats.lowStock }}</div>
          </div>
          <div class="stat bg-red-50 rounded-lg p-4">
            <div class="stat-title text-xs">Out of Stock</div>
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
              <tr v-for="item in filteredInventory" :key="item.id" class="text-xs hover:bg-gray-50">
                <td>{{ item.item_code }}</td>
                <td>{{ item.item_name }}</td>
                <td>{{ item.type }}</td>
                <td>{{ item.quantity }}</td>
                <td>{{ item.unit }}</td>
                <td>{{ item.minimum_stock_level }}</td>
                <td>
                  <span
                    :class="{
                      'badge badge-sm badge-success': item.quantity > item.minimum_stock_level,
                      'badge badge-sm badge-warning':
                        item.quantity <= item.minimum_stock_level && item.quantity > 0,
                      'badge badge-sm badge-error': item.quantity === 0,
                    }"
                  >
                    {{
                      item.quantity > item.minimum_stock_level
                        ? 'In Stock'
                        : item.quantity === 0
                          ? 'Out of Stock'
                          : 'Low Stock'
                    }}
                  </span>
                </td>
                <td>{{ new Date(item.updated_at).toLocaleDateString() }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <button class="btn btn-primary mb-4" @click="simulateReceive">
          Simulate Confirm Receive
        </button>
      </div>

      <!-- Stock In Tab -->
      <div v-if="activeTab === 'stock-in'" class="text-center py-8 text-gray-500">
        Stock In functionality coming soon...
      </div>

      <!-- Stock Out Tab -->
      <div v-if="activeTab === 'stock-out'" class="text-center py-8 text-gray-500">
        Stock Out functionality coming soon...
      </div>

      <!-- Adjustment Tab -->
      <div v-if="activeTab === 'adjustment'" class="text-center py-8 text-gray-500">
        Stock Adjustment functionality coming soon...
      </div>
    </div>
  </div>
</template>
