import { defineStore } from 'pinia'
import { ref } from 'vue'

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
        const cachedRoles = localStorage.getItem('roles')
        this.roles = cachedRoles ? JSON.parse(cachedRoles) : []
      } catch (error) {
        console.error('Error loading roles from localStorage:', error)
        this.error = error.message
        this.roles = []
      } finally {
        this.loading = false
      }
    },

    async addRole(role) {
      try {
        this.loading = true
        const currentRoles = localStorage.getItem('roles')
        const roles = currentRoles ? JSON.parse(currentRoles) : []

        // Generate a simple unique ID
        role.id = Date.now().toString()
        roles.push(role)

        localStorage.setItem('roles', JSON.stringify(roles))
        await this.fetchRoles() // Refresh the roles list
        return role
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateRole(roleId, updatedRole) {
      try {
        const currentRoles = localStorage.getItem('roles')
        let roles = currentRoles ? JSON.parse(currentRoles) : []

        const index = roles.findIndex((role) => role.id === roleId)
        if (index !== -1) {
          roles[index] = { ...roles[index], ...updatedRole }
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

    async deleteRole(id) {
      try {
        this.loading = true
        const currentRoles = localStorage.getItem('roles')
        let roles = currentRoles ? JSON.parse(currentRoles) : []

        roles = roles.filter((role) => role.id !== id)
        localStorage.setItem('roles', JSON.stringify(roles))
        await this.fetchRoles() // Refresh the roles list
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async getRoleById(id) {
      try {
        this.loading = true
        const currentRoles = localStorage.getItem('roles')
        const roles = currentRoles ? JSON.parse(currentRoles) : []

        const role = roles.find((role) => role.id === id)
        if (!role) {
          throw new Error('Role not found')
        }
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
