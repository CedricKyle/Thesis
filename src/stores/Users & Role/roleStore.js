import { defineStore } from 'pinia'
import { ref } from 'vue'
import { PERMISSION_IDS } from '@/composables/Admin Composables/User & Role/role/permissionsId'

export const useRolesStore = defineStore('roles', {
  state: () => ({
    roles: ref([]),
    loading: false,
    error: null,
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
  },
})
