import { defineStore } from 'pinia'
import { ref } from 'vue'
import { roleService } from '@/services/roleService'

export const useRolesStore = defineStore('roles', {
  state: () => ({
    roles: ref([]),
    loading: false,
    error: null,
  }),

  actions: {
    // Load roles from API with localStorage backup
    async fetchRoles() {
      try {
        this.loading = true
        const roles = await roleService.getAllRoles()
        // Transform backend data to frontend structure
        this.roles = roles.map((role) => ({
          'role name': role.role_name,
          description: role.description,
          permissions: role.permissions,
          'last modified': role.last_modified,
          id: role.id,
        }))
        localStorage.setItem('roles', JSON.stringify(this.roles))
      } catch (error) {
        this.error = error.message
        // Load from localStorage if API fails
        const cachedRoles = localStorage.getItem('roles')
        if (cachedRoles) {
          this.roles = JSON.parse(cachedRoles)
        }
      } finally {
        this.loading = false
      }
    },

    async addRole(role) {
      try {
        this.loading = true
        const response = await roleService.createRole(role)
        await this.fetchRoles() // Refresh the roles list
        return response
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateRole(id, updatedRole) {
      try {
        this.loading = true
        await roleService.updateRole(id, updatedRole)
        await this.fetchRoles() // Refresh the roles list
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteRole(id) {
      try {
        this.loading = true
        await roleService.deleteRole(id)
        await this.fetchRoles() // Refresh the roles list
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})
