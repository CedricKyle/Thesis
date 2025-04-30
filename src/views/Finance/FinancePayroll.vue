<script setup>
import { ref, computed } from 'vue'
import axios from 'axios'
import { useAuthStore } from '@/stores/Authentication/authStore'

// State management
const isProcessing = ref(false)

// Assume we already have this data from backend or store
const employees = ref([
  {
    employee_id: 1,
    full_name: 'John Doe',
    job_title: 'HR Manager',
    signIn: null,
    signOut: null,
    status: 'Active',
    netPay: '$5000',
  },
  // More employees data...
])

// Handle Time In
const handleTimeIn = async () => {
  if (!authStore.currentUser?.id) {
    showToast('User information not found', 'error')
    return
  }
  isProcessing.value = true
  try {
    await axios.post(`/api/attendance/timein/${authStore.currentUser.id}`)
    showToast('Time In recorded successfully')
    await updatePayroll() // After recording Time In, update the payroll
  } catch (error) {
    showToast(error.message || 'Failed to record Time In', 'error')
  } finally {
    isProcessing.value = false
  }
}

// Handle Time Out
const handleTimeOut = async () => {
  if (!authStore.currentUser?.id) {
    showToast('User information not found', 'error')
    return
  }
  isProcessing.value = true
  try {
    await axios.post(`/api/attendance/timeout/${authStore.currentUser.id}`)
    showToast('Time Out recorded successfully')
    await updatePayroll() // After recording Time Out, update the payroll
  } catch (error) {
    showToast(error.message || 'Failed to record Time Out', 'error')
  } finally {
    isProcessing.value = false
  }
}

// Update Payroll Display with Latest Data
const updatePayroll = async () => {
  try {
    const response = await axios.get('/api/employees') // Fetch updated payroll data
    employees.value = response.data
  } catch (error) {
    console.error('Error fetching payroll data:', error)
  }
}

// Filter employees and exclude 'Admin'
const filteredEmployees = computed(() => {
  return employees.value.filter((employee) => employee.job_title !== 'Admin')
})
</script>

<template>
  <div class="p-4 text-black">
    <h1 class="text-4xl font-bold text-gray-800 mb-4">Payroll</h1>

    <!-- Table to Display Payroll -->
    <div class="overflow-x-auto mt-4">
      <table class="table table-zebra w-full">
        <thead class="text-black">
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Time In</th>
            <th>Time Out</th>
            <th>Status</th>
            <th>Net Pay</th>
          </tr>
        </thead>
        <tbody>
          <!-- Display Payroll Data -->
          <tr v-for="(employee, index) in filteredEmployees" :key="employee.employee_id">
            <td>{{ employee.full_name }}</td>
            <td>{{ employee.job_title }}</td>
            <td>{{ employee.signIn || 'Not Checked In' }}</td>
            <td>{{ employee.signOut || 'Not Checked Out' }}</td>
            <td>{{ employee.status }}</td>
            <td>{{ employee.netPay }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
/* Add necessary styles */
</style>
