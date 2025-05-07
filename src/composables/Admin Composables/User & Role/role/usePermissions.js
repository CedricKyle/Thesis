import { computed } from 'vue'
import {
  PERMISSION_IDS,
  DEPARTMENTS,
} from '@/composables/Admin Composables/User & Role/role/permissionsId'
import { useRolesStore } from '@/stores/Users & Role/roleStore'
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  FileText,
  Shield,
  Wallet,
  ShoppingCart,
  Package,
  Truck,
  UserCheck,
  Mail,
  BarChart,
  Building2,
  Landmark,
  ChartNoAxesColumnIncreasing,
  Archive,
  Store,
} from 'lucide-vue-next'

export const menuConfig = {
  [DEPARTMENTS.HR]: [
    {
      name: 'Dashboard',
      route: '/hr/dashboard',
      icon: LayoutDashboard,
      permission: PERMISSION_IDS.HR_VIEW_DASHBOARD,
    },
    {
      name: 'Employees',
      route: '/hr/employees',
      icon: Users,
      permission: PERMISSION_IDS.HR_MANAGE_EMPLOYEES,
    },
    {
      name: 'Attendance',
      route: '/hr/attendance',
      icon: CalendarCheck,
      permission: PERMISSION_IDS.HR_MANAGE_ATTENDANCE,
    },
    {
      name: 'Attendance Report',
      route: '/hr/attendance-report',
      icon: FileText,
      permission: PERMISSION_IDS.HR_VIEW_ATTENDANCE_REPORT,
    },
    {
      name: 'Payroll',
      route: '/hr/payroll',
      icon: Wallet,
      permission: PERMISSION_IDS.HR_MANAGE_PAYROLL,
    },
    {
      name: 'Roles',
      route: '/hr/roles',
      icon: Shield,
      permission: PERMISSION_IDS.HR_MANAGE_ROLES,
    },
  ],
  [DEPARTMENTS.FINANCE]: [
    {
      name: 'Dashboard',
      route: '/finance/dashboard',
      icon: LayoutDashboard,
      permission: PERMISSION_IDS.FINANCE_VIEW_DASHBOARD,
    },
    {
      name: 'Accounting',
      route: '/finance/accounting-management',
      icon: FileText,
      permission: PERMISSION_IDS.FINANCE_MANAGE_ACCOUNTING_MANAGEMENT,
    },
    {
      name: 'Treasury',
      route: '/finance/treasury-management',
      icon: FileText,
      permission: PERMISSION_IDS.FINANCE_MANAGE_TREASURY_MANAGEMENT,
    },
    {
      name: 'Reports',
      route: '/finance/report',
      icon: FileText,
      permission: PERMISSION_IDS.FINANCE_VIEW_REPORTS,
    },
    {
      name: 'Sales Management',
      route: '/finance/sales-management',
      icon: ChartNoAxesColumnIncreasing,
      permission: PERMISSION_IDS.FINANCE_MANAGE_SALES_MANAGEMENT,
    },
  ],
  [DEPARTMENTS.SCM]: [
    {
      name: 'Dashboard',
      route: '/scm/dashboard',
      icon: LayoutDashboard,
      permission: PERMISSION_IDS.SCM_VIEW_DASHBOARD,
    },
    {
      name: 'Inventory Management',
      route: '/scm/inventory-management',
      icon: Package,
      permission: PERMISSION_IDS.SCM_MANAGE_INVENTORY_MANAGEMENT,
    },
    {
      name: 'Supplier Management',
      route: '/scm/supplier-management',
      icon: Users,
      permission: PERMISSION_IDS.SCM_MANAGE_SUPPLIERS_MANAGEMENT,
    },
    {
      name: 'Purchase Management',
      route: '/scm/purchase-management',
      icon: ShoppingCart,
      permission: PERMISSION_IDS.SCM_MANAGE_PURCHASE_MANAGEMENT,
    },
    {
      name: 'Branch Distribution Management',
      route: '/scm/branch-distribution-management',
      icon: Truck,
      permission: PERMISSION_IDS.SCM_MANAGE_BRANCH_DISTRIBUTION_MANAGEMENT,
    },
  ],
  [DEPARTMENTS.CRM]: [
    {
      name: 'Dashboard',
      route: '/crm/dashboard',
      icon: LayoutDashboard,
      permission: PERMISSION_IDS.CRM_VIEW_DASHBOARD,
    },
  ],
  [DEPARTMENTS.BRANCH_OPERATION]: [
    {
      name: 'Request Module',
      route: '/branch-operation/request-module',
      icon: Store,
      permission: PERMISSION_IDS.BRANCH_OPERATION_MANAGE_REQUESTS_MODULE,
    },
    {
      name: 'Dashboard',
      route: '/branch-operation/dashboard',
      icon: LayoutDashboard,
      permission: PERMISSION_IDS.BRANCH_OPERATION_VIEW_DASHBOARD,
    },
  ],
  [DEPARTMENTS.PROCUREMENT]: [
    {
      name: 'Dashboard',
      route: '/procurement/dashboard',
      icon: LayoutDashboard,
      permission: PERMISSION_IDS.PROCUREMENT_VIEW_DASHBOARD,
    },
    {
      name: 'Purchase Order Management',
      route: '/procurement/purchase-order-management',
      icon: ShoppingCart,
      permission: PERMISSION_IDS.PROCUREMENT_MANAGE_PURCHASE_ORDER_MANAGEMENT,
    },
    {
      name: 'Supplier Management',
      route: '/procurement/supplier-management',
      icon: Users,
      permission: PERMISSION_IDS.PROCUREMENT_MANAGE_SUPPLIERS_MANAGEMENT,
    },
  ],
  [DEPARTMENTS.ADMIN]: [
    {
      name: 'HR Dashboard',
      route: '/admin/hr/dashboard',
      permission: PERMISSION_IDS.ADMIN_FULL_ACCESS,
    },
  ],
}

export function getFirstAccessibleRoute(department, userPermissions) {
  // Super Admin shortcut
  if (
    department === DEPARTMENTS.ADMIN ||
    userPermissions.includes(PERMISSION_IDS.ADMIN_FULL_ACCESS)
  ) {
    return '/admin/hr/dashboard'
  }
  const menu = menuConfig[department] || []
  for (const item of menu) {
    if (userPermissions.includes(item.permission)) {
      return item.route
    }
  }
  // fallback: login
  return '/login'
}

export function usePermissions(employeeRole) {
  const rolesStore = useRolesStore()

  const isSuperAdmin = computed(() => {
    if (!employeeRole.value) return false

    // Check multiple conditions for Super Admin
    return (
      employeeRole.value.permissions?.includes(PERMISSION_IDS.ADMIN_FULL_ACCESS) ||
      employeeRole.value.role_name === 'Super Admin' ||
      (employeeRole.value.role && employeeRole.value.role.role_name === 'Super Admin') ||
      employeeRole.value.department === DEPARTMENTS.ADMIN
    )
  })

  const isDepartmentManager = computed(() => {
    if (!employeeRole?.department) return false

    const fullAccessPermissions = {
      [DEPARTMENTS.HR]: PERMISSION_IDS.HR_FULL_ACCESS,
      [DEPARTMENTS.FINANCE]: PERMISSION_IDS.FINANCE_FULL_ACCESS,
      [DEPARTMENTS.SALES]: PERMISSION_IDS.SALES_FULL_ACCESS,
      [DEPARTMENTS.SCM]: PERMISSION_IDS.SCM_FULL_ACCESS,
      [DEPARTMENTS.CRM]: PERMISSION_IDS.CRM_FULL_ACCESS,
      [DEPARTMENTS.PROCUREMENT]: PERMISSION_IDS.PROCUREMENT_FULL_ACCESS,
      [DEPARTMENTS.BRANCH_OPERATION]: PERMISSION_IDS.BRANCH_OPERATION_FULL_ACCESS,
    }

    return employeeRole.value.permissions.includes(
      fullAccessPermissions[employeeRole.value.department],
    )
  })

  const hasPermission = (permissionId) => {
    if (!employeeRole.value?.permissions) return false

    // Super Admin always has all permissions
    if (isSuperAdmin.value) return true

    // Check for full access first
    if (employeeRole.value.permissions.includes(PERMISSION_IDS.HR_FULL_ACCESS)) {
      // If checking for an HR permission and user has HR_FULL_ACCESS, grant it
      if (
        Object.keys(PERMISSION_IDS).some(
          (key) => key.startsWith('HR_') && PERMISSION_IDS[key] === permissionId,
        )
      ) {
        return true
      }
    }

    return employeeRole.value.permissions.includes(permissionId)
  }

  const canAccessDepartment = (department) => {
    if (!employeeRole.value?.permissions || !employeeRole.value?.department) return false
    if (isSuperAdmin.value) return true
    return employeeRole.value.department === department
  }

  const getVisibleMenuItems = (department) => {
    const departmentMenu = menuConfig[department]
    if (!departmentMenu) return []
    return departmentMenu.filter((item) => hasPermission(item.permission))
  }

  const getAdminMenuItems = () => {
    return {
      'Human Resource': {
        icon: Building2,
        submenu: {
          Dashboard: {
            route: '/admin/hr/dashboard',
          },
          Employees: {
            route: '/admin/hr/employees',
          },
          Attendance: {
            route: '/admin/hr/attendance',
          },
          'Attendance Report': {
            route: '/admin/hr/attendance-report',
          },
          Payroll: {
            route: '/admin/hr/payroll',
          },
          Roles: {
            route: '/admin/hr/roles',
          },
        },
      },
      Finance: {
        icon: Landmark,
        submenu: {
          Dashboard: {
            route: '/admin/finance/dashboard',
          },
          'Finance Report': {
            route: '/admin/finance/report',
          },
          Treasury: {
            route: '/admin/finance/treasury-management',
          },
          Accounting: {
            route: '/admin/finance/accounting-management',
          },
          'Sales Management': {
            route: '/admin/finance/sales-management',
          },
        },
      },
      'Supply Chain Management': {
        icon: Archive,
        submenu: {
          Dashboard: {
            route: '/admin/inventory/dashboard',
          },
          'Inventory ': {
            route: '/admin/inventory/inventory-management',
          },
          'Request Management': {
            route: '/admin/inventory/request-management',
          },
          'Branch Distribution': {
            route: '/admin/inventory/branch-distribution-management',
          },
        },
      },
      'Customer Service Management': {
        icon: Mail,
        submenu: {
          Dashboard: {
            route: '/admin/crm/dashboard',
          },
        },
      },
      Procurement: {
        icon: ShoppingCart,
        submenu: {
          Dashboard: {
            route: '/admin/procurement/dashboard',
          },
          'Purchase Order': {
            route: '/admin/procurement/purchase-order-management',
          },
          Supplier: {
            route: '/admin/procurement/supplier-management',
          },
        },
      },
      'Branch Operation': {
        icon: Store,
        submenu: {
          Dashboard: {
            route: '/admin/branch-operation/dashboard',
          },
          'Request Module': {
            route: '/admin/branch-operation/request-module',
          },
        },
      },
    }
  }

  return {
    isSuperAdmin,
    isDepartmentManager,
    hasPermission,
    canAccessDepartment,
    getVisibleMenuItems,
    getAdminMenuItems,
  }
}
