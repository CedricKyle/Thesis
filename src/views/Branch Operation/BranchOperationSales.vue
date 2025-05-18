<script setup>
import { ref, computed } from 'vue'

const search = ref('')
const currentPage = ref(2)
const rowsPerPage = 8

const sales = [
  {
    customer: '01',
    items: [
      { name: 'Pork Sisig', qty: 2 },
      { name: 'Pork Silog', qty: 1 },
    ],
    total: 450,
    pay: 450,
    change: 0,
    pax: 3,
    date: '2025-03-14 14:30:45',
    type: 'Dine in',
    preparedBy: 'John Marco Paja',
    status: 'Void',
  },
  // ...repeat for demo, you can generate more for pagination
]
while (sales.length < 24) {
  sales.push({ ...sales[0], customer: (sales.length + 1).toString().padStart(2, '0') })
}

const filteredSales = computed(() => {
  if (!search.value) return sales
  return sales.filter((s) =>
    s.items.some((i) => i.name.toLowerCase().includes(search.value.toLowerCase())),
  )
})

const paginatedSales = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage
  return filteredSales.value.slice(start, start + rowsPerPage)
})

const totalPages = computed(() => Math.ceil(filteredSales.value.length / rowsPerPage))

function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) currentPage.value = page
}
</script>

<template>
  <div class="p-8 bg-[#e9e9f6] min-h-screen">
    <!-- Top Bar -->
    <div class="flex justify-between items-center mb-4">
      <div class="flex items-center gap-2">
        <span class="relative">
          <input
            v-model="search"
            type="text"
            placeholder="Search"
            class="pl-8 pr-4 py-2 border border-[#b6c48a] rounded outline-none w-64"
          />
          <span class="absolute left-2 top-1/2 -translate-y-1/2 text-[#b6c48a]">🔍</span>
        </span>
      </div>
      <button
        class="border border-[#b6c48a] px-4 py-2 rounded bg-white text-sm flex items-center gap-2"
      >
        Check Sales Status <span>↗️</span>
      </button>
    </div>
    <!-- Table -->
    <div class="bg-white rounded shadow overflow-x-auto" style="max-width: 100vw">
      <table class="w-full min-w-[1100px] text-sm">
        <thead>
          <tr class="bg-[#5a7114] text-white">
            <th class="py-3 px-2 text-left whitespace-nowrap">Customer #</th>
            <th class="py-3 px-2 text-left whitespace-nowrap">Item</th>
            <th class="py-3 px-2 text-left whitespace-nowrap">Total Cost</th>
            <th class="py-3 px-2 text-left whitespace-nowrap">Pay Amount</th>
            <th class="py-3 px-2 text-left whitespace-nowrap">Change Due</th>
            <th class="py-3 px-2 text-left whitespace-nowrap">PAX</th>
            <th class="py-3 px-2 text-left whitespace-nowrap">Order Date</th>
            <th class="py-3 px-2 text-left whitespace-nowrap">Order Type</th>
            <th class="py-3 px-2 text-left whitespace-nowrap">Prepared By</th>
            <th class="py-3 px-2 text-left whitespace-nowrap">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in paginatedSales" :key="row.customer" class="border-b last:border-b-0">
            <td class="py-3 px-2 font-bold text-lg text-[#5a7114] whitespace-nowrap">
              {{ row.customer }}
            </td>
            <td class="py-3 px-2">
              <div v-for="item in row.items" :key="item.name">
                {{ item.name }}<br />
                <span class="text-xs text-gray-500">{{ item.qty }}x</span>
              </div>
            </td>
            <td class="py-3 px-2 font-bold whitespace-nowrap">₱{{ row.total.toFixed(2) }}</td>
            <td class="py-3 px-2 font-bold whitespace-nowrap">₱{{ row.pay.toFixed(2) }}</td>
            <td class="py-3 px-2 whitespace-nowrap">{{ row.change.toFixed(2) }}</td>
            <td class="py-3 px-2 whitespace-nowrap">{{ row.pax }}</td>
            <td class="py-3 px-2 whitespace-nowrap">{{ row.date }}</td>
            <td class="py-3 px-2 whitespace-nowrap">{{ row.type }}</td>
            <td class="py-3 px-2 whitespace-nowrap">{{ row.preparedBy }}</td>
            <td class="py-3 px-2 whitespace-nowrap">
              <button class="bg-red-100 text-red-500 px-4 py-1 rounded-full text-xs font-bold">
                {{ row.status }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- Pagination -->
    <div class="flex justify-end items-center gap-2 mt-4">
      <button
        class="px-2 py-1 rounded hover:bg-gray-200"
        :disabled="currentPage === 1"
        @click="goToPage(currentPage - 1)"
      >
        &lt;
      </button>
      <button
        v-for="page in totalPages"
        :key="page"
        class="px-2 py-1 rounded"
        :class="{
          'bg-[#5a7114] text-white font-bold': page === currentPage,
          'hover:bg-gray-200': page !== currentPage,
        }"
        @click="goToPage(page)"
      >
        {{ page }}
      </button>
      <button
        class="px-2 py-1 rounded hover:bg-gray-200"
        :disabled="currentPage === totalPages"
        @click="goToPage(currentPage + 1)"
      >
        &gt;
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Add any custom styles here if needed */
</style>
