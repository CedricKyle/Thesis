<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'

// Register necessary Chart.js components
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

// States to hold data for total employees, time-in and time-out employees
const totalEmployees = ref(0)
const timeInEmployees = ref(0)
const timeOutEmployees = ref(0)

// Fetch employee data from the backend API (Assumed endpoint)
onMounted(async () => {
  try {
    const response = await axios.get('/api/employees')  // Fetch employee data
    totalEmployees.value = response.data.length

    // Calculate time-in and time-out employees
    timeInEmployees.value = response.data.filter(emp => emp.time_in).length
    timeOutEmployees.value = response.data.filter(emp => emp.time_out).length
  } catch (error) {
    console.error('Error fetching employee data:', error)
  }
})

// Chart Data (Dummy Data, you can replace this with actual API data)
const attendanceRecords = ref([
  { date: '2025-04-01', timeIn: 10, timeOut: 8 },
  { date: '2025-04-02', timeIn: 12, timeOut: 10 },
  { date: '2025-04-03', timeIn: 15, timeOut: 14 },
  { date: '2025-04-04', timeIn: 16, timeOut: 15 },
  { date: '2025-04-05', timeIn: 9, timeOut: 8 },
])

// Compute chart data
const chartLabels = computed(() => {
  return attendanceRecords.value.map(record => record.date)
})

const chartData = computed(() => {
  return {
    labels: chartLabels.value,
    datasets: [
      {
        label: 'Time In',
        data: attendanceRecords.value.map(record => record.timeIn),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: 'Time Out',
        data: attendanceRecords.value.map(record => record.timeOut),
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  }
})

// Chart options
const chartOptions = {
  responsive: true,
  scales: {
    x: {
      beginAtZero: true,
    },
    y: {
      beginAtZero: true,
    },
  },
}
</script>

<template>
  <div class="p-2">
    <h1 class="text-2xl font-bold text-brownColor mb-4">Dashboard</h1>
    
    <!-- Dashboard Boxes -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
      <!-- Total Employees Box -->
      <div class="bg-white p-4 rounded-lg shadow-md text-center">
        <h2 class="text-lg font-semibold">Total Employees</h2>
        <p class="text-xl font-bold text-primaryColor">{{ totalEmployees }}</p>
      </div>

      <!-- Time-In Employees Box -->
      <div class="bg-white p-4 rounded-lg shadow-md text-center">
        <h2 class="text-lg font-semibold">Time-In Employees</h2>
        <p class="text-xl font-bold text-green-600">{{ timeInEmployees }}</p>
      </div>

      <!-- Time-Out Employees Box -->
      <div class="bg-white p-4 rounded-lg shadow-md text-center">
        <h2 class="text-lg font-semibold">Time-Out Employees</h2>
        <p class="text-xl font-bold text-red-600">{{ timeOutEmployees }}</p>
      </div>
    </div>

    <!-- Bar Chart Below -->
    <div class="p-4 bg-white rounded-lg shadow-md">
      <h2 class="text-xl font-semibold text-center mb-0.5">Time In and Time Out Chart</h2>
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<style>
/* Optional: Global or custom styles can be added here */
.bg-white {
  background-color: #ffffff;
}

.text-primaryColor {
  color: #2b6cb0;
}

.text-brownColor {
  color: #6b4f4f;
}

.text-green-600 {
  color: #38a169;
}

.text-red-600 {
  color: #e53e3e;
}
</style>
