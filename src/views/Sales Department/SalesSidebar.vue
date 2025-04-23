<script setup>
import BaseDepartmentSidebar from '@/components/common/BaseDepartmentSidebar.vue'
import { PERMISSION_IDS } from '@/composables/Admin Composables/User & Role/role/permissionsId'
import { LayoutDashboard, ShoppingCart, TrendingUp, FileText } from 'lucide-vue-next'

const menuItems = [
  {
    name: 'Dashboard',
    route: '/sales/dashboard',
    icon: LayoutDashboard,
    permission: PERMISSION_IDS.SALES_VIEW_DASHBOARD,
  },
  {
    name: 'Orders',
    route: '/sales/orders',
    icon: ShoppingCart,
    permission: PERMISSION_IDS.SALES_MANAGE_ORDERS,
  },
  {
    name: 'Analytics',
    route: '/sales/analytics',
    icon: TrendingUp,
    permission: PERMISSION_IDS.SALES_VIEW_ANALYTICS,
  },
  {
    name: 'Reports',
    route: '/sales/reports',
    icon: FileText,
    permission: PERMISSION_IDS.SALES_VIEW_REPORTS,
  },
]
</script>

<template>
  <BaseDepartmentSidebar departmentName="SALES" :menuItems="menuItems" basePath="/sales" />
</template>
