export const DEPARTMENTS = {
  ADMIN: 'Admin Department',
  HR: 'HR Department',
  FINANCE: 'Finance Department',
  SCM: 'Supply Chain Management',
  CRM: 'Customer Relationship Management',
  BRANCH_OPERATION: 'Branch Operation',
  PROCUREMENT: 'Procurement Department',
}

export const PERMISSION_IDS = {
  // Admin Department Permissions
  ADMIN_FULL_ACCESS: 1,

  // HR Department Permissions
  HR_FULL_ACCESS: 2,
  HR_VIEW_DASHBOARD: 3,
  HR_MANAGE_EMPLOYEES: 4,
  HR_MANAGE_ATTENDANCE: 5,
  HR_VIEW_ATTENDANCE_REPORT: 6,
  HR_MANAGE_ROLES: 7,
  HR_MANAGE_PAYROLL: 26,

  // Finance Department Permissions
  FINANCE_FULL_ACCESS: 8,
  FINANCE_VIEW_DASHBOARD: 9,
  // FINANCE_MANAGE_PAYROLL: 10,
  FINANCE_VIEW_REPORTS: 11,
  // FINANCE_MANAGE_TAX_MANAGEMENT: 23,
  FINANCE_MANAGE_TREASURY_MANAGEMENT: 24,
  FINANCE_MANAGE_ACCOUNTING_MANAGEMENT: 25,
  FINANCE_MANAGE_SALES_MANAGEMENT: 29,

  // Sales Department Permissions
  SALES_FULL_ACCESS: 12,
  SALES_VIEW_DASHBOARD: 13,

  // SCM Department Permissions
  SCM_FULL_ACCESS: 14,
  // SCM_VIEW_STOCKS: 15,
  SCM_VIEW_DASHBOARD: 16,
  SCM_MANAGE_INVENTORY_MANAGEMENT: 19,
  SCM_MANAGE_SUPPLIERS_MANAGEMENT: 20,
  SCM_MANAGE_PURCHASE_MANAGEMENT: 21,
  SCM_MANAGE_BRANCH_DISTRIBUTION_MANAGEMENT: 22,

  // CRM Department Permissions
  CRM_FULL_ACCESS: 17,
  CRM_VIEW_DASHBOARD: 18,

  // Branch Operation Permissions
  BRANCH_OPERATION_FULL_ACCESS: 27,
  BRANCH_OPERATION_MANAGE_REQUESTS_MODULE: 28,
  BRANCH_OPERATION_VIEW_DASHBOARD: 30,

  // Procurement Department Permissions
  PROCUREMENT_FULL_ACCESS: 31,
  PROCUREMENT_VIEW_DASHBOARD: 32,
  PROCUREMENT_MANAGE_SUPPLIERS_MANAGEMENT: 33,
  PROCUREMENT_MANAGE_PURCHASE_ORDER_MANAGEMENT: 34,
}

export const permissionGroups = [
  {
    department: DEPARTMENTS.ADMIN,
    name: 'Admin Department',
    permissions: [{ id: PERMISSION_IDS.ADMIN_FULL_ACCESS, name: 'Full Access' }],
  },
  {
    department: DEPARTMENTS.HR,
    name: 'HR Department',
    permissions: [
      { id: PERMISSION_IDS.HR_FULL_ACCESS, name: 'Full Access' },
      { id: PERMISSION_IDS.HR_VIEW_DASHBOARD, name: 'View Dashboard' },
      { id: PERMISSION_IDS.HR_MANAGE_EMPLOYEES, name: 'Manage Employees' },
      { id: PERMISSION_IDS.HR_MANAGE_ATTENDANCE, name: 'Manage Attendance' },
      { id: PERMISSION_IDS.HR_VIEW_ATTENDANCE_REPORT, name: 'View Attendance Report' },
      { id: PERMISSION_IDS.HR_MANAGE_ROLES, name: 'Manage Roles' },
      { id: PERMISSION_IDS.HR_MANAGE_PAYROLL, name: 'Manage Payroll' },
    ],
  },
  {
    department: DEPARTMENTS.FINANCE,
    name: 'Finance Department',
    permissions: [
      { id: PERMISSION_IDS.FINANCE_FULL_ACCESS, name: 'Full Access' },
      { id: PERMISSION_IDS.FINANCE_VIEW_DASHBOARD, name: 'View Dashboard' },
      { id: PERMISSION_IDS.FINANCE_VIEW_REPORTS, name: 'View Reports' },
      { id: PERMISSION_IDS.FINANCE_MANAGE_TREASURY_MANAGEMENT, name: 'Manage Treasury Management' },
      {
        id: PERMISSION_IDS.FINANCE_MANAGE_ACCOUNTING_MANAGEMENT,
        name: 'Manage Accounting Management',
      },
      {
        id: PERMISSION_IDS.FINANCE_MANAGE_SALES_MANAGEMENT,
        name: 'Manage Sales Management',
      },
    ],
  },
  {
    department: DEPARTMENTS.SCM,
    name: 'Supply Chain Management',
    permissions: [
      { id: PERMISSION_IDS.SCM_FULL_ACCESS, name: 'Full Access' },
      { id: PERMISSION_IDS.SCM_VIEW_DASHBOARD, name: 'View Dashboard' },
      { id: PERMISSION_IDS.SCM_MANAGE_INVENTORY_MANAGEMENT, name: 'Manage Inventory Management' },
      { id: PERMISSION_IDS.SCM_MANAGE_SUPPLIERS_MANAGEMENT, name: 'Manage Suppliers Management' },
      { id: PERMISSION_IDS.SCM_MANAGE_PURCHASE_MANAGEMENT, name: 'Manage Purchase Management' },
      {
        id: PERMISSION_IDS.SCM_MANAGE_BRANCH_DISTRIBUTION_MANAGEMENT,
        name: 'Manage Branch Distribution Management',
      },
    ],
  },
  {
    department: DEPARTMENTS.CRM,
    name: 'Customer Relationship Management',
    permissions: [
      { id: PERMISSION_IDS.CRM_FULL_ACCESS, name: 'Full Access' },
      { id: PERMISSION_IDS.CRM_VIEW_DASHBOARD, name: 'View Dashboard' },
    ],
  },
  {
    department: DEPARTMENTS.BRANCH_OPERATION,
    name: 'Branch Operation',
    permissions: [
      { id: PERMISSION_IDS.BRANCH_OPERATION_FULL_ACCESS, name: 'Full Access' },
      {
        id: PERMISSION_IDS.BRANCH_OPERATION_MANAGE_REQUESTS_MODULE,
        name: 'Manage Requests Module',
      },
      {
        id: PERMISSION_IDS.BRANCH_OPERATION_VIEW_DASHBOARD,
        name: 'View Dashboard',
      },
    ],
  },
  {
    department: DEPARTMENTS.PROCUREMENT,
    name: 'Procurement',
    permissions: [
      { id: PERMISSION_IDS.PROCUREMENT_FULL_ACCESS, name: 'Full Access' },
      { id: PERMISSION_IDS.PROCUREMENT_VIEW_DASHBOARD, name: 'View Dashboard' },
      {
        id: PERMISSION_IDS.PROCUREMENT_MANAGE_SUPPLIERS_MANAGEMENT,
        name: 'Manage Suppliers Management',
      },
      {
        id: PERMISSION_IDS.PROCUREMENT_MANAGE_PURCHASE_ORDER_MANAGEMENT,
        name: 'Manage Purchase Order Management',
      },
    ],
  },
]
