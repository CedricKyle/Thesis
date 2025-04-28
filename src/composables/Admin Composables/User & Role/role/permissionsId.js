export const DEPARTMENTS = {
  ADMIN: 'Admin Department',
  HR: 'HR Department',
  FINANCE: 'Finance Department',
  SALES: 'Sales Department',
  SCM: 'Supply Chain Department',
  CRM: 'Customer Service Department',
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
  SCM_VIEW_DASHBOARD: 16,

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
    ],
  },
  {
    department: DEPARTMENTS.FINANCE,
    name: 'Finance Department',
    permissions: [
      { id: PERMISSION_IDS.FINANCE_FULL_ACCESS, name: 'Full Access' },
      { id: PERMISSION_IDS.FINANCE_VIEW_DASHBOARD, name: 'View Dashboard' },
      { id: PERMISSION_IDS.FINANCE_MANAGE_PAYROLL, name: 'Manage Payroll' },
      { id: PERMISSION_IDS.FINANCE_VIEW_REPORTS, name: 'View Reports' },
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
    name: 'Supply Chain Department',
    permissions: [
      { id: PERMISSION_IDS.SCM_FULL_ACCESS, name: 'Full Access' },
      { id: PERMISSION_IDS.SCM_VIEW_DASHBOARD, name: 'View Dashboard' },
      { id: PERMISSION_IDS.SCM_VIEW_STOCKS, name: 'View Stocks' },
    ],
  },
  {
    department: DEPARTMENTS.CRM,
    name: 'Customer Service Department',
    permissions: [
      { id: PERMISSION_IDS.CRM_FULL_ACCESS, name: 'Full Access' },
      { id: PERMISSION_IDS.CRM_VIEW_DASHBOARD, name: 'View Dashboard' },
    ],
  },
]
