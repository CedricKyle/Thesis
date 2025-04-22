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
            description: 'Basic HR staff with dashboard and report access',
            department: DEPARTMENTS.HR,
            permissions: [
              PERMISSION_IDS.HR_VIEW_DASHBOARD,
              PERMISSION_IDS.HR_VIEW_ATTENDANCE_REPORT,
            ],
            last_modified: new Date().toISOString(),
          },
        },
        hrRestricted: {
          userId: 'hrrestricted',
          password: 'countryside123',
          role: {
            id: 4,
            role_name: 'HR Restricted',
            description: 'Limited HR access - only roles and reports',
            department: DEPARTMENTS.HR,
            permissions: [PERMISSION_IDS.HR_VIEW_ATTENDANCE_REPORT, PERMISSION_IDS.HR_MANAGE_ROLES],
            last_modified: new Date().toISOString(),
          },
        },
        financeManager: {
          userId: 'financemanager',
          password: 'countryside123',
          role: {
            id: 5,
            role_name: 'Finance Manager',
            description: 'Full access to Finance department functions and management',
            department: DEPARTMENTS.FINANCE,
            permissions: [
              PERMISSION_IDS.FINANCE_FULL_ACCESS,
              PERMISSION_IDS.FINANCE_VIEW_DASHBOARD,
              PERMISSION_IDS.FINANCE_MANAGE_PAYROLL,
              PERMISSION_IDS.FINANCE_VIEW_REPORTS,
            ],
            last_modified: new Date().toISOString(),
          },
        },
        financeStaff: {
          userId: 'financestaff',
          password: 'countryside123',
          role: {
            id: 9,
            role_name: 'Finance Staff',
            description: 'Basic Finance staff with dashboard and report access',
            department: DEPARTMENTS.FINANCE,
            permissions: [
              PERMISSION_IDS.FINANCE_VIEW_DASHBOARD,
              PERMISSION_IDS.FINANCE_VIEW_REPORTS,
            ],
            last_modified: new Date().toISOString(),
          },
        },
        salesManager: {
          userId: 'salesmanager',
          password: 'countryside123',
          role: {
            id: 6,
            role_name: 'Sales Manager',
            description: 'Full access to Sales department functions and management',
            department: DEPARTMENTS.SALES,
            permissions: [PERMISSION_IDS.SALES_FULL_ACCESS, PERMISSION_IDS.SALES_VIEW_DASHBOARD],
            last_modified: new Date().toISOString(),
          },
        },
        salesStaff: {
          userId: 'salesstaff',
          password: 'countryside123',
          role: {
            id: 10,
            role_name: 'Sales Staff',
            description: 'Basic Sales staff with dashboard access',
            department: DEPARTMENTS.SALES,
            permissions: [PERMISSION_IDS.SALES_VIEW_DASHBOARD],
            last_modified: new Date().toISOString(),
          },
        },
        scmManager: {
          userId: 'scmmanager',
          password: 'countryside123',
          role: {
            id: 7,
            role_name: 'SCM Manager',
            description: 'Full access to Supply Chain Management functions',
            department: DEPARTMENTS.SCM,
            permissions: [
              PERMISSION_IDS.SCM_FULL_ACCESS,
              PERMISSION_IDS.SCM_VIEW_DASHBOARD,
              PERMISSION_IDS.SCM_VIEW_STOCKS,
            ],
            last_modified: new Date().toISOString(),
          },
        },
        scmStaff: {
          userId: 'scmstaff',
          password: 'countryside123',
          role: {
            id: 11,
            role_name: 'SCM Staff',
            description: 'Basic Supply Chain staff with dashboard and stocks access',
            department: DEPARTMENTS.SCM,
            permissions: [PERMISSION_IDS.SCM_VIEW_DASHBOARD, PERMISSION_IDS.SCM_VIEW_STOCKS],
            last_modified: new Date().toISOString(),
          },
        },
        crmManager: {
          userId: 'crmmanager',
          password: 'countryside123',
          role: {
            id: 8,
            role_name: 'CRM Manager',
            description: 'Full access to Customer Relationship Management functions',
            department: DEPARTMENTS.CRM,
            permissions: [
              PERMISSION_IDS.CRM_FULL_ACCESS,
              PERMISSION_IDS.CRM_VIEW_DASHBOARD,
              PERMISSION_IDS.CRM_MANAGE_CUSTOMERS,
              PERMISSION_IDS.CRM_MANAGE_COMMUNICATIONS,
              PERMISSION_IDS.CRM_MANAGE_APPOINTMENTS,
              PERMISSION_IDS.CRM_MANAGE_CAMPAIGNS,
              PERMISSION_IDS.CRM_VIEW_ANALYTICS,
            ],
            last_modified: new Date().toISOString(),
          },
        },
        crmStaff: {
          userId: 'crmstaff',
          password: 'countryside123',
          role: {
            id: 12,
            role_name: 'CRM Staff',
            description: 'Basic Customer Relations staff with dashboard access',
            department: DEPARTMENTS.CRM,
            permissions: [PERMISSION_IDS.CRM_VIEW_DASHBOARD],
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
            try {
              const rolesStore = useRolesStore()
              const roleData = await rolesStore.getRoleByName(employee.role)

              // Ensure roleData has the correct structure
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

              // Use the getDepartmentPath helper for consistent routing
              const deptPath = getDepartmentPath(employee.department)
              return `/${deptPath}/dashboard`
            } catch (error) {
              console.error('Error during login:', error)
              throw new Error('Failed to set up user role')
            }
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
      // Clear any stored tokens or session data
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      localStorage.removeItem('auth')

      // Clear role from roles store
      const rolesStore = useRolesStore()
      rolesStore.setCurrentEmployeeRole(null)

      // Return true to indicate successful logout
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

          // Important: Restore the role data in the role store
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
