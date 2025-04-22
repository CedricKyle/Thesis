import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useRolesStore } from '@/stores/Users & Role/roleStore'
import axios from 'axios'
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
    currentUser: ref(null),
    isAuthenticated: ref(false),
    error: ref(null),
    isFirstLogin: false,
  }),

  actions: {
    async login(employeeId, password) {
      this.error = null

      try {
        const response = await axios.get(`http://localhost:3000/api/employees/${employeeId}`)
        const employee = response.data

        if (!employee) {
          throw new Error('Employee not found')
        }

        if (password !== 'countryside123') {
          throw new Error('Invalid password')
        }

        try {
          const rolesStore = useRolesStore()
          const roleData = await rolesStore.getRoleByName(employee.role)

          if (!roleData) {
            throw new Error('Role not found')
          }

          const formattedRoleData = {
            id: roleData.id,
            role_name: roleData.role_name,
            description: roleData.description,
            department: roleData.department,
            permissions: Array.isArray(roleData.permissions)
              ? roleData.permissions
              : JSON.parse(roleData.permissions || '[]'),
            last_modified: roleData.updated_at || new Date().toISOString(),
          }

          this.currentUser = {
            id: employee.employee_id,
            userId: employee.employee_id,
            role: formattedRoleData,
            fullName: employee.full_name,
            department: employee.department,
          }

          this.isAuthenticated = true
          await rolesStore.setCurrentEmployeeRole(formattedRoleData)
          this.saveToLocalStorage()

          const deptPath = getDepartmentPath(employee.department)
          return `/${deptPath}/dashboard`
        } catch (error) {
          console.error('Error during login:', error)
          throw new Error(error.message || 'Failed to set up user role')
        }
      } catch (error) {
        console.error('Login error:', error)
        this.error = error.message
        return false
      }
    },

    saveToLocalStorage() {
      if (this.currentUser) {
        localStorage.setItem(
          'user',
          JSON.stringify({
            id: this.currentUser.id,
            userId: this.currentUser.userId,
            role: this.currentUser.role,
            fullName: this.currentUser.fullName,
            department: this.currentUser.department,
          }),
        )
        localStorage.setItem('isAuthenticated', 'true')
      }
    },

    logout() {
      this.isAuthenticated = false
      this.currentUser = null
      this.isFirstLogin = false
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      localStorage.removeItem('auth')
      const rolesStore = useRolesStore()
      rolesStore.setCurrentEmployeeRole(null)
      return true
    },

    async checkAuth() {
      const userData = localStorage.getItem('user')
      const isAuthenticated = localStorage.getItem('isAuthenticated')

      if (userData && isAuthenticated === 'true') {
        try {
          const user = JSON.parse(userData)
          this.currentUser = user
          this.isAuthenticated = true

          const rolesStore = useRolesStore()
          await rolesStore.setCurrentEmployeeRole({
            role: user.role.role_name,
            department: user.department,
            permissions: user.role.permissions,
          })

          return true
        } catch (error) {
          console.error('Error restoring auth state:', error)
          this.logout()
          return false
        }
      }
      return false
    },
  },
})
