import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useRolesStore } from '@/stores/Users & Role/roleStore'
import axios from 'axios'
import {
  DEPARTMENTS,
  PERMISSION_IDS,
} from '@/composables/Admin Composables/User & Role/role/permissionsId'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    currentUser: ref(null),
    isAuthenticated: ref(false),
    error: ref(null),
  }),

  actions: {
    async login(employeeId, password) {
      // Clear any previous errors
      this.error = null

      // Temporary accounts
      const temporaryAccounts = {
        superAdmin: {
          userId: 'superadmin',
          password: 'countryside123',
          role: {
            id: 1,
            role_name: 'Super Admin',
            description: 'Full system administrator access',
            department: DEPARTMENTS.ADMIN,
            permissions: [PERMISSION_IDS.ADMIN_FULL_ACCESS],
            last_modified: new Date().toISOString(),
          },
        },
        hrManager: {
          userId: 'hrmanager',
          password: 'countryside123',
          role: {
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
        },
        hrStaff: {
          userId: 'hrstaff',
          password: 'countryside123',
          role: {
            id: 3,
            role_name: 'HR Staff',
            description: 'Basic HR staff with dashboard access',
            department: DEPARTMENTS.HR,
            permissions: [PERMISSION_IDS.HR_VIEW_DASHBOARD],
            last_modified: new Date().toISOString(),
          },
        },
      }

      try {
        // Check for temporary accounts
        const account = Object.values(temporaryAccounts).find((acc) => acc.userId === employeeId)
        if (account && password === account.password) {
          this.currentUser = {
            id: account.role.id,
            userId: account.userId,
            role: account.role,
            fullName: account.role.role_name,
            department: account.role.department,
          }
          this.isAuthenticated = true
          const rolesStore = useRolesStore()
          rolesStore.setCurrentEmployeeRole(account.role)
          this.saveToLocalStorage()

          // Add default redirect based on role
          if (account.role.department === DEPARTMENTS.HR) {
            return '/hr/dashboard' // Return the redirect path for HR
          } else if (account.role.department === DEPARTMENTS.ADMIN) {
            return '/admin/hr/dashboard' // Return the redirect path for Super Admin
          }
          return true
        }

        // If not a temporary account, check regular employee credentials
        try {
          const response = await axios.get(`http://localhost:3000/api/employees/${employeeId}`)
          const employee = response.data

          if (employee && password === 'countryside123') {
            this.currentUser = {
              id: employee.employee_id,
              userId: employee.employee_id,
              role: employee.role,
              fullName: employee.full_name,
              department: employee.department,
            }
            this.isAuthenticated = true
            const rolesStore = useRolesStore()
            rolesStore.setCurrentEmployeeRole(employee.role)
            this.saveToLocalStorage()
            return true
          }

          throw new Error('Invalid credentials')
        } catch (error) {
          console.error('Login error:', error)
          throw new Error('Invalid credentials')
        }
      } catch (error) {
        this.error = error.message
        return false
      }
    },

    saveToLocalStorage() {
      localStorage.setItem(
        'auth',
        JSON.stringify({
          user: this.currentUser,
          isAuthenticated: true,
        }),
      )
    },

    logout() {
      this.currentUser = null
      this.isAuthenticated = false
      localStorage.removeItem('auth')

      // Clear role from roles store
      const rolesStore = useRolesStore()
      rolesStore.setCurrentEmployeeRole(null)
    },

    // Check if there's a stored auth state
    checkAuth() {
      const stored = localStorage.getItem('auth')
      if (stored) {
        const { user, isAuthenticated } = JSON.parse(stored)
        this.currentUser = user
        this.isAuthenticated = isAuthenticated

        // Restore role in roles store
        const rolesStore = useRolesStore()
        rolesStore.setCurrentEmployeeRole(user.role)

        return true
      }
      return false
    },
  },
})
