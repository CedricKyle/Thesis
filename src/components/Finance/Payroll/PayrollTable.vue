<template>
    <div class="overflow-x-auto mt-4">
      <table class="table table-zebra w-full">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Time In</th>
            <th>Time Out</th>
            <th>Status</th>
            <th>Net Pay</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <!-- Iterate through the filtered employee data and display it -->
          <tr v-for="(employee, index) in filteredEmployees" :key="employee.employee_id">
            <td>{{ employee.full_name }}</td>
            <td>{{ employee.job_title }}</td>
            <td>{{ employee.time_in || 'Not Checked In' }}</td>
            <td>{{ employee.time_out || 'Not Checked Out' }}</td>
            <td>{{ employee.status }}</td>
            <td>{{ employee.netPay }}</td>
            <td>
              <!-- Action buttons (e.g., Edit, Delete) -->
              <button @click="editPayroll(index)" class="btn btn-sm btn-primary">Edit</button>
              
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue'
  import axios from 'axios'
  
  const employees = ref([])  // This will hold the employee data
  
  // Fetch employee data from the backend
  onMounted(async () => {
    try {
      const response = await axios.get('/api/employees')  // Make sure to use your actual API endpoint
      employees.value = response.data  // Set the employee data
    } catch (error) {
      console.error('Error fetching employee data:', error)
    }
  })
  
  // Filter out employees who have the 'Admin' role using a computed property
  const filteredEmployees = computed(() => {
    return employees.value.filter(employee => employee.job_title !== 'Admin')
  })
  
  // Function to handle editing payroll information
  const editPayroll = (index) => {
    console.log('Editing payroll for:', employees.value[index])
    // Logic to open a form or modal for editing
  }
  

  </script>
  
