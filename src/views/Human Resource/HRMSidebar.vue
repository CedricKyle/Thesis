<script setup>
import BaseDepartmentSidebar from '@/components/common/BaseDepartmentSidebar.vue'
import { PERMISSION_IDS } from '@/composables/Admin Composables/User & Role/role/permissionsId'
import { LayoutDashboard, Users, ClipboardCheck, FileSpreadsheet, UserCog } from 'lucide-vue-next'

const menuItems = [
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
    icon: ClipboardCheck,
    permission: PERMISSION_IDS.HR_MANAGE_ATTENDANCE,
  },
  {
    name: 'Attendance Report',
    route: '/hr/attendance-report',
    icon: FileSpreadsheet,
    permission: PERMISSION_IDS.HR_VIEW_ATTENDANCE_REPORT,
  },
  {
    name: 'Roles',
    route: '/hr/roles',
    icon: UserCog,
    permission: PERMISSION_IDS.HR_MANAGE_ROLES,
  },
]
</script>

<template>
  <BaseDepartmentSidebar
    departmentName="Human Resource Management"
    :menuItems="menuItems"
    :basePath="'/hr'"
  />
</template>
