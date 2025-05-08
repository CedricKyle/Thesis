<script setup>
import { ref } from 'vue'

const searchQuery = ref('')
const selectedBranch = ref('')
const branchOptions = ['Branch 1', 'Branch 2', 'Branch 3'] // Replace with actual branch options

const tableData = ref([
  {
    supplier: 'Patrick M. Mirhan',
    orderDate: '2025-05-01',
    category: 'Office Supplies',
    product: 'Stapler',
    quantity: 20,
    unitPrice: 10,
    totalPrice: 200,
    status: 'Delivered',
  },
  {
    supplier: 'Nathaniel V. Vasquez',
    orderDate: '2025-05-02',
    category: 'Office Supplies',
    product: 'Printer Paper',
    quantity: 50,
    unitPrice: 5,
    totalPrice: 250,
    status: 'Pending',
  },
  {
    supplier: 'John Marco P. Paja',
    orderDate: '2025-05-03',
    category: 'Office Supplies',
    product: 'Ink Cartridges',
    quantity: 10,
    unitPrice: 15,
    totalPrice: 150,
    status: 'Delivered',
  },
  // Add more rows as needed
])
</script>

<template>
   <div class="employees-container">
    <div class="tabs tabs-border bg-primaryColor max-h-[600px] shadow-md">
      <!-- Purchase Tab -->
      <input type="radio" name="my_tabs_2" class="tab" aria-label="Purchase" />
      <div class="tab-content bg-white p-5">
        <!-- Search and Filter in Same Line with Add Supplies Button on Right -->
        <div class="flex justify-between items-center space-x-4">
          <!-- Search and Filters Section -->
          <div class="flex items-center space-x-4">
            <!-- Search input -->
            <label class="input-search input-sm flex items-center space-x-2">
              <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <g
                  stroke-linejoin="round"
                  stroke-linecap="round"
                  stroke-width="2.5"
                  fill="none"
                  stroke="currentColor"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </g>
              </svg>
              <input v-model="searchQuery" type="search" placeholder="Search" class="p-2" />
            </label>

            <!-- Category Filter -->
            <div class="flex items-center space-x-2">
              <span class="text-sm text-black">Category:</span>
              <select
                v-model="selectedCategory"
                class="select select-sm border border-black bg-white text-black"
              >
                <option v-for="category in categoryOptions" :key="category" :value="category">
                  {{ category }}
                </option>
              </select>
            </div>

            <!-- Branch Filter -->
            <div class="flex items-center space-x-2">
              <span class="text-sm text-black">Branch:</span>
              <select
                v-model="selectedBranch"
                class="select select-sm border border-black bg-white text-black"
              >
                <option v-for="branch in branchOptions" :key="branch" :value="branch">
                  {{ branch }}
                </option>
              </select>
            </div>
          </div>

          <!-- Add Supplies Button Positioned on the Right -->
          <button class="btn bg-primaryColor text-white px-4 rounded-xl">+ Add Supplies</button>
        </div>

        <!-- Purchase Data Table -->
        <div class="overflow-x-auto mt-5">
          <table class="table text-black w-full text-xs border border-gray-300 rounded-md">
            <thead class="text-black text-xs">
              <tr>
                <th>Supplier</th>
                <th>Order Date</th>
                <th>Category</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total Price</th>
                <th>Status</th>
                <th>Action</th> <!-- Added an "Action" column -->
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in tableData" :key="index">
                <td>{{ item.supplier }}</td>
                <td>{{ item.orderDate }}</td>
                <td>{{ item.category }}</td>
                <td>{{ item.product }}</td>
                <td>{{ item.quantity }}</td>
                <td>{{ item.unitPrice }}</td>
                <td>{{ item.totalPrice }}</td>
                <td>{{ item.status }}</td>
                <td>
                  <!-- Action buttons like "Edit", "Delete", etc. -->
                  <button class="btn btn-sm bg-blue-500 text-white">Edit</button>
                  <button class="btn btn-sm bg-red-500 text-white">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Purchase Orders -->
      <input type="radio" name="my_tabs_2" class="tab" aria-label="On going Purchase" />
      <div class="tab-content bg-white p-5">
        <!-- Search and Filter in Same Line -->
        <div class="flex items-center space-x-4">
          <!-- Search input -->
          <label class="input-search input-sm flex items-center space-x-2">
            <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <g
                stroke-linejoin="round"
                stroke-linecap="round"
                stroke-width="2.5"
                fill="none"
                stroke="currentColor"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
              </g>
            </svg>
            <input v-model="searchQuery" type="search" placeholder="Search" class="p-2" />
          </label>

          <!-- Branch Filter -->
          <div class="flex items-center space-x-2">
            <span class="text-sm text-black">Branch:</span>
            <select
              v-model="selectedBranch"
              class="select select-sm border border-black bg-white text-black"
            >
              <option v-for="branch in branchOptions" :key="branch" :value="branch">
                {{ branch }}
              </option>
            </select>
          </div>

          <!-- Category Filter -->
          <div class="flex items-center space-x-2">
            <span class="text-sm text-black">Category:</span>
            <select
              v-model="selectedBranch"
              class="select select-sm border border-black bg-white text-black"
            >
              <option v-for="branch in branchOptions" :key="branch" :value="branch">
                {{ branch }}
              </option>
            </select>
          </div>
        </div>
        <div class="overflow-x-auto mt-5">
          <table class="table text-black w-full text-xs border border-gray-300 rounded-md">
            <thead class="text-black text-xs">
              <tr>
                <th>Supplier</th>
                <th>Order date</th>
                <th>Category</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in tableData" :key="index">
                <td>{{ item.supplier }}</td>
                <td>{{ item.orderDate }}</td>
                <td>{{ item.category }}</td>
                <td>{{ item.product }}</td>
                <td>{{ item.quantity }}</td>
                <td>{{ item.unitPrice }}</td>
                <td>{{ item.totalPrice }}</td>
                <td>{{ item.status }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Purchase History Tab -->
      <input type="radio" name="my_tabs_2" class="tab" aria-label="Purchase History" />
      <div class="tab-content bg-white p-5">
        <!-- Search input -->
        <label class="input-search input-sm flex items-center space-x-2">
          <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <g
              stroke-linejoin="round"
              stroke-linecap="round"
              stroke-width="2.5"
              fill="none"
              stroke="currentColor"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </g>
          </svg>
          <input v-model="searchQuery" type="search" placeholder="Search" class="p-2" />
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped>
.group:hover .group-hover\:opacity-100 {
  opacity: 1;
}

.transition-opacity {
  transition: opacity 0.3s ease;
}

.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.space-x-2 {
  margin-right: 0.5rem;
}

.space-x-4 {
  margin-right: 1rem;
}
</style>
