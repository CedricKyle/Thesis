import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useRolesStore } from '@/stores/Users & Role/roleStore'
import axios from '@/plugins/axios'
import {
  DEPARTMENTS,
  PERMISSION_IDS,
} from '@/composables/Admin Composables/User & Role/role/permissionsId'

// Add this helper function at the top of the file, after the imports
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

          // Store the actual permissions from the backend response
          this.userPermissions = response.data.user.permissions || []

          // Determine redirect path based on department
          const redirectPath =
            response.data.user.role === 'Super Admin'
              ? '/admin/hr/dashboard'
              : `/${getDepartmentPath(response.data.user.department)}/dashboard`

          window.location.href = redirectPath
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

    async checkAuth() {
      if (this.isAuthenticated && this.currentUser) {
        return true
      }

      try {
        const response = await axios.get('/api/employees/verify')
        if (response.data.user) {
          this.currentUser = response.data.user
          this.isAuthenticated = true
          // Store the actual permissions from the verify response
          this.userPermissions = response.data.user.permissions || []
          return true
        }
        return false
      } catch (error) {
        console.error('Auth check error:', error)
        this.currentUser = null
        this.isAuthenticated = false
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
  },
})
