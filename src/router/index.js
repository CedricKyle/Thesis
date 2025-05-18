import { createRouter, createWebHistory } from 'vue-router'
import AdminSidebar from '@/views/Admin/AdminSidebar.vue'
import UserRolesManagement from '@/views/Human Resource/UserRolesManagement.vue'
import CreateRoleForm from '@/components/Users & Role/Roles/CreateRoleForm.vue'
import HRDashboard from '@/views/Human Resource/HRDashboard.vue'
import Employees from '@/views/Human Resource/Employees.vue'
import Attendance from '@/views/Human Resource/Attendance.vue'
import AttendanceReport from '@/views/Human Resource/AttendanceReport.vue'
import EditRoleForm from '@/components/Users & Role/Roles/EditRoleForm.vue'
import LoginPage from '@/views/LoginPage.vue'
import FinanceDashboard from '@/views/Finance/FinanceDashboard.vue'
import FinanceReport from '@/views/Finance/FinanceReport.vue'
import SCMDashboard from '@/views/Supply Chain Management/SCMDashboard.vue'
import CRMDashboard from '@/views/CRM Department/CRMDashboard.vue'
import SalesDashboard from '@/views/Sales Department/SalesDashboard.vue'
import HRMSidebar from '@/views/Human Resource/HRMSidebar.vue'
import FinanceSideBar from '@/views/Finance/FinanceSideBar.vue'
import SalesSidebar from '@/views/Sales Department/SalesSidebar.vue'
import SCMSidebar from '@/views/Supply Chain Management/SCMSidebar.vue'
import CRMSidebar from '@/views/CRM Department/CRMASidebar.vue'
import ProductionSidebar from '@/views/Production Department/ProductionSidebar.vue'
import ProductionDashboard from '@/views/Production Department/ProductionDashboard.vue'
import { useRolesStore } from '@/stores/Users & Role/roleStore'
import { usePermissions } from '@/composables/Admin Composables/User & Role/role/usePermissions'
import SCMBranchDistributionManagement from '@/views/Supply Chain Management/SCMBranchDistributionManagement.vue'
import SCMInventoryManagement from '@/views/Supply Chain Management/SCMInventoryManagement.vue'
import SCMSupplierManagement from '@/views/Supply Chain Management/SCMSupplierManagement.vue'
import FinanceAccountingManagement from '@/views/Finance/FinanceAccountingManagement.vue'
import FinanceTreasuryManagement from '@/views/Finance/FinanceTreasuryManagement.vue'
import FinanceSalesManagement from '@/views/Finance/FinanceSalesManagement.vue'
import HRPayroll from '@/views/Human Resource/HRPayroll.vue'
import SCMRequestManagement from '@/views/Supply Chain Management/SCMRequestManagement.vue'
import SCMPurchaseOrderManagement from '@/views/Supply Chain Management/SCMPurchaseOrderManagement.vue'
import ProductionInventoryOverview from '@/views/Production Department/ProductionInventoryOverview.vue'
import ProductionDistribution from '@/views/Production Department/ProductionDistribution.vue'
import ProductionHistory from '@/views/Production Department/ProductionHistory.vue'
import ProductionBatchEntry from '@/views/Production Department/ProductionBatchEntry.vue'
import BranchOperation from '@/views/Branch Operation/BranchOperation.vue'
import BranchOperationDashboard from '@/views/Branch Operation/BranchOperationDashboard.vue'
import BranchOperationPOS from '@/views/Branch Operation/BranchOperationPOS.vue'
import BranchOperationSales from '@/views/Branch Operation/BranchOperationSales.vue'
import BranchOperationInventory from '@/views/Branch Operation/BranchOperationInventory.vue'
import BranchOperationEmployee from '@/views/Branch Operation/BranchOperationEmployee.vue'
import {
  PERMISSION_IDS,
  DEPARTMENTS,
} from '@/composables/Admin Composables/User & Role/role/permissionsId'
import { useAuthStore } from '@/stores/Authentication/authStore'
import { computed } from 'vue'

// Import CRM Page components
import MainLayout from '@/views/crm-page/layouts/MainLayout.vue'
import Home from '@/views/crm-page/pages/Home.vue'
import Menu from '@/views/crm-page/pages/Menu.vue'
import FoodGallery from '@/views/crm-page/pages/FoodGallery.vue'
import StoreDirectory from '@/views/crm-page/pages/StoreDirectory.vue'
import Feedbacks from '@/views/crm-page/pages/Feedbacks.vue'

const routes = [
  {
    path: '/',
    redirect: '/home',
  },
  // CRM Page Routes (Public)
  {
    path: '/',
    component: MainLayout,
    meta: {
      isPublic: true
    },
    children: [
      { 
        path: 'home', 
        name: 'Home', 
        component: Home,
        meta: {
          isPublic: true
        }
      },
      { 
        path: 'menu', 
        name: 'Menu', 
        component: Menu,
        meta: {
          isPublic: true
        }
      },
      { 
        path: 'food-gallery', 
        name: 'FoodGallery', 
        component: FoodGallery,
        meta: {
          isPublic: true
        }
      },
      { 
        path: 'store-directory', 
        name: 'StoreDirectory', 
        component: StoreDirectory,
        meta: {
          isPublic: true
        }
      },
      { 
        path: 'feedbacks', 
        name: 'Feedbacks', 
        component: Feedbacks,
        meta: {
          isPublic: true
        }
      }
    ]
  },
  // Admin Router
  {
    path: '/admin',
    component: AdminSidebar,
    children: [
      // Admin Human Resource Router
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
        path: 'hr/payroll',
        name: 'AdminHRPayroll',
        component: HRPayroll,
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
      // Admin Finance Router
      {
        path: 'finance/dashboard',
        name: 'AdminFinanceDashboard',
        component: FinanceDashboard,
      },
      {
        path: 'finance/report',
        name: 'AdminFinanceReport',
        component: FinanceReport,
      },
      {
        path: 'finance/treasury-management',
        name: 'AdminFinanceTreasuryManagement',
        component: FinanceTreasuryManagement,
      },
      {
        path: 'finance/accounting-management',
        name: 'AdminFinanceAccountingManagement',
        component: FinanceAccountingManagement,
      },
      {
        path: 'finance/sales-management',
        name: 'AdminFinanceSalesManagement',
        component: FinanceSalesManagement,
      },
      // Admin Supply Chain Management Router
      {
        path: 'inventory/dashboard',
        name: 'AdminSCMDashboard',
        component: SCMDashboard,
      },
      {
        path: 'inventory/inventory-management',
        name: 'AdminInventoryManagement',
        component: SCMInventoryManagement,
      },
      {
        path: 'inventory/request-management',
        name: 'AdminRequestManagement',
        component: SCMRequestManagement,
      },
      {
        path: 'inventory/branch-distribution-management',
        name: 'AdminBranchDistributionManagement',
        component: SCMBranchDistributionManagement,
      },
      {
        path: 'inventory/supplier-management',
        name: 'AdminSupplierManagement',
        component: SCMSupplierManagement,
      },
      {
        path: 'inventory/purchase-order-management',
        name: 'AdminPurchaseOrderManagement',
        component: SCMPurchaseOrderManagement,
      },
      // ADMIN CRM Router
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
      // Admin Production Router
      {
        path: 'production/dashboard',
        name: 'AdminProductionDashboard',
        component: ProductionDashboard,
      },

      {
        path: 'production/inventory-overview',
        name: 'AdminInventoryOverview',
        component: ProductionInventoryOverview,
      },
      {
        path: 'production/production-batch-entry',
        name: 'AdminProductionBatchEntry',
        component: ProductionBatchEntry,
      },
      {
        path: 'production/production-distribution',
        name: 'AdminProductionDistribution',
        component: ProductionDistribution,
      },
      {
        path: 'production/production-history',
        name: 'AdminProductionHistory',
        component: ProductionHistory,
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
        path: 'payroll',
        name: 'HRPayroll',
        component: HRPayroll,
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
        path: 'reports',
        name: 'FinanceReport',
        component: FinanceReport,
      },
      {
        path: 'treasury-management',
        name: 'FinanceTreasuryManagement',
        component: FinanceTreasuryManagement,
      },
      {
        path: 'accounting-management',
        name: 'FinanceAccountingManagement',
        component: FinanceAccountingManagement,
      },
      {
        path: 'sales-management',
        name: 'FinanceSalesManagement',
        component: FinanceSalesManagement,
      },
    ],
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
  },
  // Profile Route
  {
    path: '/profile',
    name: 'EmployeeProfile',
    component: () => import('@/views/Profile/EmployeeProfileView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Employee Profile'
    },
  },
  // Edit Personal Information Route
  {
    path: '/profile/edit',
    name: 'EditPersonalInfo',
    component: () => import('@/components/Employee Profile/EditPersonalInfo.vue'),
    meta: {
      requiresAuth: true,
      title: 'Edit Personal Information'
    },
  },
  // Settings Route
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/Profile/SettingsView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Account Settings'
    }
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
        path: 'inventory-management',
        name: 'SCMInventoryManagement',
        component: SCMInventoryManagement,
        meta: {
          permissions: [PERMISSION_IDS.SCM_MANAGE_INVENTORY_MANAGEMENT],
        },
      },
      {
        path: 'request-management',
        name: 'SCMRequestManagement',
        component: SCMRequestManagement,
        meta: {
          permissions: [PERMISSION_IDS.SCM_MANAGE_REQUEST_MANAGEMENT],
        },
      },
      {
        path: 'supplier-management',
        name: 'SCMSupplierManagement',
        component: SCMSupplierManagement,
        meta: {
          permissions: [PERMISSION_IDS.SCM_MANAGE_SUPPLIERS_MANAGEMENT],
        },
      },
      {
        path: 'purchase-order-management',
        name: 'SCMPurchaseOrderManagement',
        component: SCMPurchaseOrderManagement,
        meta: {
          permissions: [PERMISSION_IDS.SCM_MANAGE_PURCHASE_ORDER_MANAGEMENT],
        },
      },
      {
        path: 'branch-distribution-management',
        name: 'SCMBranchDistributionManagement',
        component: SCMBranchDistributionManagement,
        meta: {
          permissions: [PERMISSION_IDS.SCM_MANAGE_BRANCH_DISTRIBUTION_MANAGEMENT],
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
  // Production Router
  {
    path: '/production',
    component: ProductionSidebar,
    meta: {
      requiresAuth: true,
      department: DEPARTMENTS.PRODUCTION,
    },
    children: [
      {
        path: 'dashboard',
        name: 'ProductionDashboard',
        component: ProductionDashboard,
        meta: {
          permissions: [PERMISSION_IDS.PRODUCTION_VIEW_DASHBOARD],
        },
      },

      {
        path: 'inventory-overview',
        name: 'ProductionInventoryOverview',
        component: ProductionInventoryOverview,
        meta: {
          permissions: [PERMISSION_IDS.PRODUCTION_MANAGE_INVENTORY_OVERVIEW],
        },
      },
      {
        path: 'production-batch-entry',
        name: 'ProductionBatchEntry',
        component: ProductionBatchEntry,
        meta: {
          permissions: [PERMISSION_IDS.PRODUCTION_MANAGE_BATCH_ENTRY],
        },
      },
      {
        path: 'production-distribution',
        name: 'ProductionDistribution',
        component: ProductionDistribution,
        meta: {
          permissions: [PERMISSION_IDS.PRODUCTION_MANAGE_DISTRIBUTION],
        },
      },
      {
        path: 'production-history',
        name: 'ProductionHistory',
        component: ProductionHistory,
        meta: {
          permissions: [PERMISSION_IDS.PRODUCTION_MANAGE_HISTORY],
        },
      },
    ],
  },
  // Branch Operation Router
  {
    path: '/branch-operation',
    component: BranchOperation,
    children: [
      {
        path: '',
        redirect: '/branch-operation/dashboard',
      },
      {
        path: 'dashboard',
        name: 'BranchOperationDashboard',
        component: BranchOperationDashboard,
        meta: {
          permissions: [PERMISSION_IDS.BRANCH_OPERATION_VIEW_DASHBOARD],
        },
      },
      {
        path: 'pos',
        name: 'BranchOperationPOS',
        component: BranchOperationPOS,
        meta: {
          permissions: [PERMISSION_IDS.BRANCH_OPERATION_MANAGE_POS],
        },
      },
      {
        path: 'sales',
        name: 'BranchOperationSales',
        component: BranchOperationSales,
        meta: {
          permissions: [PERMISSION_IDS.BRANCH_OPERATION_MANAGE_SALES],
        },
      },
      {
        path: 'inventory',
        name: 'BranchOperationInventory',
        component: BranchOperationInventory,
        meta: {
          permissions: [PERMISSION_IDS.BRANCH_OPERATION_MANAGE_INVENTORY],
        },
      },
      {
        path: 'employee',
        name: 'BranchOperationEmployee',
        component: BranchOperationEmployee,
        meta: {
          permissions: [PERMISSION_IDS.BRANCH_OPERATION_MANAGE_EMPLOYEES],
        },
      },
    ],
  },

  // Access Denied Router 
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
  // Check if route is public
  const isPublicRoute = to.matched.some(record => record.meta.isPublic)
  const publicRoutes = ['/login', '/access-denied']

  if (isPublicRoute || publicRoutes.includes(to.path)) {
    next()
    return
  }

  const authStore = useAuthStore()
  const isAuthenticated = await authStore.checkAuth()
  const { isRoleChanged, isSessionExpired } = authStore.getRoleChangeStatus()

  console.log('Auth status:', { isAuthenticated, isRoleChanged, isSessionExpired })

  if (!isAuthenticated) {
    if (isRoleChanged) {
      // Show access denied page with role change message
      next({
        path: '/access-denied',
        query: {
          reason: 'role_changed',
          message: 'Your role has been modified. Please log in again with your new permissions.',
        },
      })
      return
    }

    if (isSessionExpired) {
      // Show access denied page with session expired message
      next({
        path: '/access-denied',
        query: {
          reason: 'session_expired',
          message: 'Your session has expired. Please log in again.',
        },
      })
      return
    }

    // Default unauthorized access
    next({
      path: '/access-denied',
      query: {
        reason: 'unauthorized',
        message: 'You are not authorized to access this page.',
      },
    })
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
      // Instead of directly appending to body and redirecting, use the access-denied route
      next('/access-denied')
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
        authStore.userPermissions.includes(PERMISSION_IDS.ADMIN_FULL_ACCESS) ||
        authStore.userPermissions.includes(PERMISSION_IDS.SCM_FULL_ACCESS),
    )

    if (!hasPermission) {
      // Instead of directly appending to body and redirecting, use the access-denied route
      next('/access-denied')
      return
    }
  }

  next()
})

// Add this helper function to consistently map department names to routes
function getDepartmentPath(department) {
  if (!department) return ''

  const deptMap = {
    'Admin Department': 'admin',
    'HR Department': 'hr',
    'Finance Department': 'finance',
    'Sales Department': 'sales',
    'Supply Chain Management': 'scm',
    'Customer Relationship Management': 'crm',
  }

  return deptMap[department] || department.toLowerCase().split(' ')[0]
}

export default router
