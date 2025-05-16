<script setup>
import PasswordChange from '@/components/Employee Profile/PasswordChange.vue'
import { useRouter } from 'vue-router'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'
import { computed } from 'vue'
import { ArrowLeft } from 'lucide-vue-next'

const router = useRouter()
const employeeStore = useEmployeeStore()
const employee = computed(() => employeeStore.currentUserEmployee)

// Go back to the appropriate dashboard based on user's department
const goBack = () => {
  // Get the user's department
  const userDepartment = employee.value?.department
  
  if (userDepartment) {
    // Handle special cases for some departments
    if (userDepartment === 'HR Department') {
      router.push('/hr/dashboard')
    } else if (userDepartment === 'Finance Department') {
      router.push('/finance/dashboard')
    } else if (userDepartment === 'Supply Chain Management') {
      router.push('/scm/dashboard')
    } else if (userDepartment === 'Customer Relationship Management') {
      router.push('/crm/dashboard')
    } else if (userDepartment === 'Sales Department') {
      router.push('/sales/dashboard')
    } else if (userDepartment === 'Production Department') {
      router.push('/production/dashboard')
    } else if (userDepartment === 'Admin Department') {
      router.push('/admin/dashboard')
    } else {
      // Default to a common dashboard or home page
      router.push('/')
    }
  } else {
    // If department is not available, go to home
    router.push('/')
  }
}
</script>

<template>
  <div class="bg-bgColor min-h-screen">
    <div class="container mx-auto py-6 px-4">
      <!-- Header with Back Button -->
      <div class="flex items-center mb-6">
        <button 
          @click="goBack" 
          class="mr-4 flex items-center gap-1 text-gray-600 hover:text-primaryColor transition-colors"
        >
          <ArrowLeft class="w-5 h-5" />
          <span class="text-sm">Back to Dashboard</span>
        </button>
        <h2 class="text-2xl font-bold">Account Settings</h2>
      </div>
      
      <div class="grid md:grid-cols-3 gap-6">
        <!-- Sidebar -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="font-semibold mb-4 text-lg text-primaryColor border-b pb-2">Settings</h3>
          <div class="flex flex-col space-y-2">
            <a href="#password" class="py-2 px-3 bg-primaryColor bg-opacity-10 rounded-md text-primaryColor font-medium">
              Password
            </a>
            <!-- Can add more settings sections here in the future -->
          </div>
        </div>
        
        <!-- Main Content -->
        <div class="md:col-span-2">
          <!-- Password Section -->
          <div id="password" class="mb-6">
            <PasswordChange />
          </div>
        </div>
      </div>
    </div>
  </div>
</template> 