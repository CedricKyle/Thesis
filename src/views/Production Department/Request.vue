<template>
  <div class="p-6 bg-gray-200 min-h-screen space-y-4">
    <!-- Filter Section -->
    <div class="bg-white p-4 rounded shadow flex flex-wrap gap-4">
      <input type="text" placeholder="Search" class="input input-bordered w-48" />
      <select class="select select-bordered w-48">
        <option disabled selected>Branch</option>
        <option>Branch 1</option>
        <option>Branch 2</option>
      </select>
      <input type="date" class="input input-bordered w-48" />
    </div>

    <!-- Product Request Table -->
    <div class="bg-white p-4 rounded shadow">
      <h2 class="text-lg font-semibold mb-2">Product Request</h2>
      <div class="overflow-x-auto border rounded">
        <table class="table w-full">
          <thead class="bg-primaryColor text-white">
            <tr>
              <th>Requester</th>
              <th>Branch</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <!-- Placeholder row (dynamic rows go here) -->
            <tr v-if="requests.length === 0">
              <td colspan="5" class="text-center text-gray-500 py-6">No requests found.</td>
            </tr>
            <tr v-for="(req, index) in requests" :key="index">
              <td>{{ req.requester }}</td>
              <td>{{ req.branch }}</td>
              <td>{{ req.product }}</td>
              <td>{{ req.quantity }}</td>
              <td>
                <button class="btn btn-xs btn-ghost">⋮</button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Footer -->
        <div class="flex justify-end items-center p-2 bg-primaryColor text-white rounded-b">
          <label class="label cursor-pointer">
            <span class="label-text text-white mr-2">Show all</span>
            <input type="checkbox" class="toggle toggle-success" v-model="showAll" />
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const showAll = ref(false)

// Example placeholder data; replace with actual API data
const requests = ref([
  // {
  //   requester: 'Jane',
  //   branch: 'Branch 1',
  //   product: 'Fries',
  //   quantity: 100,
  // },
])
</script>
