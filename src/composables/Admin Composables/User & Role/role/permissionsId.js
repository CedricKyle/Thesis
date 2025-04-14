export const PERMISSION_IDS = {
  // Roles and Permissions (1-4)
  ROLE_VIEW: 1,
  ROLE_CREATE: 2,
  ROLE_EDIT: 3,
  ROLE_DELETE: 4,

  // HR Dashboard (5-6)
  DASHBOARD_VIEW: 5,
  DASHBOARD_MANAGE: 6,

  // Attendance Report (7-10)
  ATTENDANCE_REPORT_VIEW: 7,
  ATTENDANCE_REPORT_CREATE: 8,
  ATTENDANCE_REPORT_EDIT: 9,
  ATTENDANCE_REPORT_DELETE: 10,

  // Employee Management (11-14)
  EMPLOYEE_VIEW: 11,
  EMPLOYEE_CREATE: 12,
  EMPLOYEE_EDIT: 13,
  EMPLOYEE_DELETE: 14,

  // Attendance Management (15-18)
  ATTENDANCE_VIEW: 15,
  ATTENDANCE_CREATE: 16,
  ATTENDANCE_EDIT: 17,
  ATTENDANCE_DELETE: 18,

  // Inventory Management (19-22)
  INVENTORY_VIEW: 19,
  INVENTORY_CREATE: 20,
  INVENTORY_EDIT: 21,
  INVENTORY_DELETE: 22,

  // Sales Management (23-26)
  SALES_VIEW: 23,
  SALES_CREATE: 24,
  SALES_EDIT: 25,
  SALES_DELETE: 26,

  // CRM Management (27-30)
  CRM_VIEW: 27,
  CRM_CREATE: 28,
  CRM_EDIT: 29,
  CRM_DELETE: 30,

  // Finance Management (31-34)
  FINANCE_VIEW: 31,
  FINANCE_CREATE: 32,
  FINANCE_EDIT: 33,
  FINANCE_DELETE: 34,
}

export const permissionGroups = [
  {
    name: 'Roles and Permissions',
    permissions: [
      { id: PERMISSION_IDS.ROLE_VIEW, name: 'View' },
      { id: PERMISSION_IDS.ROLE_CREATE, name: 'Create' },
      { id: PERMISSION_IDS.ROLE_EDIT, name: 'Edit' },
      { id: PERMISSION_IDS.ROLE_DELETE, name: 'Delete' },
    ],
  },
  {
    name: 'HR Dashboard',
    permissions: [
      { id: PERMISSION_IDS.DASHBOARD_VIEW, name: 'View Dashboard' },
      { id: PERMISSION_IDS.DASHBOARD_MANAGE, name: 'Manage Dashboard' },
    ],
  },
  {
    name: 'Attendance Report',
    permissions: [
      { id: PERMISSION_IDS.ATTENDANCE_REPORT_VIEW, name: 'View' },
      { id: PERMISSION_IDS.ATTENDANCE_REPORT_CREATE, name: 'Create' },
      { id: PERMISSION_IDS.ATTENDANCE_REPORT_EDIT, name: 'Edit' },
      { id: PERMISSION_IDS.ATTENDANCE_REPORT_DELETE, name: 'Delete' },
    ],
  },
  {
    name: 'Employee Management',
    permissions: [
      { id: PERMISSION_IDS.EMPLOYEE_VIEW, name: 'View' },
      { id: PERMISSION_IDS.EMPLOYEE_CREATE, name: 'Create' },
      { id: PERMISSION_IDS.EMPLOYEE_EDIT, name: 'Edit' },
      { id: PERMISSION_IDS.EMPLOYEE_DELETE, name: 'Delete' },
    ],
  },
  {
    name: 'Attendance Management',
    permissions: [
      { id: PERMISSION_IDS.ATTENDANCE_VIEW, name: 'View' },
      { id: PERMISSION_IDS.ATTENDANCE_CREATE, name: 'Create' },
      { id: PERMISSION_IDS.ATTENDANCE_EDIT, name: 'Edit' },
      { id: PERMISSION_IDS.ATTENDANCE_DELETE, name: 'Delete' },
    ],
  },
  {
    name: 'Inventory Management',
    permissions: [
      { id: PERMISSION_IDS.INVENTORY_VIEW, name: 'View' },
      { id: PERMISSION_IDS.INVENTORY_CREATE, name: 'Create' },
      { id: PERMISSION_IDS.INVENTORY_EDIT, name: 'Edit' },
      { id: PERMISSION_IDS.INVENTORY_DELETE, name: 'Delete' },
    ],
  },
  {
    name: 'Sales Management',
    permissions: [
      { id: PERMISSION_IDS.SALES_VIEW, name: 'View' },
      { id: PERMISSION_IDS.SALES_CREATE, name: 'Create' },
      { id: PERMISSION_IDS.SALES_EDIT, name: 'Edit' },
      { id: PERMISSION_IDS.SALES_DELETE, name: 'Delete' },
    ],
  },
  {
    name: 'CRM Management',
    permissions: [
      { id: PERMISSION_IDS.CRM_VIEW, name: 'View' },
      { id: PERMISSION_IDS.CRM_CREATE, name: 'Create' },
      { id: PERMISSION_IDS.CRM_EDIT, name: 'Edit' },
      { id: PERMISSION_IDS.CRM_DELETE, name: 'Delete' },
    ],
  },
  {
    name: 'Finance Management',
    permissions: [
      { id: PERMISSION_IDS.FINANCE_VIEW, name: 'View' },
      { id: PERMISSION_IDS.FINANCE_CREATE, name: 'Create' },
      { id: PERMISSION_IDS.FINANCE_EDIT, name: 'Edit' },
      { id: PERMISSION_IDS.FINANCE_DELETE, name: 'Delete' },
    ],
  },
]
