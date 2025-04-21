export const DEPARTMENTS = {
  ADMIN: 'Super Admin',
  HR: 'Human Resource',
  FINANCE: 'Finance',
  SALES: 'Sales',
  SCM: 'Supply Chain Management',
  CRM: 'Customer Relationship Management',
}

export const PERMISSION_IDS = {
  // Admin Department Permissions (1-10)
  ADMIN_FULL_ACCESS: 1,
  ADMIN_VIEW_DASHBOARD: 2,
  ADMIN_MANAGE_ROLES: 3,
  ADMIN_MANAGE_DEPARTMENTS: 4,
  ADMIN_VIEW_REPORTS: 5,

  // HR Department Permissions (11-20)
  HR_FULL_ACCESS: 11,
  HR_VIEW_DASHBOARD: 12,
  HR_MANAGE_EMPLOYEES: 13,
  HR_MANAGE_ATTENDANCE: 14,
  HR_VIEW_ATTENDANCE_REPORT: 15,
  HR_MANAGE_ROLES: 16,

  // Finance Department Permissions (21-30)
  FINANCE_FULL_ACCESS: 21,
  FINANCE_VIEW_DASHBOARD: 22,
  FINANCE_MANAGE_PAYROLL: 23,
  FINANCE_VIEW_REPORTS: 24,

  // Sales Department Permissions (31-40)
  SALES_FULL_ACCESS: 25,
  SALES_VIEW_DASHBOARD: 26,

  // SCM Department Permissions (41-50)
  SCM_FULL_ACCESS: 27,
  SCM_VIEW_STOCKS: 28,

  // CRM Department Permissions (51-60)
  CRM_FULL_ACCESS: 29,
  CRM_VIEW_DASHBOARD: 30,
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
