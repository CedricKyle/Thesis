<script setup>
import { ref } from 'vue'
import { BarChart2, TrendingUp, TrendingDown, DollarSign, Layers } from 'lucide-vue-next'

// Dummy data for demonstration
const summary = ref([
  {
    label: 'Total Assets',
    value: 1200000,
    icon: Layers,
    color: 'bg-blue-100',
    text: 'text-blue-700',
  },
  {
    label: 'Total Liabilities',
    value: 500000,
    icon: TrendingDown,
    color: 'bg-red-100',
    text: 'text-red-700',
  },
  {
    label: 'Total Equity',
    value: 700000,
    icon: TrendingUp,
    color: 'bg-green-100',
    text: 'text-green-700',
  },
  {
    label: 'Net Income',
    value: 120000,
    icon: DollarSign,
    color: 'bg-yellow-100',
    text: 'text-yellow-700',
  },
])

const incomeStatement = ref([
  { label: 'Revenue', value: 800000 },
  { label: 'Cost of Goods Sold', value: 300000 },
  { label: 'Gross Profit', value: 500000 },
  { label: 'Operating Expenses', value: 350000 },
  { label: 'Net Income', value: 120000 },
])

const balanceSheet = ref([
  { label: 'Assets', value: 1200000 },
  { label: 'Liabilities', value: 500000 },
  { label: 'Equity', value: 700000 },
])
</script>

<template>
  <div class="w-full bg-white shadow-md rounded-md p-6">
    <!-- Summary Cards -->
    <div class="grid grid-cols-4 gap-4 mb-8">
      <div
        v-for="card in summary"
        :key="card.label"
        class="flex flex-col justify-between p-4 rounded-lg shadow border"
        :class="card.color"
      >
        <div class="flex items-center justify-between">
          <span class="font-semibold text-gray-600">{{ card.label }}</span>
          <component :is="card.icon" class="w-6 h-6" :class="card.text" />
        </div>
        <div class="mt-4 text-3xl font-bold" :class="card.text">
          ₱{{ card.value.toLocaleString('en-PH') }}
        </div>
      </div>
    </div>

    <!-- Income Statement Table -->
    <div class="mb-8">
      <h3 class="text-lg font-semibold mb-2 text-primaryColor">Income Statement</h3>
      <table class="table w-full text-sm rounded-md border">
        <thead class="text-xs text-black">
          <tr class="bg-gray-100">
            <th class="text-left">Account</th>
            <th class="text-right">Amount (₱)</th>
          </tr>
        </thead>
        <tbody class="text-xs text-black">
          <tr v-for="row in incomeStatement" :key="row.label">
            <td>{{ row.label }}</td>
            <td class="text-right">{{ row.value.toLocaleString('en-PH') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Balance Sheet Table -->
    <div class="mb-8">
      <h3 class="text-lg font-semibold mb-2 text-primaryColor">Balance Sheet</h3>
      <table class="table w-full text-sm rounded-md border">
        <thead class="text-xs text-black">
          <tr class="bg-gray-100">
            <th class="text-left">Account</th>
            <th class="text-right">Amount (₱)</th>
          </tr>
        </thead>
        <tbody class="text-xs text-black">
          <tr v-for="row in balanceSheet" :key="row.label">
            <td>{{ row.label }}</td>
            <td class="text-right">{{ row.value.toLocaleString('en-PH') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Chart Placeholder -->
    <div class="bg-gray-50 rounded-md p-6 flex flex-col items-center justify-center min-h-[200px]">
      <BarChart2 class="w-12 h-12 text-gray-400 mb-2" />
      <span class="text-gray-400">Charts coming soon...</span>
    </div>
  </div>
</template>
