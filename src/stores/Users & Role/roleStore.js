import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from '@/plugins/axios'
import { useAuthStore } from '@/stores/Authentication/authStore'
import {
  PERMISSION_IDS,
  DEPARTMENTS,
} from '@/composables/Admin Composables/User & Role/role/permissionsId'

export const useRolesStore = defineStore('roles', {
  state: () => ({
    roles: ref([]),
    loading: false,
    error: null,
    currentEmployeeRole: ref(null),
  }),

  actions: {
    async fetchRoles(showArchived = false) {
      try {
        const authStore = useAuthStore()
        if (!authStore.isAuthenticated) {
          console.log('Not authenticated, skipping roles fetch')
          return
        }

        this.loading = true
        const response = await axios.get('/api/roles', {
          params: { showArchived: showArchived.toString() },
        })
        this.roles = response.data
      } catch (error) {
        console.error('Error fetching roles:', error)
        this.error = error.message
        if (error.response?.status === 401) {
          const authStore = useAuthStore()
          await authStore.logout()
        }
      } finally {
        this.loading = false
      }
    },

    async getRoleByName(roleName) {
      try {
        if (!roleName) {
          console.log('No role name provided')
          return null
        }
        const response = await axios.get(`/api/roles/name/${roleName}`)
        return response.data
      } catch (error) {
        console.error('Error getting role by name:', error)
        return null
      }
    },

    async addRole(roleData) {
      try {
        const authStore = useAuthStore()
        if (!authStore.isAuthenticated) {
          console.log('Not authenticated, skipping role creation')
          return
        }

        const newRole = {
          role_name: roleData.role_name,
          description: roleData.description || '',
          department: roleData.department,
          permissions: roleData.permissions || [],
        }

        const response = await axios.post('/api/roles', newRole)
        await this.fetchRoles()
        return response.data
      } catch (error) {
        console.error('Error adding role:', error)
        throw error
      }
    },

    async updateRole(roleId, updatedRole) {
      try {
        const authStore = useAuthStore()
        const currentUser = authStore.currentUser

        const response = await axios.put(`/api/roles/${roleId}`, updatedRole)
        await this.fetchRoles()

        // Check if the updated role affects the current user
        if (currentUser && currentUser.role === response.data.role_name) {
          // Create and show unauthorized page
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
              <p class="text-gray-700 mb-6">Your role has been modified by an administrator. Please log in again with your new permissions.</p>
              <button onclick="window.location.href='/login'" class="bg-green-700 text-white px-6 py-2 rounded hover:bg-green-800">
                Back to Login
              </button>
            </div>
          `
          document.body.appendChild(errorDiv)

          // Reset auth store after a short delay
          setTimeout(() => {
            authStore.handleUnauthorized()
          }, 500)

          throw new Error('Role changed for current user')
        }

        return response.data
      } catch (error) {
        console.error('Error updating role:', error)
        if (error.response?.status === 401 || error.response?.status === 403) {
          const authStore = useAuthStore()
          await authStore.handleUnauthorized()
        }
        throw error
      }
    },

    async deleteRole(roleId) {
      try {
        await axios.delete(`/api/roles/${roleId}`)
        // Pass true to show archived roles after deletion
        await this.fetchRoles(true)
      } catch (error) {
        console.error('Error deleting role:', error)
        throw error
      }
    },

    async getRoleById(id) {
      try {
        if (!id) {
          throw new Error('Role ID is required')
        }

        console.log('Fetching role with ID:', id)
        const response = await axios.get(`/api/roles/${id}`)

        if (!response.data) {
          throw new Error('No data received from server')
        }

        // Ensure permissions is always an array
        const roleData = response.data
        let permissions = roleData.permissions

        try {
          if (typeof permissions === 'string') {
            permissions = JSON.parse(permissions)
          }
        } catch (error) {
          console.error('Error parsing permissions:', error)
          permissions = []
        }

        const formattedRole = {
          ...roleData,
          permissions: Array.isArray(permissions) ? permissions : [],
        }

        console.log('Formatted role data:', formattedRole)
        return formattedRole
      } catch (error) {
        console.error('Error in getRoleById:', error)
        if (error.response?.status === 404) {
          throw new Error('Role not found')
        }
        if (error.response?.data?.message) {
          throw new Error(error.response.data.message)
        }
        throw new Error('Failed to fetch role')
      }
    },

    getCurrentEmployeeRole() {
      return this.currentEmployeeRole
    },

    async setCurrentEmployeeRole(employeeData) {
      try {
        if (!employeeData) {
          console.log('No employee data available yet')
          this.currentEmployeeRole = null
          return
        }

        const roleId = employeeData.role_id
        if (roleId) {
          const roleData = await this.getRoleById(roleId)
          if (roleData) {
            if (typeof roleData.permissions === 'string') {
              roleData.permissions = JSON.parse(roleData.permissions)
            }
            this.currentEmployeeRole = roleData
          }
        } else {
          console.log('No role specified in employee data')
          this.currentEmployeeRole = null
        }
      } catch (error) {
        console.error('Error setting current employee role:', error)
        this.currentEmployeeRole = null
      }
    },

    async initializeStore() {
      try {
        const authStore = useAuthStore()
        if (!authStore.isAuthenticated) {
          console.log('Not authenticated, skipping store initialization')
          return
        }

        await this.fetchRoles()

        if (this.roles.length === 0) {
          const defaultRoles = [
            {
              role_name: 'Super Admin',
              description: 'Full system administrator access',
              department: DEPARTMENTS.ADMIN,
              permissions: Object.values(PERMISSION_IDS),
            },
            {
              role_name: 'HR Manager',
              description: 'Full access to HR department functions and management',
              department: DEPARTMENTS.HR,
              permissions: [
                PERMISSION_IDS.HR_FULL_ACCESS,
                PERMISSION_IDS.HR_VIEW_DASHBOARD,
                PERMISSION_IDS.HR_MANAGE_EMPLOYEES,
                PERMISSION_IDS.HR_MANAGE_ATTENDANCE,
                PERMISSION_IDS.HR_VIEW_ATTENDANCE_REPORT,
                PERMISSION_IDS.HR_MANAGE_ROLES,
              ],
            },
            {
              role_name: 'HR Staff',
              description: 'Basic HR staff with dashboard access',
              department: DEPARTMENTS.HR,
              permissions: [PERMISSION_IDS.HR_VIEW_DASHBOARD],
            },
          ]

          for (const role of defaultRoles) {
            await this.addRole(role)
          }
        }
      } catch (error) {
        console.error('Error initializing roles store:', error)
        this.error = error.message
      }
    },

    // Add a reset method
    reset() {
      this.roles = []
      this.loading = false
      this.error = null
      this.currentEmployeeRole = null
    },

    async restoreRole(roleId) {
      try {
        await axios.post(`/api/roles/${roleId}/restore`)
        // Pass the current showArchived state when refreshing
        await this.fetchRoles(true)
      } catch (error) {
        console.error('Error restoring role:', error)
        throw error
      }
    },
  },
})
