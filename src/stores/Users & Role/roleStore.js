import { defineStore } from 'pinia'
import { ref } from 'vue'
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
    // Load roles from localStorage
    async fetchRoles() {
      try {
        this.loading = true
        const savedRoles = localStorage.getItem('roles')
        if (savedRoles) {
          this.roles = JSON.parse(savedRoles)
        } else {
          // Initialize with Super Admin role having all permissions
          const allPermissionIds = Object.values(PERMISSION_IDS)
          const defaultRoles = [
            {
              id: 1,
              role_name: 'Super Admin',
              description: 'Full system administrator access',
              department: DEPARTMENTS.ADMIN,
              permissions: allPermissionIds,
              last_modified: new Date().toISOString(),
            },
          ]
          localStorage.setItem('roles', JSON.stringify(defaultRoles))
          this.roles = defaultRoles
        }
      } catch (error) {
        console.error('Error fetching roles:', error)
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async addRole(roleData) {
      try {
        // Check for duplicate using role_name
        const roleName = roleData.role_name?.toLowerCase().trim()
        const isDuplicate = this.roles.some(
          (role) => role.role_name?.toLowerCase().trim() === roleName,
        )

        if (isDuplicate) {
          throw new Error('A role with this name already exists')
        }

        const newRole = {
          id: Date.now(),
          role_name: roleData.role_name, // Using role_name consistently
          description: roleData.description || '',
          department: roleData.department,
          permissions: roleData.permissions || [],
          last_modified: new Date().toISOString(),
        }

        console.log('Adding new role:', newRole)

        const currentRoles = localStorage.getItem('roles')
        const roles = currentRoles ? JSON.parse(currentRoles) : []
        roles.push(newRole)

        this.roles = roles
        localStorage.setItem('roles', JSON.stringify(roles))

        return newRole
      } catch (error) {
        console.error('Error adding role:', error)
        throw error
      }
    },

    async updateRole(roleId, updatedRole) {
      try {
        const currentRoles = localStorage.getItem('roles')
        let roles = currentRoles ? JSON.parse(currentRoles) : []

        const index = roles.findIndex((role) => role.id === parseInt(roleId))
        if (index !== -1) {
          roles[index] = {
            ...roles[index],
            ...updatedRole,
            last_modified: new Date().toISOString(),
          }
          localStorage.setItem('roles', JSON.stringify(roles))
          await this.fetchRoles() // Refresh the roles list
          return roles[index]
        }
        throw new Error('Role not found')
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async deleteRole(roleId) {
      try {
        this.roles = this.roles.filter((role) => role.id !== roleId)
        // Update localStorage
        localStorage.setItem('roles', JSON.stringify(this.roles))
      } catch (error) {
        console.error('Error deleting role:', error)
        throw error
      }
    },

    async getRoleById(id) {
      try {
        this.loading = true
        const currentRoles = localStorage.getItem('roles')
        const roles = currentRoles ? JSON.parse(currentRoles) : []

        // Convert id to number since route params are strings
        const numericId = parseInt(id)
        const role = roles.find((role) => role.id === numericId)

        if (!role) {
          throw new Error(`Role with ID ${id} not found`)
        }

        console.log('Found role:', role) // Debug log
        return role
      } catch (error) {
        console.error('Error in getRoleById:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    getCurrentEmployeeRole() {
      if (!this.currentEmployeeRole) {
        return {
          id: 1,
          role_name: 'Super Admin',
          description: 'Full system administrator access',
          department: DEPARTMENTS.ADMIN,
          permissions: [PERMISSION_IDS.ADMIN_FULL_ACCESS],
          last_modified: new Date().toISOString(),
        }
      }
      return this.currentEmployeeRole
    },

    setCurrentEmployeeRole(role) {
      this.currentEmployeeRole = role
    },

    initializeStore() {
      try {
        const savedRoles = localStorage.getItem('roles')
        if (savedRoles) {
          this.roles = JSON.parse(savedRoles)
        } else {
          // Initialize with Super Admin and HR roles
          const defaultRoles = [
            {
              id: 1,
              role_name: 'Super Admin',
              description: 'Full system administrator access',
              department: DEPARTMENTS.ADMIN,
              permissions: Object.values(PERMISSION_IDS),
              last_modified: new Date().toISOString(),
            },
            {
              id: 2,
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
              last_modified: new Date().toISOString(),
            },
            {
              id: 3,
              role_name: 'HR Staff',
              description: 'Basic HR staff with dashboard access',
              department: DEPARTMENTS.HR,
              permissions: [PERMISSION_IDS.HR_VIEW_DASHBOARD],
              last_modified: new Date().toISOString(),
            },
          ]
          localStorage.setItem('roles', JSON.stringify(defaultRoles))
          this.roles = defaultRoles
        }

        // Set default Super Admin role for testing
        this.setCurrentEmployeeRole(this.roles[0])
      } catch (error) {
        console.error('Error initializing roles store:', error)
        this.error = error.message
      }
    },
  },
})
