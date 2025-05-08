<script setup>
import BaseDepartmentSidebar from '@/components/common/BaseDepartmentSidebar.vue'
import { PERMISSION_IDS } from '@/composables/Admin Composables/User & Role/role/permissionsId'
import {
  LayoutDashboard,
  HandCoins,
  Landmark,
  FileChartLine,
  ChartNoAxesColumnIncreasing,
} from 'lucide-vue-next'

const menuItems = [
  {
    name: 'Dashboard',
    route: '/finance/dashboard',
    icon: LayoutDashboard,
    permission: PERMISSION_IDS.FINANCE_VIEW_DASHBOARD,
  },
  {
    name: 'Accounting',
    route: '/finance/accounting-management',
    icon: Landmark,
    permission: PERMISSION_IDS.FINANCE_MANAGE_ACCOUNTING_MANAGEMENT,
  },
  {
    name: 'Treasury',
    route: '/finance/treasury-management',
    icon: HandCoins,
    permission: PERMISSION_IDS.FINANCE_MANAGE_TREASURY_MANAGEMENT,
  },
  {
    name: 'Reports',
    route: '/finance/reports',
    icon: FileChartLine,
    permission: PERMISSION_IDS.FINANCE_VIEW_REPORTS,
  },
  {
    name: 'Sales Management',
    route: '/finance/sales-management',
    icon: ChartNoAxesColumnIncreasing,
    permission: PERMISSION_IDS.FINANCE_MANAGE_SALES_MANAGEMENT,
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
