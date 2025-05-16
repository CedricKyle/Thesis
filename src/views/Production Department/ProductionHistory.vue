<script setup>
import { ref, computed } from 'vue'
import Toast from '@/components/Admin Components/HR/Toast.vue'

// State Management
const searchQuery = ref('')
const dateRange = ref({
  start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], // Last 30 days
  end: new Date().toISOString().split('T')[0],
})
const filterType = ref('all') // all, batches, distributions, adjustments

// Mock data - replace with actual data from store
const productionHistory = ref([
  {
    id: 1,
    type: 'batch',
    batch_number: 'BN-001',
    product_name: 'Frozen Lumpia',
    quantity: 100,
    unit: 'packs',
    production_date: '2024-03-15',
    expiry_date: '2024-06-15',
    status: 'completed',
    production_manager: 'John Doe',
    raw_materials: [
      { name: 'Lumpia Wrapper', quantity: 100, unit: 'pcs' },
      { name: 'Ground Pork', quantity: 5, unit: 'kg' },
    ],
  },
  {
    id: 2,
    type: 'distribution',
    batch_number: 'BN-001',
    product_name: 'Frozen Lumpia',
    quantity: 50,
    unit: 'packs',
    distribution_date: '2024-03-16',
    destination_branch: 'Main Branch',
    status: 'completed',
    distributed_by: 'Jane Smith',
  },
  {
    id: 3,
    type: 'adjustment',
    batch_number: 'BN-001',
    product_name: 'Frozen Lumpia',
    quantity: -5,
    unit: 'packs',
    adjustment_date: '2024-03-17',
    reason: 'Quality control - Damaged packaging',
    status: 'completed',
    adjusted_by: 'Mike Johnson',
  },
])

// Computed
const filteredHistory = computed(() => {
  return productionHistory.value.filter((item) => {
    const matchesSearch =
      item.batch_number.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.product_name.toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesDate =
      new Date(item.production_date || item.distribution_date || item.adjustment_date) >=
        new Date(dateRange.value.start) &&
      new Date(item.production_date || item.distribution_date || item.adjustment_date) <=
        new Date(dateRange.value.end)

    const matchesType = filterType.value === 'all' || item.type === filterType.value

    return matchesSearch && matchesDate && matchesType
  })
})

// Functions
function getStatusColor(status) {
  return (
    {
      completed: 'success',
      pending: 'warning',
      cancelled: 'error',
    }[status] || 'info'
  )
}

function formatDate(date) {
  return new Date(date).toLocaleDateString()
}

function exportHistory() {
  // TODO: Implement export functionality
  console.log('Exporting history...')
}
</script>

<template>
  <div class="bg-white rounded-lg shadow">
    <!-- Header -->
    <div class="p-4 border-b">
      <h1 class="text-xl font-bold text-gray-800">Production History</h1>
    </div>

    <!-- Filters -->
    <div class="p-4 border-b bg-gray-50">
      <div class="grid grid-cols-4 gap-4">
        <!-- Search -->
        <div>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by batch or product..."
            class="input !bg-white !border-black !text-black w-full"
          />
        </div>

        <!-- Date Range -->
        <div class="col-span-2">
          <div class="flex gap-2">
            <div class="flex-1">
              <label class="text-sm font-semibold text-gray-600">Start Date</label>
              <input
                v-model="dateRange.start"
                type="date"
                class="input !bg-white !border-black !text-black w-full mt-1"
              />
            </div>
            <div class="flex-1">
              <label class="text-sm font-semibold text-gray-600">End Date</label>
              <input
                v-model="dateRange.end"
                type="date"
                class="input !bg-white !border-black !text-black w-full mt-1"
              />
            </div>
          </div>
        </div>

        <!-- Filter Type -->
        <div>
          <label class="text-sm font-semibold text-gray-600">Filter Type</label>
          <select
            v-model="filterType"
            class="select !bg-white !border-black !text-black w-full mt-1"
          >
            <option value="all">All Activities</option>
            <option value="batch">Production Batches</option>
            <option value="distribution">Distributions</option>
            <option value="adjustment">Adjustments</option>
          </select>
        </div>
      </div>
    </div>

    <!-- History Table -->
    <div class="p-4">
      <div class="flex justify-end mb-4">
        <button class="btn-secondaryStyle" @click="exportHistory">Export History</button>
      </div>

      <div class="overflow-x-auto">
        <table class="table table-compact w-full">
          <thead>
            <tr class="bg-primaryColor text-white">
              <th class="text-xs">Date</th>
              <th class="text-xs">Type</th>
              <th class="text-xs">Batch Number</th>
              <th class="text-xs">Product</th>
              <th class="text-xs">Quantity</th>
              <th class="text-xs">Unit</th>
              <th class="text-xs">Status</th>
              <th class="text-xs">Details</th>
            </tr>
          </thead>
          <tbody class="text-xs text-black">
            <tr v-for="item in filteredHistory" :key="item.id" class="hover:bg-gray-50">
              <td>
                {{
                  formatDate(item.production_date || item.distribution_date || item.adjustment_date)
                }}
              </td>
              <td>
                <span
                  :class="{
                    'badge badge-sm badge-info badge-outline': item.type === 'batch',
                    'badge badge-sm badge-success badge-outline': item.type === 'distribution',
                    'badge badge-sm badge-warning badge-outline': item.type === 'adjustment',
                  }"
                >
                  {{ item.type.charAt(0).toUpperCase() + item.type.slice(1) }}
                </span>
              </td>
              <td>{{ item.batch_number }}</td>
              <td>{{ item.product_name }}</td>
              <td>{{ item.quantity }}</td>
              <td>{{ item.unit }}</td>
              <td>
                <span
                  :class="{
                    'badge badge-sm badge-success badge-outline': item.status === 'completed',
                    'badge badge-sm badge-warning badge-outline': item.status === 'pending',
                    'badge badge-sm badge-error badge-outline': item.status === 'cancelled',
                  }"
                >
                  {{ item.status.charAt(0).toUpperCase() + item.status.slice(1) }}
                </span>
              </td>
              <td>
                <button class="btn-secondaryStyle btn-xs">View Details</button>
              </td>
            </tr>
            <tr v-if="!filteredHistory.length">
              <td colspan="8" class="text-center py-4 text-gray-500">No history found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
