export const DEPARTMENTS = {
  ADMIN: 'Admin Department',
  HR: 'HR Department',
  FINANCE: 'Finance Department',
  SALES: 'Sales Department',
  SCM: 'Supply Chain Management',
  CRM: 'Customer Relationship Management',
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
    ],
  },
  {
    department: DEPARTMENTS.SALES,
    name: 'Sales Department',
    permissions: [
      { id: PERMISSION_IDS.SALES_FULL_ACCESS, name: 'Full Access' },
      { id: PERMISSION_IDS.SALES_VIEW_DASHBOARD, name: 'View Dashboard' },
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
]
