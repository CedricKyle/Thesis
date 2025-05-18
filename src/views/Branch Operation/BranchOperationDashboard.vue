<script setup>
import { ref } from 'vue'

// Placeholder data
const todaySales = ref(1290)
const bestSalesOfWeek = ref('Molded Door')
const topSellingProduct = ref('Molded Door')
const todayIncome = ref(133342)

const weeklySales = [5000, 7000, 3000, 6000, 2000, 4000, 1000]
const monthlySales = [
  20000, 25000, 18000, 30000, 27000, 32000, 29000, 31000, 28000, 35000, 33000, 37000,
]
const yearlySales = [
  250000, 270000, 220000, 300000, 280000, 320000, 310000, 330000, 300000, 350000, 340000, 370000,
]

const salesRemit = [
  { id: 1, name: 'John Marco Paja', total: 1500, date: '02-10-2025' },
  { id: 2, name: 'John Marco Paja', total: 1000, date: '02-09-2025' },
  { id: 3, name: 'John Marco Paja', total: 4500, date: '02-08-2025' },
  { id: 4, name: 'John Marco Paja', total: 6500, date: '02-07-2025' },
  { id: 5, name: 'John Marco Paja', total: 8000, date: '02-06-2025' },
  { id: 6, name: 'John Marco Paja', total: 5400, date: '02-05-2025' },
  { id: 7, name: 'John Marco Paja', total: 1500, date: '02-03-2025' },
]

const purchasedReport = [
  { id: 1, name: 'Tapsilog', qty: 34, date: '02-10-2025', total: 1500 },
  { id: 2, name: 'Porksilog', qty: 23, date: '02-10-2025', total: 1000 },
  { id: 3, name: 'Tocilog', qty: 56, date: '02-08-2025', total: 4500 },
  { id: 4, name: 'Pork Sisig', qty: 109, date: '02-07-2025', total: 6500 },
  { id: 5, name: 'Sizzling Pusit', qty: 12, date: '02-06-2025', total: 1800 },
  { id: 6, name: 'Bacsilog', qty: 2, date: '02-05-2025', total: 6000 },
  { id: 7, name: 'Tenderloin Steak', qty: 12, date: '02-04-2025', total: 5400 },
  { id: 8, name: 'Sizzling Chicken Wings', qty: 1, date: '02-03-2025', total: 1500 },
]
</script>

<template>
  <div class="p-6 bg-[#fdfbe9] min-h-screen">
    <!-- Top Cards -->
    <div class="grid grid-cols-4 gap-4 mb-4">
      <div class="bg-white rounded-lg shadow p-4 flex flex-col justify-between">
        <div class="text-gray-500">Today's Sales</div>
        <div class="text-2xl font-bold mt-2 mb-1">
          ₱{{ todaySales.toLocaleString(undefined, { minimumFractionDigits: 2 }) }}
        </div>
        <div class="flex items-center gap-2">
          <span
            class="bg-[#5a7114] text-white rounded-full w-8 h-8 flex items-center justify-center text-xl"
            >₱</span
          >
        </div>
      </div>
      <div class="bg-white rounded-lg shadow p-4 flex flex-col justify-between">
        <div class="text-gray-500">Best Sales of the Week</div>
        <div class="text-2xl font-bold mt-2 mb-1">{{ bestSalesOfWeek }}</div>
        <div class="flex items-center gap-2">
          <span
            class="bg-yellow-300 text-white rounded-full w-8 h-8 flex items-center justify-center text-xl"
            >⏰</span
          >
        </div>
      </div>
      <div class="bg-white rounded-lg shadow p-4 flex flex-col justify-between">
        <div class="text-gray-500">Top Selling Product Today</div>
        <div class="text-2xl font-bold mt-2 mb-1">{{ topSellingProduct }}</div>
        <div class="flex items-center gap-2">
          <span
            class="bg-yellow-300 text-white rounded-full w-8 h-8 flex items-center justify-center text-xl"
            >⏰</span
          >
        </div>
      </div>
      <div class="bg-white rounded-lg shadow p-4 flex flex-col justify-between">
        <div class="text-gray-500">Today's Income</div>
        <div class="text-2xl font-bold mt-2 mb-1">
          ₱{{ todayIncome.toLocaleString(undefined, { minimumFractionDigits: 2 }) }}+
        </div>
        <div class="flex items-center gap-2">
          <span
            class="bg-[#5a7114] text-white rounded-full w-8 h-8 flex items-center justify-center text-xl"
            >₱</span
          >
        </div>
      </div>
    </div>

    <!-- Charts -->
    <div class="grid grid-cols-3 gap-4 mb-4">
      <!-- Weekly Sales -->
      <div class="bg-white rounded-lg shadow p-4">
        <div class="font-semibold text-green-700 mb-2">Weekly Sales</div>
        <div class="h-36 flex items-end gap-2">
          <div v-for="(val, i) in weeklySales" :key="i" class="flex flex-col items-center w-8">
            <div
              class="bg-[#5a7114] w-6 rounded-t"
              :style="{ height: val / 70 + 'px', minHeight: '10px' }"
            ></div>
            <div class="text-xs mt-1 text-gray-500">
              {{ ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i] }}
            </div>
          </div>
        </div>
      </div>
      <!-- Monthly Sales -->
      <div class="bg-white rounded-lg shadow p-4">
        <div class="font-semibold text-yellow-700 mb-2">Monthly Sales</div>
        <svg viewBox="0 0 300 100" class="w-full h-36">
          <polyline
            fill="none"
            stroke="#facc15"
            stroke-width="3"
            :points="monthlySales.map((v, i) => `${i * 27},${100 - v / 400}`).join(' ')"
          />
          <circle
            v-for="(v, i) in monthlySales"
            :key="i"
            :cx="i * 27"
            :cy="100 - v / 400"
            r="3"
            fill="#facc15"
          />
        </svg>
        <div class="flex justify-between text-xs text-gray-500 mt-1">
          <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span
          ><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span
          ><span>Nov</span><span>Dec</span>
        </div>
      </div>
      <!-- Yearly Sales -->
      <div class="bg-white rounded-lg shadow p-4">
        <div class="font-semibold text-green-700 mb-2">Yearly Sales</div>
        <svg viewBox="0 0 300 100" class="w-full h-36">
          <polyline
            fill="none"
            stroke="#5a7114"
            stroke-width="3"
            :points="yearlySales.map((v, i) => `${i * 27},${100 - v / 4000}`).join(' ')"
          />
          <circle
            v-for="(v, i) in yearlySales"
            :key="i"
            :cx="i * 27"
            :cy="100 - v / 4000"
            r="3"
            fill="#5a7114"
          />
        </svg>
        <div class="flex justify-between text-xs text-gray-500 mt-1">
          <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span
          ><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span
          ><span>Nov</span><span>Dec</span>
        </div>
      </div>
    </div>

    <!-- Tables -->
    <div class="grid grid-cols-2 gap-4">
      <!-- Sales Remit Table -->
      <div class="bg-white rounded-lg shadow p-4">
        <div class="flex justify-between items-center mb-2">
          <div class="font-semibold">Sales Remit</div>
          <div
            class="bg-green-100 text-green-700 px-2 py-1 rounded text-xs flex items-center gap-1"
          >
            Feb <span class="ml-1">🗓️</span>
          </div>
        </div>
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-gray-500 border-b">
              <th class="py-1">Sales ID</th>
              <th>Name</th>
              <th>Total Sales</th>
              <th>Date</th>
              <th>Validate</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in salesRemit" :key="row.id" class="border-b">
              <td class="py-1">{{ row.id }}</td>
              <td>{{ row.name }}</td>
              <td class="font-bold text-black">
                ₱{{ row.total.toLocaleString(undefined, { minimumFractionDigits: 2 }) }}
              </td>
              <td>{{ row.date }}</td>
              <td>
                <button class="bg-gray-200 rounded px-2 py-1 text-xs">...</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="text-xs text-gray-500 mt-2">Showing data 1 to 8 of 20 entries</div>
      </div>
      <!-- Purchased Report Table -->
      <div class="bg-white rounded-lg shadow p-4">
        <div class="flex justify-between items-center mb-2">
          <div class="font-semibold">Purchased Report</div>
          <div
            class="bg-green-100 text-green-700 px-2 py-1 rounded text-xs flex items-center gap-1"
          >
            Feb <span class="ml-1">🗓️</span>
          </div>
        </div>
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-gray-500 border-b">
              <th class="py-1">Item ID</th>
              <th>Item Name</th>
              <th>Quantity</th>
              <th>Date</th>
              <th>Total Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in purchasedReport" :key="row.id" class="border-b">
              <td class="py-1">{{ row.id }}</td>
              <td>{{ row.name }}</td>
              <td class="font-bold">{{ row.qty }}</td>
              <td>{{ row.date }}</td>
              <td class="font-bold text-black">
                ₱{{ row.total.toLocaleString(undefined, { minimumFractionDigits: 2 }) }}
              </td>
            </tr>
          </tbody>
        </table>
        <div class="text-xs text-gray-500 mt-2">Showing data 1 to 8 of 20 entries</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add any custom styles here if needed */
</style>
