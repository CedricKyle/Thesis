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
import BaseProductTable from '@/views/Suppy Chain Management Department/BaseProductTable.vue'
import SCMDashboard from '@/views/Suppy Chain Management Department/SCMDashboard.vue'
import StockView from '@/views/Suppy Chain Management Department/StockView.vue'
import CRMDashboard from '@/views/CRM Department/CRMDashboard.vue'
import SalesDashboard from '@/views/Sales Department/SalesDashboard.vue'
import HRMSidebar from '@/views/Human Resource/HRMSidebar.vue'
import FinanceSideBar from '@/views/Finance/FinanceSideBar.vue'
import SalesSidebar from '@/views/Sales Department/SalesSidebar.vue'
import SCMSidebar from '@/views/Suppy Chain Management Department/SCMSidebar.vue'
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
        path: 'report',
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
    children: [
      {
        path: '',
        redirect: '/sales/dashboard',
      },
      {
        path: 'dashboard',
        name: 'SalesDashboard',
        component: SalesDashboard,
      },
    ],
  },
  // Supply Chain Management Router
  {
    path: '/scm',
    component: SCMSidebar,
    children: [
      {
        path: '',
        redirect: '/scm/dashboard',
      },
      {
        path: 'dashboard',
        name: 'SCMDashboard',
        component: SCMDashboard,
      },
      {
        path: 'stocks',
        name: 'SCMStocks',
        component: StockView,
      },
    ],
  },
  // CRM Router
  {
    path: '/crm',
    component: CRMSidebar,
    children: [
      {
        path: '',
        redirect: '/crm/dashboard',
      },
      {
        path: 'dashboard',
        name: 'CRMDashboard',
        component: CRMDashboard,
      },
    ],
  },
  {
    path: '/access-denied',
    name: 'AccessDenied',
    component: () => import('@/components/common/AccessDenied.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Always allow access to login and access-denied pages
  if (to.path === '/login' || to.path === '/access-denied') {
    if (to.path === '/login' && authStore.isAuthenticated) {
      // If authenticated, redirect to appropriate dashboard
      const department = getDepartmentPath(authStore.currentUser?.department)
      next(`/${department}/dashboard`)
      return
    }
    next()
    return
  }

  // Check if user is authenticated
  if (!authStore.isAuthenticated) {
    next('/login')
    return
  }

  // Get user's department path
  const userDepartment = getDepartmentPath(authStore.currentUser?.department)

  // Check if user is trying to access their own department
  if (!to.path.startsWith(`/${userDepartment}`)) {
    next('/access-denied')
    return
  }

  // Allow the navigation
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
