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
} from 'lucide-vue-next'

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

  // Complete menu configuration for all departments
  const menuConfig = {
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
        name: 'Payroll',
        route: '/finance/payroll',
        icon: Wallet,
        permission: PERMISSION_IDS.FINANCE_MANAGE_PAYROLL,
      },
      {
        name: 'Reports',
        route: '/finance/report',
        icon: FileText,
        permission: PERMISSION_IDS.FINANCE_VIEW_REPORTS,
      },
      {
        name: 'Tax',
        route: '/finance/tax-management',
        icon: FileText,
        permission: PERMISSION_IDS.FINANCE_MANAGE_TAX_MANAGEMENT,
      },
      {
        name: 'Treasury',
        route: '/finance/treasury-management',
        icon: FileText,
        permission: PERMISSION_IDS.FINANCE_MANAGE_TREASURY_MANAGEMENT,
      },
      {
        name: 'Accounting',
        route: '/finance/accounting-management',
        icon: FileText,
        permission: PERMISSION_IDS.FINANCE_MANAGE_ACCOUNTING_MANAGEMENT,
      },
    ],
    [DEPARTMENTS.SALES]: [
      {
        name: 'Dashboard',
        route: '/sales/dashboard',
        icon: LayoutDashboard,
        permission: PERMISSION_IDS.SALES_VIEW_DASHBOARD,
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
        name: 'Stocks',
        route: '/scm/stocks',
        icon: Package,
        permission: PERMISSION_IDS.SCM_VIEW_STOCKS,
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
          Payroll: {
            route: '/admin/finance/payroll',
          },
          'Finance Report': {
            route: '/admin/finance/report',
          },
          Tax: {
            route: '/admin/finance/tax-management',
          },
          Treasury: {
            route: '/admin/finance/treasury-management',
          },
          Accounting: {
            route: '/admin/finance/accounting-management',
          },
        },
      },
      'Sales Management': {
        icon: ChartNoAxesColumnIncreasing,
        submenu: {
          Dashboard: {
            route: '/admin/sales/dashboard',
          },
        },
      },
      'Supply Chain Management': {
        icon: Archive,
        submenu: {
          Dashboard: {
            route: '/admin/inventory/dashboard',
          },
          Stocks: {
            route: '/admin/inventory/stocks',
          },
          'Inventory ': {
            route: '/admin/inventory/inventory-management',
          },
          'Supplier ': {
            route: '/admin/inventory/supplier-management',
          },
          'Purchase ': {
            route: '/admin/inventory/purchase-management',
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
