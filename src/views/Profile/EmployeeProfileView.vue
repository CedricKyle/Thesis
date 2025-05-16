<script setup>
import EmployeeProfile from '@/components/Employee Profile/EmployeeProfile.vue'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'
import { onMounted } from 'vue'

const employeeStore = useEmployeeStore()

onMounted(async () => {
  // Load employees data if not already loaded
  if (employeeStore.employees.length === 0) {
    await employeeStore.loadEmployees()
  }
})
</script>

<template>
  <div class="bg-bgColor min-h-screen">
    <div class="container mx-auto py-6">
      <EmployeeProfile />
    </div>
  </div>
</template> 