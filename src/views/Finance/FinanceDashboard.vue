<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { Bar } from 'vue-chartjs'
import ProfitImage from '@/assets/Images/profit (1).png'
import BalanceImage from '@/assets/Images/balance.png'
import ExpensesImage from '@/assets/Images/expenses.png'
import BudgetImage from '@/assets/Images/money-bag.png'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'

// Register necessary Chart.js components
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

// Dummy Data for Base Salary, Overtime, Deductions, and Net Pay
const payrollRecords = ref([
  { date: '2025-04-01', baseSalary: 3000, overtime: 300, deductions: 100, netPay: 3700 },
  { date: '2025-04-02', baseSalary: 3500, overtime: 400, deductions: 150, netPay: 4450 },
  { date: '2025-04-03', baseSalary: 3200, overtime: 350, deductions: 120, netPay: 3830 },
  { date: '2025-04-04', baseSalary: 4000, overtime: 500, deductions: 200, netPay: 5200 },
  { date: '2025-04-05', baseSalary: 2800, overtime: 200, deductions: 90, netPay: 2910 },
])

// Compute chart labels (dates)
const chartLabels = computed(() => {
  return payrollRecords.value.map((record) => record.date)
})

// Prepare chart data for Base Salary, Overtime, Deductions, and Net Pay
const chartData = computed(() => {
  return {
    labels: chartLabels.value,
    datasets: [
      {
        label: 'Base Salary (₱)',
        data: payrollRecords.value.map((record) => record.baseSalary),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'Overtime (₱)',
        data: payrollRecords.value.map((record) => record.overtime),
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 1,
      },
      {
        label: 'Deductions (₱)',
        data: payrollRecords.value.map((record) => record.deductions),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
      {
        label: 'Net Pay (₱)',
        data: payrollRecords.value.map((record) => record.netPay),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  }
})

// Chart options (Customize as needed)
const chartOptions = {
  responsive: true,
  plugins: {
    title: {
      display: true,
      text: 'Chart of Payroll', // Title for the chart
    },
  },
  scales: {
    x: {
      beginAtZero: true,
    },
    y: {
      beginAtZero: true,
    },
  },
}

// Dummy employee names for transaction history (Replace with actual data)
const transactions = ref([
  { name: 'John Doe', date: '2025-04-01', amount: 3700 },
  { name: 'Jane Smith', date: '2025-04-02', amount: 4450 },
  { name: 'Robert Brown', date: '2025-04-03', amount: 3830 },
  { name: 'Emily Davis', date: '2025-04-04', amount: 5200 },
  { name: 'Michael White', date: '2025-04-05', amount: 2910 },
])
</script>

<template>
  <div class="grid grid-cols-4 grid-rows-[auto_auto_auto_auto] gap-4 text-black">
    <!--Stats Grid-->
    <div class="col-span-3 flex gap-4 justify-between">
      <div>
        <div class="card bg-white w-64 shadow-md">
          <div class="card-body">
            <div class="card-header flex flex-row gap-2 justify-between">
              <div><h1 class="text-xl font-bold text-gray-600">Balance</h1></div>
              <!-- Replaced Present with Balance -->
              <div><EllipsisVertical class="w-4 h-4" /></div>
            </div>
            <div class="card-content mt-4 flex flex-row gap-2 justify-between">
              <div>
                <h1 class="text-primaryColor text-4xl font-bold">4</h1>
                <!-- Number 4 for Balance -->
              </div>
              <div class="w-11">
                <img :src="ExpensesImage" />
              </div>
            </div>
            <div
              class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
            ></div>
            <div class="text-sm text-gray-500 mt-2">April 2025</div>
          </div>
        </div>
      </div>
      <div>
        <div class="card bg-white w-64 shadow-md">
          <div class="card-body">
            <div class="card-header flex flex-row gap-2 justify-between">
              <div><h1 class="text-xl font-bold text-gray-600">Expenses</h1></div>
              <!-- Replaced Absent with Expenses -->
              <div><EllipsisVertical class="w-4 h-4" /></div>
            </div>
            <div class="card-content mt-4 flex flex-row gap-2 justify-between">
              <div>
                <h1 class="text-primaryColor text-4xl font-bold">4</h1>
                <!-- Number 4 for Expenses -->
              </div>
              <div class="w-11">
                <img :src="BalanceImage" />
              </div>
            </div>
            <div
              class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
            ></div>
            <div class="text-sm text-gray-500 mt-2">April 2025</div>
          </div>
        </div>
      </div>
      <div>
        <div class="card bg-white w-64 shadow-md">
          <div class="card-body">
            <div class="card-header flex flex-row gap-2 justify-between">
              <div><h1 class="text-xl font-bold text-gray-600">Budget</h1></div>
              <!-- Replaced Late with Budget -->
              <div><EllipsisVertical class="w-4 h-4" /></div>
            </div>
            <div class="card-content mt-4 flex flex-row gap-2 justify-between">
              <div>
                <h1 class="text-primaryColor text-4xl font-bold">4</h1>
                <!-- Number 4 for Budget -->
              </div>
              <div class="w-11">
                <img :src="BudgetImage" />
              </div>
            </div>
            <div
              class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
            ></div>
            <div class="text-sm text-gray-500 mt-2">April 2025</div>
          </div>
        </div>
      </div>
      <div>
        <div class="card bg-white w-64 shadow-md">
          <div class="card-body">
            <div class="card-header flex flex-row gap-2 justify-between">
              <div><h1 class="text-xl font-bold text-gray-600">Income</h1></div>
              <!-- Replaced Late with Income -->
              <div><EllipsisVertical class="w-4 h-4" /></div>
            </div>
            <div class="card-content mt-4 flex flex-row gap-2 justify-between">
              <div>
                <h1 class="text-primaryColor text-4xl font-bold">4</h1>
                <!-- Number 4 for Income -->
              </div>
              <div class="w-11">
                <img :src="ProfitImage" />
              </div>
            </div>
            <div
              class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
            ></div>
            <div class="text-sm text-gray-500 mt-2">April 2025</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Main Dashboard Layout (Two sections side by side) -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
    <!-- Left Column: Payroll Chart -->
    <div class="bg-white border border-gray-300 rounded-lg shadow-md p-2 flex flex-col">
      <!-- Chart Container -->
      <div class="flex-1 w-full">
        <Bar :data="chartData" :options="chartOptions" class="w-full h-full" />
      </div>
    </div>

    <!-- Right Column: Transaction History -->
    <div class="bg-white border-gray-300 p-6 border-1 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold text-left mb-4">Transaction History</h2>
      <div class="overflow-y-auto max-h-80">
        <!-- Adjusted max height -->
        <div v-for="(transaction, index) in transactions" :key="index" class="border-b py-2">
          <div class="flex justify-between">
            <div>{{ transaction.name }}</div>
            <div class="font-bold">{{ transaction.amount | currency }}</div>
          </div>
          <div class="text-sm text-gray-500">{{ transaction.date }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
