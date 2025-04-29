<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
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
  return payrollRecords.value.map(record => record.date)
})

// Prepare chart data for Base Salary, Overtime, Deductions, and Net Pay
const chartData = computed(() => {
  return {
    labels: chartLabels.value,
    datasets: [
      {
        label: 'Base Salary (₱)',
        data: payrollRecords.value.map(record => record.baseSalary),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'Overtime (₱)',
        data: payrollRecords.value.map(record => record.overtime),
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 1,
      },
      {
        label: 'Deductions (₱)',
        data: payrollRecords.value.map(record => record.deductions),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
      {
        label: 'Net Pay (₱)',
        data: payrollRecords.value.map(record => record.netPay),
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
  <div class="p-1">
    <h1 class="text-2xl font-bold text-brownColor mb-4">Payroll Dashboard</h1>

      <!-- Dashboard Boxes (Total Employees, Time-In, Time-Out) -->
    <div class="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-7 mb-5">
      <!-- Total Employees Box -->
      <div class="bg-white p-6 rounded-lg shadow-md flex flex-col items-start justify-between">
        <h2 class="text-lg font-semibold mb-2 text-left">Total Employees</h2>
        <p class="text-3xl font-bold text-primaryColor">150</p>
        <p class="text-sm text-gray-500 mt-2">April 2025</p> <!-- Date Below the Number -->
      </div>

      <!-- Time-In Employees Box -->
      <div class="bg-white p-6 rounded-lg shadow-md flex flex-col items-start justify-between">
        <h2 class="text-lg font-semibold mb-2 text-left">Time-In Employees</h2>
        <p class="text-3xl font-bold text-green-600">130</p>
        <p class="text-sm text-gray-500 mt-2">April 2025</p> <!-- Date Below the Number -->
      </div>

      <!-- Time-Out Employees Box -->
      <div class="bg-white p-6 rounded-lg shadow-md flex flex-col items-start justify-between">
        <h2 class="text-lg font-semibold mb-2 text-left">Time-Out Employees</h2>
        <p class="text-3xl font-bold text-red-600">120</p>
        <p class="text-sm text-gray-500 mt-2">April 2025</p> <!-- Date Below the Number -->
      </div>
    </div>

   
    <!-- Main Dashboard Layout (Two sections side by side) -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      <!-- Left Column: Payroll Chart -->
      <div class="bg-white pt-2 pr-2 pl-2 pb-0 rounded-lg shadow-md ">
        <!-- Bar Chart component with full width and height -->
        <div class="w-full h-96"> <!-- Adjust height to a larger value -->
  <Bar :data="chartData" :options="chartOptions" />
</div>

      </div>

      <!-- Right Column: Transaction History -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold text-left mb-4">Transaction History</h2>
        <div class="overflow-y-auto max-h-80"> <!-- Adjusted max height -->
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
  </div>
</template>

