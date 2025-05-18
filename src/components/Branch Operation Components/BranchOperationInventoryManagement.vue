<script setup>
import { ref, computed } from 'vue'

// Mock inventory data
const inventory = ref([
  { item_code: 'ITEM-001', name: 'Product A', quantity: 100, unit: 'pcs' },
  { item_code: 'ITEM-002', name: 'Product B', quantity: 50, unit: 'boxes' },
  { item_code: 'ITEM-003', name: 'Product C', quantity: 200, unit: 'pcs' },
])

const search = ref('')

const filteredInventory = computed(() =>
  inventory.value.filter(
    (item) =>
      item.item_code.toLowerCase().includes(search.value.toLowerCase()) ||
      item.name.toLowerCase().includes(search.value.toLowerCase()),
  ),
)
</script>

<template>
  <div class="p-6 bg-white rounded shadow">
    <h2 class="text-lg font-bold mb-4 text-primaryColor">Branch Inventory</h2>
    <div class="mb-4">
      <input
        v-model="search"
        type="text"
        placeholder="Search by code or name..."
        class="input-search input-bordered w-full max-w-xs"
      />
    </div>
    <div class="overflow-x-auto">
      <table class="table w-full">
        <thead>
          <tr class="bg-primaryColor text-white">
            <th>Item Code</th>
            <th>Name</th>
            <th>Quantity</th>
            <th>Unit</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredInventory" :key="item.item_code">
            <td>{{ item.item_code }}</td>
            <td>{{ item.name }}</td>
            <td>{{ item.quantity }}</td>
            <td>{{ item.unit }}</td>
          </tr>
          <tr v-if="filteredInventory.length === 0">
            <td colspan="4" class="text-center text-gray-500">No items found.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
