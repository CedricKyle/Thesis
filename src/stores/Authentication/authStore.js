import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useRolesStore } from '@/stores/Users & Role/roleStore'
import axios from '@/plugins/axios'
import {
  DEPARTMENTS,
  PERMISSION_IDS,
} from '@/composables/Admin Composables/User & Role/role/permissionsId'
import { useRouter } from 'vue-router'

// Update the helper function to be dynamic
function getDepartmentPath(department) {
  if (!department) return ''

  // Create dynamic mapping based on DEPARTMENTS constant
  const deptMap = Object.entries(DEPARTMENTS).reduce((acc, [key, value]) => {
    // Convert department name to path format
    const path = value
      .toLowerCase()
      .replace(' department', '') // Remove "department" if present
      .replace(/\s+/g, '-') // Replace spaces with hyphens
    acc[value] = path
    return acc
  }, {})

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
          console.log('Current User:', this.currentUser)
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

          console.log(this.currentUser)
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
            // Instead of directly manipulating DOM and redirecting,
            // just return false with a special flag
            this.currentUser = null
            this.isAuthenticated = false
            this.error = 'ROLE_CHANGED'
            this.userPermissions = []
            return false
          }

          this.currentUser = response.data.user
          this.isAuthenticated = true

          console.log('Auth check permissions:', response.data.user.permissions)
          console.log('Auth check user:', response.data.user)
          this.userPermissions =
            typeof response.data.user.permissions === 'string'
              ? JSON.parse(response.data.user.permissions)
              : response.data.user.permissions

          console.log(this.currentUser)
          return true
        }
        return false
      } catch (error) {
        console.error('Auth check error:', error)
        this.currentUser = null
        this.isAuthenticated = false
        this.error = 'SESSION_EXPIRED'
        this.userPermissions = []
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

    // Add this new method
    getRoleChangeStatus() {
      return {
        isRoleChanged: this.error === 'ROLE_CHANGED',
        isSessionExpired: this.error === 'SESSION_EXPIRED',
      }
    },
  },
})
