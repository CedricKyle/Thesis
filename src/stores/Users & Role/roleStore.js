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
    async fetchRoles() {
      try {
        const authStore = useAuthStore()
        if (!authStore.isAuthenticated) {
          console.log('Not authenticated, skipping roles fetch')
          return
        }

        this.loading = true
        const response = await axios.get('/api/roles')
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
        const response = await axios.put(`/api/roles/${roleId}`, updatedRole)
        await this.fetchRoles()
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
        await this.fetchRoles()
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
        const response = await axios.get(`/api/roles/${id}`)

        // Ensure permissions is always an array
        const roleData = response.data
        if (typeof roleData.permissions === 'string') {
          roleData.permissions = JSON.parse(roleData.permissions)
        }
        return roleData
      } catch (error) {
        console.error('Error in getRoleById:', error)
        throw error
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

        // If we have complete role data
        if (employeeData.role_name && Array.isArray(employeeData.permissions)) {
          this.currentEmployeeRole = employeeData
          return
        }

        // If we have a role name, fetch the complete role data
        const roleName = employeeData.role || employeeData.role_name
        if (roleName) {
          const roleData = await this.getRoleByName(roleName)
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
  },
})
