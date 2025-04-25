import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useRolesStore } from '@/stores/Users & Role/roleStore'
import axios from '@/plugins/axios'
import {
  DEPARTMENTS,
  PERMISSION_IDS,
} from '@/composables/Admin Composables/User & Role/role/permissionsId'
import { useRouter } from 'vue-router'

// Add this helper function at the top of the file, after the imports
function getDepartmentPath(department) {
  if (!department) return ''

  const deptMap = {
    'Admin Department': 'admin',
    'HR Department': 'hr',
    'Finance Department': 'finance',
    'Sales Department': 'sales',
    'Supply Chain Department': 'scm',
    'Customer Service Department': 'crm',
  }

  return deptMap[department] || department.toLowerCase().split(' ')[0]
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    currentUser: null,
    isAuthenticated: false,
    error: null,
    isLoading: false,
    userPermissions: [], // This will store the actual permissions from the backend
  }),

  actions: {
    async login(employeeId, password) {
      this.error = null
      this.isLoading = true

      try {
        const response = await axios.post('/api/employees/login', {
          employeeId,
          password,
        })

        if (response.data.message === 'Login successful' && response.data.user) {
          // Store user data
          this.currentUser = response.data.user
          this.isAuthenticated = true

          // Handle permissions
          try {
            const rawPermissions = response.data.user.permissions
            this.userPermissions = Array.isArray(rawPermissions)
              ? rawPermissions
              : JSON.parse(rawPermissions)

            console.log('Processed permissions:', this.userPermissions)
          } catch (error) {
            console.error('Error processing permissions:', error)
            this.error = 'Error processing user permissions'
            return false
          }

          // Navigate based on department
          const departmentPath = getDepartmentPath(response.data.user.department)
          if (departmentPath) {
            const router = useRouter()
            router.push(`/${departmentPath}/dashboard`)
          }

          return true
        }

        this.error = response.data.message || 'Invalid credentials'
        return false
      } catch (error) {
        console.error('Login error:', error)
        this.error = error.response?.data?.message || error.message
        return false
      } finally {
        this.isLoading = false
      }
    },

    async logout() {
      try {
        await axios.post('/api/employees/logout')
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        // Reset all store data
        this.currentUser = null
        this.isAuthenticated = false
        this.error = null
        this.userPermissions = []

        // Reset other stores
        const rolesStore = useRolesStore()
        rolesStore.reset()

        // Redirect to login
        window.location.href = '/login'
      }
    },

    async handleUnauthorized() {
      // Reset store data
      this.currentUser = null
      this.isAuthenticated = false
      this.error = null
      this.userPermissions = []

      // Reset other stores
      const rolesStore = useRolesStore()
      rolesStore.reset()

      // Return error info instead of redirecting
      return {
        status: 'error',
        message: 'Your session has expired. Please log in again.',
        code: 'UNAUTHORIZED',
      }
    },

    async handleRoleChange() {
      // Reset store data
      this.currentUser = null
      this.isAuthenticated = false
      this.error = null
      this.userPermissions = []

      // Reset other stores
      const rolesStore = useRolesStore()
      rolesStore.reset()

      // Delay redirect to allow error message to be shown
      setTimeout(() => {
        window.location.href = '/login'
      }, 3000)

      return {
        status: 'error',
        message: 'Your role has been modified. Please log in again with your new permissions.',
        code: 'ROLE_CHANGED',
      }
    },

    async checkAuth() {
      try {
        const response = await axios.get('/api/employees/verify')
        if (response.data.user) {
          // Check if role has changed
          if (this.currentUser && this.currentUser.role !== response.data.user.role) {
            // Show role change error page
            const errorDiv = document.createElement('div')
            errorDiv.className =
              'fixed inset-0 bg-white flex flex-col items-center justify-center z-[9999]'
            errorDiv.innerHTML = `
              <div class="text-center p-8 max-w-lg">
                <div class="mb-6">
                  <svg class="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                </div>
                <h1 class="text-2xl font-bold text-red-600 mb-4">Role Changed</h1>
                <p class="text-gray-700 mb-6">Your role has been modified by an administrator. Please log in again with your new permissions.</p>
                <button onclick="window.location.href='/login'" class="bg-green-700 text-white px-6 py-2 rounded hover:bg-green-800">
                  Back to Login
                </button>
              </div>
            `
            document.body.appendChild(errorDiv)

            // Reset store and redirect after a delay
            setTimeout(() => {
              this.currentUser = null
              this.isAuthenticated = false
              this.error = null
              this.userPermissions = []
              window.location.href = '/login'
            }, 3000)

            return false
          }

          this.currentUser = response.data.user
          this.isAuthenticated = true

          // Log permissions during auth check
          console.log('Auth check permissions:', response.data.user.permissions)
          this.userPermissions =
            typeof response.data.user.permissions === 'string'
              ? JSON.parse(response.data.user.permissions)
              : response.data.user.permissions

          return true
        }
        return false
      } catch (error) {
        console.error('Auth check error:', error)

        // Show error page
        const errorDiv = document.createElement('div')
        errorDiv.className =
          'fixed inset-0 bg-white flex flex-col items-center justify-center z-[9999]'
        errorDiv.innerHTML = `
          <div class="text-center p-8 max-w-lg">
            <div class="mb-6">
              <svg class="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <h1 class="text-2xl font-bold text-red-600 mb-4">Session Expired</h1>
            <p class="text-gray-700 mb-6">Your session has expired. Please log in again.</p>
            <button onclick="window.location.href='/login'" class="bg-green-700 text-white px-6 py-2 rounded hover:bg-green-800">
              Back to Login
            </button>
          </div>
        `
        document.body.appendChild(errorDiv)

        this.logout()
        return false
      }
    },

    // Getter for permissions
    getUserPermissions() {
      return this.userPermissions
    },

    // Helper method to check if user has specific permission
    hasPermission(permissionId) {
      return this.userPermissions.includes(permissionId)
    },

    // Helper method to check if user has any of the given permissions
    hasAnyPermission(permissionIds) {
      return permissionIds.some((id) => this.userPermissions.includes(id))
    },

    // Helper method to check if user has all of the given permissions
    hasAllPermissions(permissionIds) {
      return permissionIds.every((id) => this.userPermissions.includes(id))
    },
  },
})
