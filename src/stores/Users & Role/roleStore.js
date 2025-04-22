import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  PERMISSION_IDS,
  DEPARTMENTS,
} from '@/composables/Admin Composables/User & Role/role/permissionsId'
import axios from 'axios'

export const useRolesStore = defineStore('roles', {
  state: () => ({
    roles: ref([]),
    loading: false,
    error: null,
    currentEmployeeRole: ref(null),
  }),

  actions: {
    // Fetch roles from backend API
    async fetchRoles() {
      try {
        this.loading = true
        const response = await axios.get('http://localhost:3000/api/roles')
        this.roles = response.data
      } catch (error) {
        console.error('Error fetching roles:', error)
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    // Get role by name from backend
    async getRoleByName(roleName) {
      try {
        if (!roleName) {
          console.log('No role name provided')
          return null
        }
        const response = await axios.get(`http://localhost:3000/api/roles/name/${roleName}`)
        return response.data
      } catch (error) {
        console.error('Error getting role by name:', error)
        return null // Return null instead of throwing error
      }
    },

    async addRole(roleData) {
      try {
        const newRole = {
          role_name: roleData.role_name,
          description: roleData.description || '',
          department: roleData.department,
          permissions: roleData.permissions || [],
        }

        const response = await axios.post('http://localhost:3000/api/roles', newRole)
        await this.fetchRoles()
        return response.data
      } catch (error) {
        console.error('Error adding role:', error)
        throw error
      }
    },

    async updateRole(roleId, updatedRole) {
      try {
        const response = await axios.put(`http://localhost:3000/api/roles/${roleId}`, updatedRole)
        await this.fetchRoles()
        return response.data
      } catch (error) {
        console.error('Error updating role:', error)
        throw error
      }
    },

    async deleteRole(roleId) {
      try {
        await axios.delete(`http://localhost:3000/api/roles/${roleId}`)
        // Refresh the roles list after deleting
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
        const response = await axios.get(`http://localhost:3000/api/roles/${id}`)

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
        // Check if employeeData exists
        if (!employeeData) {
          console.log('No employee data available yet')
          this.currentEmployeeRole = null
          return
        }

        // If we already have complete role data (from localStorage)
        if (employeeData.role && Array.isArray(employeeData.permissions)) {
          this.currentEmployeeRole = {
            role_name: employeeData.role,
            department: employeeData.department,
            permissions: employeeData.permissions,
          }
          return
        }

        // Otherwise fetch from backend
        if (employeeData.role) {
          const roleData = await this.getRoleByName(employeeData.role)
          if (roleData) {
            // Ensure permissions is always an array
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
        // Fetch roles from backend instead of using localStorage
        await this.fetchRoles()

        // If no roles exist, create default roles
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

          // Add default roles to backend
          for (const role of defaultRoles) {
            await this.addRole(role)
          }
        }
      } catch (error) {
        console.error('Error initializing roles store:', error)
        this.error = error.message
      }
    },
  },
})
