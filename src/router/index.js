import { createRouter, createWebHistory } from 'vue-router'
import AdminSidebar from '@/views/Admin/AdminSidebar.vue'
import UserRolesManagement from '@/views/Users Management/UserRolesManagement.vue'
import CreateRoleForm from '@/components/Users & Role/Roles/CreateRoleForm.vue'
import UserManagement from '@/views/Users Management/UserManagement.vue'
import FinancialManagement from '@/views/Admin/FinancialManagement.vue'
import SalesManagement from '@/views/Admin/SalesManagement.vue'
import InventoryManagement from '@/views/Admin/InventoryManagement.vue'
import CRMManagement from '@/views/Admin/CRMManagement.vue'
import HRDashboard from '@/views/Human Resource/HRDashboard.vue'
import Employees from '@/views/Human Resource/Employees.vue'
import Attendance from '@/views/Human Resource/Attendance.vue'
import AttendanceReport from '@/views/Human Resource/AttendanceReport.vue'

const routes = [
  {
    path: '/',
    component: AdminSidebar,
    children: [
      {
        path: '',
        redirect: '/roles',
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
        path: 'users',
        name: 'Users',
        component: UserManagement,
      },
      {
        path: 'finance',
        name: 'Finance',
        component: FinancialManagement,
      },
      {
        path: 'sales',
        name: 'Sales',
        component: SalesManagement,
      },
      {
        path: 'inventory',
        name: 'Inventory',
        component: InventoryManagement,
      },
      {
        path: 'crm',
        name: 'CRM',
        component: CRMManagement,
      },
      {
        path: 'hr/dashboard',
        name: 'HRDashboard',
        component: HRDashboard,
      },
      {
        path: 'hr/employees',
        name: 'Employees',
        component: Employees,
      },
      {
        path: 'hr/attendance',
        name: 'Attendance',
        component: Attendance,
      },
      {
        path: 'hr/attendance-report',
        name: 'AttendanceReport',
        component: AttendanceReport,
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Add navigation guards for debugging
router.beforeEach((to, from, next) => {
  console.log('Navigation started:', { from: from.path, to: to.path })
  next()
})

router.afterEach((to, from) => {
  console.log('Navigation completed:', { from: from.path, to: to.path })
})

export default router
