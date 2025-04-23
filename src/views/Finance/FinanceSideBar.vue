<script setup>
import BaseDepartmentSidebar from '@/components/common/BaseDepartmentSidebar.vue'
import { PERMISSION_IDS } from '@/composables/Admin Composables/User & Role/role/permissionsId'
import { LayoutDashboard, Wallet, FileText } from 'lucide-vue-next'

const menuItems = [
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
    route: '/finance/reports',
    icon: FileText,
    permission: PERMISSION_IDS.FINANCE_VIEW_REPORTS,
  },
]
</script>

<template>
  <BaseDepartmentSidebar
    departmentName="Finance Department"
    :menuItems="menuItems"
    :basePath="'/finance'"
  />
</template>
