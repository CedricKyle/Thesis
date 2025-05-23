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
  Factory,
  HandPlatter,
  ScrollText,
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
      name: 'Purchase Order Management',
      route: '/scm/purchase-order-management',
      icon: ShoppingCart,
      permission: PERMISSION_IDS.SCM_MANAGE_PURCHASE_ORDER_MANAGEMENT,
    },
    {
      name: 'Branch Distribution Management',
      route: '/scm/branch-distribution-management',
      icon: Truck,
      permission: PERMISSION_IDS.SCM_MANAGE_BRANCH_DISTRIBUTION_MANAGEMENT,
    },
    {
      name: 'Request Management',
      route: '/scm/request-management',
      icon: FileText,
      permission: PERMISSION_IDS.SCM_MANAGE_REQUEST_MANAGEMENT,
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
  [DEPARTMENTS.PRODUCTION]: [
    {
      name: 'Dashboard',
      route: '/production/dashboard',
      icon: LayoutDashboard,
      permission: PERMISSION_IDS.PRODUCTION_VIEW_DASHBOARD,
    },
    {
      name: 'Inventory Overview',
      route: '/production/inventory-overview',
      icon: Package,
      permission: PERMISSION_IDS.PRODUCTION_MANAGE_INVENTORY_OVERVIEW,
    },
    {
      name: 'Production Batch Entry',
      route: '/production/production-batch-entry',
      icon: HandPlatter,
      permission: PERMISSION_IDS.PRODUCTION_MANAGE_BATCH_ENTRY,
    },
    {
      name: 'Production Distribution',
      route: '/production/production-distribution',
      icon: Truck,
      permission: PERMISSION_IDS.PRODUCTION_MANAGE_DISTRIBUTION,
    },
    {
      name: 'Production History',
      route: '/production/production-history',
      icon: ScrollText,
      permission: PERMISSION_IDS.PRODUCTION_MANAGE_HISTORY,
    },
  ],
  [DEPARTMENTS.BRANCH_OPERATION]: [
    {
      name: 'Dashboard',
      route: '/branch-operation/dashboard',
      icon: LayoutDashboard,
      permission: PERMISSION_IDS.BRANCH_OPERATION_VIEW_DASHBOARD,
    },
    {
      name: 'POS',
      route: '/branch-operation/pos',
      icon: ShoppingCart,
      permission: PERMISSION_IDS.BRANCH_OPERATION_MANAGE_POS,
    },
    {
      name: 'Sales',
      route: '/branch-operation/sales',
      icon: ShoppingCart,
      permission: PERMISSION_IDS.BRANCH_OPERATION_MANAGE_SALES,
    },
    {
      name: 'Inventory',
      route: '/branch-operation/inventory',
      icon: Package,
      permission: PERMISSION_IDS.BRANCH_OPERATION_MANAGE_INVENTORY,
    },
    {
      name: 'Employees',
      route: '/branch-operation/employee',
      icon: Users,
      permission: PERMISSION_IDS.BRANCH_OPERATION_MANAGE_EMPLOYEES,
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
      [DEPARTMENTS.SCM]: PERMISSION_IDS.SCM_FULL_ACCESS,
      [DEPARTMENTS.CRM]: PERMISSION_IDS.CRM_FULL_ACCESS,
      [DEPARTMENTS.PRODUCTION]: PERMISSION_IDS.PRODUCTION_FULL_ACCESS,
      [DEPARTMENTS.ADMIN]: PERMISSION_IDS.ADMIN_FULL_ACCESS,
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
      'Supply Chain': {
        icon: Archive,
        submenu: {
          Dashboard: {
            route: '/admin/inventory/dashboard',
          },
          'Inventory ': {
            route: '/admin/inventory/inventory-management',
          },
          'Purchase Order': {
            route: '/admin/inventory/purchase-order-management',
          },
          'Request Management': {
            route: '/admin/inventory/request-management',
          },
          'Supplier Management': {
            route: '/admin/inventory/supplier-management',
          },
          'Branch Distribution': {
            route: '/admin/inventory/branch-distribution-management',
          },
        },
      },
      Production: {
        icon: Factory,
        submenu: {
          Dashboard: {
            route: '/admin/production/dashboard',
          },

          'Inventory Overview': {
            route: '/admin/production/inventory-overview',
          },
          'Production Batch Entry': {
            route: '/admin/production/production-batch-entry',
          },
          'Production Distribution': {
            route: '/admin/production/production-distribution',
          },
          'Production History': {
            route: '/admin/production/production-history',
          },
        },
      },
      'Customer Service': {
        icon: Mail,
        submenu: {
          Dashboard: {
            route: '/admin/crm/dashboard',
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
