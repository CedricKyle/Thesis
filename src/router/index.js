import { createRouter, createWebHistory } from 'vue-router'
import AdminSidebar from '@/views/Admin/AdminSidebar.vue'
import UserRolesManagement from '@/views/Human Resource/UserRolesManagement.vue'
import CreateRoleForm from '@/components/Users & Role/Roles/CreateRoleForm.vue'
import FinancialManagement from '@/views/Admin/FinancialManagement.vue'
import SalesManagement from '@/views/Admin/SalesManagement.vue'
import InventoryManagement from '@/views/Admin/InventoryManagement.vue'
import CRMManagement from '@/views/Admin/CRMManagement.vue'
import HRDashboard from '@/views/Human Resource/HRDashboard.vue'
import Employees from '@/views/Human Resource/Employees.vue'
import Attendance from '@/views/Human Resource/Attendance.vue'
import AttendanceReport from '@/views/Human Resource/AttendanceReport.vue'
import EditRoleForm from '@/components/Users & Role/Roles/EditRoleForm.vue'
import LoginPage from '@/views/LoginPage.vue'
import FinanceDashboard from '@/views/Finance/FinanceDashboard.vue'
import FinancePayroll from '@/views/Finance/FinancePayroll.vue'
import FinanceReport from '@/views/Finance/FinanceReport.vue'
import BaseProductTable from '@/views/Supply Chain Management Department/BaseProductTable.vue'
import SCMDashboard from '@/views/Supply Chain Management Department/SCMDashboard.vue'
import StockView from '@/views/Supply Chain Management Department/StockView.vue'
import CRMDashboard from '@/views/CRM Department/CRMDashboard.vue'
import SalesDashboard from '@/views/Sales Department/SalesDashboard.vue'
import HRMSidebar from '@/views/Human Resource/HRMSidebar.vue'
import FinanceSideBar from '@/views/Finance/FinanceSideBar.vue'
import SalesSidebar from '@/views/Sales Department/SalesSidebar.vue'
import SCMSidebar from '@/views/Supply Chain Management Department/SCMSidebar.vue'
import CRMSidebar from '@/views/CRM Department/CRMASidebar.vue'
import { useRolesStore } from '@/stores/Users & Role/roleStore'
import { usePermissions } from '@/composables/Admin Composables/User & Role/role/usePermissions'
import {
  PERMISSION_IDS,
  DEPARTMENTS,
} from '@/composables/Admin Composables/User & Role/role/permissionsId'
import { useAuthStore } from '@/stores/Authentication/authStore'
import { computed } from 'vue'

const routes = [
  {
    path: '/',
    redirect: '/admin',
  },
  // Admin Router
  {
    path: '/admin',
    component: AdminSidebar,
    children: [
      {
        path: '',
        redirect: '/admin/hr/dashboard',
      },
      {
        path: 'dashboard',
        redirect: '/admin/hr/dashboard',
      },
      {
        path: 'hr/dashboard',
        name: 'AdminHRDashboard',
        component: HRDashboard,
      },
      {
        path: 'hr/roles',
        name: 'AdminRoles',
        component: UserRolesManagement,
      },
      {
        path: 'hr/employees',
        name: 'AdminEmployees',
        component: Employees,
      },
      {
        path: 'hr/attendance',
        name: 'AdminAttendance',
        component: Attendance,
      },
      {
        path: 'hr/attendance-report',
        name: 'AdminAttendanceReport',
        component: AttendanceReport,
      },
      {
        path: 'finance/dashboard',
        name: 'AdminFinanceDashboard',
        component: FinanceDashboard,
      },
      {
        path: 'finance/payroll',
        name: 'AdminFinancePayroll',
        component: FinancePayroll,
      },
      {
        path: 'finance/report',
        name: 'AdminFinanceReport',
        component: FinanceReport,
      },
      {
        path: 'sales/dashboard',
        name: 'AdminSalesDashboard',
        component: SalesDashboard,
      },
      {
        path: 'inventory/dashboard',
        name: 'AdminSCMDashboard',
        component: SCMDashboard,
      },
      {
        path: 'inventory/stocks',
        name: 'AdminStocks',
        component: StockView,
      },
      {
        path: 'crm/dashboard',
        name: 'AdminCRMDashboard',
        component: CRMDashboard,
      },
      {
        path: 'hr/roles/create',
        name: 'AdminCreateRole',
        component: CreateRoleForm,
      },
      {
        path: 'hr/roles/edit/:id',
        name: 'AdminEditRole',
        component: EditRoleForm,
        props: true,
      },
      {
        path: 'hr/employees/edit/:id',
        name: 'AdminEditEmployee',
        component: () => import('@/components/Admin Components/HR/Employee/EditEmployeeForm.vue'),
        props: true,
      },
    ],
  },

  // Human Resource Management Router
  {
    path: '/hr',
    component: HRMSidebar,
    meta: {
      requiresAuth: true,
      department: DEPARTMENTS.HR,
    },
    children: [
      {
        path: '',
        redirect: '/hr/dashboard',
      },
      {
        path: 'dashboard',
        name: 'HRDashboard',
        component: HRDashboard,
      },
      {
        path: 'employees',
        name: 'Employees',
        component: Employees,
        meta: {
          permissions: [PERMISSION_IDS.HR_MANAGE_EMPLOYEES],
        },
      },
      {
        path: 'attendance',
        name: 'Attendance',
        component: Attendance,
      },
      {
        path: 'attendance-report',
        name: 'AttendanceReport',
        component: AttendanceReport,
      },
      {
        path: 'roles',
        name: 'Roles',
        component: UserRolesManagement,
        meta: {
          permissions: [PERMISSION_IDS.HR_MANAGE_ROLES],
        },
      },
      {
        path: 'roles/create',
        name: 'CreateRole',
        component: CreateRoleForm,
      },
      {
        path: 'roles/edit/:id',
        name: 'EditRole',
        component: EditRoleForm,
        props: true,
      },
      {
        path: 'employees/edit/:id',
        name: 'EditEmployee',
        component: () => import('@/components/Admin Components/HR/Employee/EditEmployeeForm.vue'),
        props: true,
      },
    ],
  },

  // Finance Router
  {
    path: '/finance',
    component: FinanceSideBar,
    children: [
      {
        path: '',
        redirect: '/finance/dashboard',
      },
      {
        path: 'dashboard',
        name: 'FinanceDashboard',
        component: FinanceDashboard,
      },
      {
        path: 'payroll',
        name: 'FinancePayroll',
        component: FinancePayroll,
      },
      {
        path: 'reports',
        name: 'FinanceReport',
        component: FinanceReport,
      },
    ],
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
  },
  // Sales Router
  {
    path: '/sales',
    component: SalesSidebar,
    meta: {
      requiresAuth: true,
      department: 'Sales Department',
    },
    children: [
      {
        path: '',
        redirect: '/sales/dashboard',
      },
      {
        path: 'dashboard',
        name: 'SalesDashboard',
        component: SalesDashboard,
        meta: {
          permissions: [PERMISSION_IDS.SALES_VIEW_DASHBOARD, PERMISSION_IDS.SALES_FULL_ACCESS],
        },
      },
    ],
  },
  // Supply Chain Management Router
  {
    path: '/scm',
    component: SCMSidebar,
    meta: {
      requiresAuth: true,
      department: DEPARTMENTS.SCM,
    },
    children: [
      {
        path: '',
        redirect: '/scm/dashboard',
      },
      {
        path: 'dashboard',
        name: 'SCMDashboard',
        component: SCMDashboard,
        meta: {
          permissions: [PERMISSION_IDS.SCM_VIEW_DASHBOARD],
        },
      },
      {
        path: 'stocks',
        name: 'SCMStocks',
        component: StockView,
        meta: {
          permissions: [PERMISSION_IDS.SCM_VIEW_STOCKS],
        },
      },
    ],
  },
  // CRM Router
  {
    path: '/crm',
    component: CRMSidebar,
    meta: {
      requiresAuth: true,
      department: DEPARTMENTS.CRM,
    },
    children: [
      {
        path: '',
        redirect: '/crm/dashboard',
      },
      {
        path: 'dashboard',
        name: 'CRMDashboard',
        component: CRMDashboard,
        meta: {
          permissions: [PERMISSION_IDS.CRM_VIEW_DASHBOARD, PERMISSION_IDS.CRM_FULL_ACCESS],
        },
      },
    ],
  },
  {
    path: '/access-denied',
    name: 'AccessDenied',
    component: () => import('@/components/common/AccessDenied.vue'),
  },
  // Add this redirect
  {
    path: '/supply/:pathMatch(.*)*',
    redirect: (to) => {
      // Redirect /supply/xxx to /scm/xxx
      return `/scm${to.path.substring(7)}`
    },
  },
  {
    path: '/customer/:pathMatch(.*)*',
    redirect: (to) => {
      // Redirect /customer/xxx to /crm/xxx
      return `/crm${to.path.substring(9)}`
    },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const publicRoutes = ['/login', '/access-denied']

  if (publicRoutes.includes(to.path)) {
    next()
    return
  }

  const authStore = useAuthStore()
  const isAuthenticated = await authStore.checkAuth()

  console.log('Is authenticated:', isAuthenticated)
  console.log('Current user:', authStore.currentUser)
  console.log('User permissions:', authStore.userPermissions)

  if (!isAuthenticated) {
    // Show unauthorized page
    const errorDiv = document.createElement('div')
    errorDiv.className = 'fixed inset-0 bg-white flex flex-col items-center justify-center z-[9999]'
    errorDiv.innerHTML = `
      <div class="text-center p-8 max-w-lg">
        <div class="mb-6">
          <svg class="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-red-600 mb-4">Session Expired</h1>
        <p class="text-gray-700 mb-6">Your session has expired or you are not authorized to access this page. Please log in again.</p>
        <button onclick="window.location.href='/login'" class="bg-green-700 text-white px-6 py-2 rounded hover:bg-green-800">
          Back to Login
        </button>
      </div>
    `
    document.body.appendChild(errorDiv)
    next('/login')
    return
  }

  // Check department access
  if (to.matched.some((record) => record.meta.department)) {
    const userDepartment = authStore.currentUser?.department
    const isSuperAdmin = userDepartment === DEPARTMENTS.ADMIN

    console.log('User department:', userDepartment)
    console.log('Required department:', to.meta.department)

    // Check if user is super admin or if their department matches the required department
    const hasAccess = isSuperAdmin || userDepartment === to.meta.department

    if (!hasAccess) {
      // Show unauthorized page
      const errorDiv = document.createElement('div')
      errorDiv.className =
        'fixed inset-0 bg-white flex flex-col items-center justify-center z-[9999]'
      errorDiv.innerHTML = `
        <div class="text-center p-8 max-w-lg">
          <div class="mb-6">
            <svg class="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-red-600 mb-4">Unauthorized Access</h1>
          <p class="text-gray-700 mb-6">You do not have permission to access this department.</p>
          <button onclick="window.location.href='/login'" class="bg-green-700 text-white px-6 py-2 rounded hover:bg-green-800">
            Back to Login
          </button>
        </div>
      `
      document.body.appendChild(errorDiv)
      next('/login')
      return
    }
  }

  // Check route permissions
  if (to.matched.some((record) => record.meta.permissions)) {
    const requiredPermissions = to.matched.reduce((permissions, record) => {
      return record.meta.permissions ? [...permissions, ...record.meta.permissions] : permissions
    }, [])

    console.log('Required permissions:', requiredPermissions)
    console.log('User permissions:', authStore.userPermissions)

    const hasPermission = requiredPermissions.some(
      (permission) =>
        authStore.userPermissions.includes(permission) ||
        authStore.userPermissions.includes(PERMISSION_IDS.SCM_FULL_ACCESS),
    )

    if (!hasPermission) {
      // Show unauthorized page
      const errorDiv = document.createElement('div')
      errorDiv.className =
        'fixed inset-0 bg-white flex flex-col items-center justify-center z-[9999]'
      errorDiv.innerHTML = `
        <div class="text-center p-8 max-w-lg">
          <div class="mb-6">
            <svg class="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-red-600 mb-4">Unauthorized Access</h1>
          <p class="text-gray-700 mb-6">You do not have permission to access this feature.</p>
          <button onclick="window.location.href='/login'" class="bg-green-700 text-white px-6 py-2 rounded hover:bg-green-800">
            Back to Login
          </button>
        </div>
      `
      document.body.appendChild(errorDiv)
      next('/login')
      return
    }
  }

  next()
})

// Add this helper function to consistently map department names to routes
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

export default router
