export const DEPARTMENTS = {
  ADMIN: 'Super Admin',
  HR: 'Human Resource',
  FINANCE: 'Finance',
  SALES: 'Sales',
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

  // Finance Department Permissions
  FINANCE_FULL_ACCESS: 8,
  FINANCE_VIEW_DASHBOARD: 9,
  FINANCE_MANAGE_PAYROLL: 10,
  FINANCE_VIEW_REPORTS: 11,

  // Sales Department Permissions
  SALES_FULL_ACCESS: 12,
  SALES_VIEW_DASHBOARD: 13,

  // SCM Department Permissions
  SCM_FULL_ACCESS: 14,
  SCM_VIEW_STOCKS: 15,

  // CRM Department Permissions
  CRM_FULL_ACCESS: 16,
  CRM_VIEW_DASHBOARD: 17,
}

export const permissionGroups = [
  {
    department: DEPARTMENTS.ADMIN,
    name: 'Super Admin',
    permissions: [{ id: PERMISSION_IDS.ADMIN_FULL_ACCESS, name: 'Full Access' }],
  },
  {
    department: DEPARTMENTS.HR,
    name: 'HR Management',
    permissions: [
      { id: PERMISSION_IDS.HR_FULL_ACCESS, name: 'Full Access' },
      { id: PERMISSION_IDS.HR_VIEW_DASHBOARD, name: 'View Dashboard' },
      { id: PERMISSION_IDS.HR_MANAGE_EMPLOYEES, name: 'Manage Employees' },
      { id: PERMISSION_IDS.HR_MANAGE_ATTENDANCE, name: 'Manage Attendance' },
      { id: PERMISSION_IDS.HR_VIEW_ATTENDANCE_REPORT, name: 'View Attendance Report' },
      { id: PERMISSION_IDS.HR_MANAGE_ROLES, name: 'Manage Roles' },
    ],
  },
  {
    department: DEPARTMENTS.FINANCE,
    name: 'Finance Management',
    permissions: [
      { id: PERMISSION_IDS.FINANCE_FULL_ACCESS, name: 'Full Access' },
      { id: PERMISSION_IDS.FINANCE_VIEW_DASHBOARD, name: 'View Dashboard' },
      { id: PERMISSION_IDS.FINANCE_MANAGE_PAYROLL, name: 'Manage Payroll' },
      { id: PERMISSION_IDS.FINANCE_VIEW_REPORTS, name: 'View Reports' },
    ],
  },
  {
    department: DEPARTMENTS.SALES,
    name: 'Sales Management',
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
      { id: PERMISSION_IDS.SCM_VIEW_STOCKS, name: 'View Stocks' },
    ],
  },
  {
    department: DEPARTMENTS.CRM,
    name: 'CRM Management',
    permissions: [
      { id: PERMISSION_IDS.CRM_FULL_ACCESS, name: 'Full Access' },
      { id: PERMISSION_IDS.CRM_VIEW_DASHBOARD, name: 'View Dashboard' },
    ],
  },
]
