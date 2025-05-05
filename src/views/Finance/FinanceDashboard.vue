<script setup>
import { ref, computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'
import { EllipsisVertical } from 'lucide-vue-next'
import ProfitImage from '@/assets/Images/profit (1).png'
import BalanceImage from '@/assets/Images/balance.png'
import ExpensesImage from '@/assets/Images/expenses.png'
import BudgetImage from '@/assets/Images/money-bag.png'

// Register Chart.js components
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

// Stats card data
const stats = [
  { title: 'Balance', amount: '₱4,320', date: 'April 2025', img: BalanceImage },
  { title: 'Expenses', amount: '₱3,320', date: 'April 2025', img: ExpensesImage },
  { title: 'Budget', amount: '₱1,370', date: 'April 2025', img: BudgetImage },
  { title: 'Income', amount: '₱300', date: 'April 2025', img: ProfitImage },
]

// Dummy payroll records for the chart
const payrollRecords = ref([
  { date: '2025-04-01', baseSalary: 3000, overtime: 300, deductions: 100, netPay: 3700 },
  { date: '2025-04-02', baseSalary: 3500, overtime: 400, deductions: 150, netPay: 4450 },
  { date: '2025-04-03', baseSalary: 3200, overtime: 350, deductions: 120, netPay: 3830 },
  { date: '2025-04-04', baseSalary: 4000, overtime: 500, deductions: 200, netPay: 5200 },
  { date: '2025-04-05', baseSalary: 2800, overtime: 200, deductions: 90, netPay: 2910 },
])

// Chart.js data
const chartData = computed(() => ({
  labels: payrollRecords.value.map((r) => r.date),
  datasets: [
    {
      label: 'Base Salary',
      data: payrollRecords.value.map((r) => r.baseSalary),
      backgroundColor: 'rgba(54,162,235,0.5)',
    },
    {
      label: 'Overtime',
      data: payrollRecords.value.map((r) => r.overtime),
      backgroundColor: 'rgba(255,159,64,0.5)',
    },
    {
      label: 'Deductions',
      data: payrollRecords.value.map((r) => r.deductions),
      backgroundColor: 'rgba(255,99,132,0.5)',
    },
    {
      label: 'Net Pay',
      data: payrollRecords.value.map((r) => r.netPay),
      backgroundColor: 'rgba(75,192,192,0.5)',
    },
  ],
}))

const chartOptions = {
  responsive: true,
  plugins: { title: { display: true, text: 'Payroll Overview' } },
  scales: { y: { beginAtZero: true } },
}

// Dummy supply history data
const supplyHistory = ref([
  { date: '2025-04-01', item: 'Pork', quantity: 50, unitPrice: 180.0 },
  { date: '2025-04-02', item: 'Chicken', quantity: 30, unitPrice: 120.5 },
  { date: '2025-04-03', item: 'Oil', quantity: 20, unitPrice: 150.75 },
  { date: '2025-04-04', item: 'Rice', quantity: 100, unitPrice: 45.0 },
  { date: '2025-04-05', item: 'Eggs', quantity: 200, unitPrice: 6.25 },
])
</script>
<template>
  <div class="space-y-8 p-4">
    <!-- Row 1: Stats Cards -->
    <div class="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="card in stats"
        :key="card.title"
        class="bg-white rounded-lg shadow p-4 flex flex-col justify-between"
      >
        <div class="flex justify-between items-center">
          <h3 class="text-gray-600 font-semibold">{{ card.title }}</h3>
          <EllipsisVertical class="w-4 h-4 text-gray-400" />
        </div>
        <div class="flex items-center mt-4">
          <h1 class="text-primaryColor text-4xl font-bold">{{ card.amount }}</h1>
          <img :src="card.img" class="w-12 h-12 ml-auto" />
        </div>
        <div class="text-xs text-gray-500 mt-2">{{ card.date }}</div>
      </div>
    </div>

    <!-- Row 2: Chart + Supply History -->
    <div class="grid gap-4 lg:grid-cols-2">
      <!-- Chart Panel -->
      <div class="bg-white rounded-lg shadow p-4">
        <h2 class="text-lg font-semibold mb-2">Payroll Chart</h2>
        <div class="h-65">
          <Bar :data="chartData" :options="chartOptions" />
        </div>
      </div>

      <!-- Supply History Panel -->
      <div class="bg-white rounded-lg shadow p-4 w-full">
        <h2 class="text-lg font-semibold mb-2 text-black">Supply History</h2>
        <div class="overflow-x-auto">
          <table class="table w-full text-xs rounded-md">
            <thead class="text-black">
              <tr class="bg-gray-100">
                <th>Date</th>
                <th>Item</th>
                <th class="text-right">Quantity</th>
                <th class="text-right">Unit Price (₱)</th>
                <th class="text-right">Total Price (₱)</th>
              </tr>
            </thead>
            <tbody class="text-black">
              <tr v-for="(s, i) in supplyHistory" :key="i">
                <td>{{ s.date }}</td>
                <td>{{ s.item }}</td>
                <td class="text-right">{{ s.quantity }}</td>
                <td class="text-right">
                  {{ s.unitPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
                </td>
                <td class="text-right">
                  {{
                    (s.quantity * s.unitPrice).toLocaleString('en-PH', { minimumFractionDigits: 2 })
                  }}
                </td>
              </tr>
              <tr v-if="supplyHistory.length === 0">
                <td colspan="5" class="text-center py-4 text-gray-500">No supply records found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Optional: tweak scrollbar for supply history panel */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}
</style>
