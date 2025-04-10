import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
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
        const response = await axios.get('http://localhost:5000/api/roles')
        this.roles = response.data
        console.log('Fetched roles:', this.roles) // Add this to debug
        localStorage.setItem('roles', JSON.stringify(this.roles))
      } catch (error) {
        console.error('Error fetching roles:', error)
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

    async updateRole(roleId, updatedRole) {
      try {
        console.log('Updating role with ID:', roleId) // Log the role ID
        const response = await roleService.updateRole(roleId, updatedRole)
        await this.fetchRoles() // Refresh the roles list
        return response
      } catch (error) {
        this.error = error.message
        throw error
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

    // Add getRoleById function
    async getRoleById(id) {
      try {
        this.loading = true
        console.log('Fetching role with ID:', id) // Debug log

        const response = await axios.get(`http://localhost:5000/api/roles/${id}`)
        console.log('Role data received:', response.data) // Debug log

        return response.data
      } catch (error) {
        console.error('Error in getRoleById:', error.response || error) // Detailed error log
        throw new Error(
          error.response?.data?.message || error.message || 'Error fetching role details',
        )
      } finally {
        this.loading = false
      }
    },
  },
})
