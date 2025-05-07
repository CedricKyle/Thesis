<script setup>
import { ref } from 'vue'
import { Lock, IdCard } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/Authentication/authStore'
import { useRouter } from 'vue-router'
import { useRolesStore } from '@/stores/Users & Role/roleStore'
import axios from 'axios'
import { getFirstAccessibleRoute } from '@/composables/Admin Composables/User & Role/role/usePermissions'

const router = useRouter()
const authStore = useAuthStore()
const rolesStore = useRolesStore()

// Form data
const userId = ref('')
const password = ref('')
const rememberMe = ref(false)
const error = ref('')
const isLoading = ref(false)
const showLoader = ref(false)
const loading = ref(false)

// Add this helper function at the top of the script
function getDepartmentPath(department) {
  if (!department) return ''

  const deptMap = {
    'Super Admin': 'admin',
    'Human Resource': 'hr',
    Finance: 'finance',
    Sales: 'sales',
    'Supply Chain Management': 'scm',
    'Customer Relationship Management': 'crm',
  }

  return deptMap[department] || department.toLowerCase().split(' ')[0]
}

function getDepartmentDefaultRoute(department) {
  if (!department) return '/login'

  const deptRouteMap = {
    'Super Admin': '/admin/hr/dashboard',
    'Admin Department': '/admin/hr/dashboard',
    'Human Resource': '/hr/dashboard',
    'HR Department': '/hr/dashboard',
    Finance: '/finance/dashboard',
    'Finance Department': '/finance/dashboard',
    Sales: '/sales/dashboard',
    'Sales Department': '/sales/dashboard',
    'Supply Chain Management': '/scm/dashboard',
    'Customer Relationship Management': '/crm/dashboard',
    'Branch Operation': '/branch-operation/dashboard',
  }

  return deptRouteMap[department] || `/${department.toLowerCase().replace(/\s+/g, '-')}/dashboard`
}

const handleSubmit = async (e) => {
  e.preventDefault()
  error.value = ''
  isLoading.value = true
  showLoader.value = true
  loading.value = true

  try {
    console.log('Login attempt:', {
      employeeId: userId.value,
      isDefaultPassword: password.value === 'countryside123',
    })

    const response = await axios.post('/api/employees/login', {
      employeeId: userId.value,
      password: password.value,
    })

    console.log('Login response:', {
      status: response.status,
      message: response.data.message,
      hasUser: !!response.data.user,
    })

    if (response.data.message === 'Login successful' && response.data.user) {
      // Update auth store
      authStore.currentUser = response.data.user
      authStore.isAuthenticated = true

      // Parse permissions if needed
      if (response.data.user.permissions) {
        authStore.userPermissions = Array.isArray(response.data.user.permissions)
          ? response.data.user.permissions
          : JSON.parse(response.data.user.permissions)
      }

      // ADD THIS LINE:
      console.log('Current User:', authStore.currentUser)

      // Determine redirect path
      const department = response.data.user.department
      const role = response.data.user.role
      console.log('User info:', { department, role })

      const redirectPath = getFirstAccessibleRoute(department, authStore.userPermissions)

      console.log('Redirecting to:', redirectPath)

      // Show loading states
      setTimeout(() => {
        loading.value = false
        setTimeout(() => {
          showLoader.value = false
          window.location.href = redirectPath
        }, 1000)
      }, 2000)
    } else {
      error.value = response.data.message || 'Invalid credentials'
      setTimeout(() => {
        loading.value = false
        setTimeout(() => {
          showLoader.value = false
        }, 1000)
      }, 1500)
    }
  } catch (err) {
    console.error('Login error details:', {
      message: err.message,
      response: err.response?.data,
      code: err.response?.data?.code,
    })

    // Handle specific error codes
    switch (err.response?.data?.code) {
      case 'EMPLOYEE_NOT_FOUND':
        error.value = 'Employee ID not found'
        break
      case 'ROLE_NOT_FOUND':
        error.value = 'Employee role configuration error'
        break
      case 'USE_DEFAULT_PASSWORD':
        error.value = 'Please use the default password: countryside123'
        break
      case 'INVALID_PASSWORD':
        error.value = 'Invalid password. For first time login, use: countryside123'
        break
      case 'PASSWORD_VERIFICATION_ERROR':
        error.value = 'Error verifying password. Please try again.'
        break
      default:
        error.value = err.response?.data?.message || 'An error occurred during login'
    }

    setTimeout(() => {
      loading.value = false
      setTimeout(() => {
        showLoader.value = false
      }, 1000)
    }, 1500)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex w-full justify-center items-center h-screen bg-auth">
    <!-- Loader screen after login -->
    <div
      v-if="showLoader"
      class="fixed inset-0 bg-primaryColor flex flex-col items-center justify-center z-50"
    >
      <div v-if="loading" class="flex flex-col items-center gap-3">
        <span class="loading loading-spinner loading-lg text-white"></span>
        <p class="text-white text-sm">Logging in...</p>
      </div>
      <div v-else class="flex flex-col items-center gap-2">
        <img src="/countryside-logo.png" alt="Logo" class="w-32" />
        <p class="text-white text-lg">Welcome to Countryside</p>
      </div>
    </div>

    <!-- Login Form -->
    <div class="flex justify-center items-center w-full max-w-md bg-white shadow-md h-96">
      <img class="h-full" src="../assets/Images/Landing-Page.jpg" alt="" />
    </div>
    <div class="w-full max-w-md p-5 bg-primaryColor shadow-md h-96">
      <div class="form-container flex flex-col items-center w-full h-full">
        <div class="logo flex flex-col items-center">
          <img class="h-15 w-15" src="/public/countryside-logo.png" alt="this is logo img" />
          <h1 class="text-2xl font-bold text-secondaryColor">Welcome back,</h1>
        </div>

        <div class="input-container card items-center w-96 p-5">
          <form @submit="handleSubmit" class="w-80 mx-auto">
            <!-- Error message -->
            <div v-if="error" class="text-red-500 text-sm mb-3 text-center">
              {{ error }}
            </div>

            <div class="flex flex-col items-center w-full gap-3">
              <!-- User ID Input -->
              <div class="relative w-full">
                <label class="input bg-white">
                  <IdCard class="text-gray-500 w-5 h-5" />
                  <input
                    v-model="userId"
                    type="text"
                    placeholder="Employee ID"
                    class="placeholder:text-gray-500 text-black w-full"
                    required
                    :disabled="isLoading"
                  />
                </label>
              </div>
              <!-- Password Input -->
              <div class="relative w-full">
                <label class="input bg-white">
                  <Lock class="text-gray-500 w-4 h-4" />
                  <input
                    v-model="password"
                    type="password"
                    placeholder="Password"
                    class="placeholder:text-gray-500 text-black w-full"
                    required
                    :disabled="isLoading"
                  />
                </label>
              </div>
              <!-- Submit Button -->
              <button type="submit" class="btn-loginStyle w-full h-10" :disabled="isLoading">
                {{ isLoading ? 'Logging in...' : 'Login' }}
              </button>
            </div>

            <div class="flex justify-between text-xs mt-2">
              <div class="flex items-center gap-1">
                <input
                  v-model="rememberMe"
                  type="checkbox"
                  class="checkbox checkbox-white checkbox-xs"
                  :disabled="isLoading"
                />
                <p>Remember Me</p>
              </div>
              <div class="">
                <p class="hover:text-secondaryColor cursor-pointer transition-all">
                  Forgot Password?
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add any additional styles you need */

/* Add smooth transitions */
.fixed {
  transition: opacity 0.3s ease-in-out;
}
</style>
