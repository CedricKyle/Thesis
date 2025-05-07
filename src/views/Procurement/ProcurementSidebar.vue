<script setup>
import BaseDepartmentSidebar from '@/components/common/BaseDepartmentSidebar.vue'
import { PERMISSION_IDS } from '@/composables/Admin Composables/User & Role/role/permissionsId'
import { LayoutDashboard, HandCoins, Landmark, ShoppingCart, Users } from 'lucide-vue-next'

const menuItems = [
  {
    name: 'Dashboard',
    route: '/procurement/dashboard',
    icon: LayoutDashboard,
    permission: PERMISSION_IDS.PROCUREMENT_VIEW_DASHBOARD,
  },
  {
    name: 'Purchase Order Management',
    route: '/procurement/purchase-order-management',
    icon: ShoppingCart,
    permission: PERMISSION_IDS.PROCUREMENT_MANAGE_PURCHASE_ORDER_MANAGEMENT,
  },
  {
    name: 'Supplier Management',
    route: '/procurement/supplier-management',
    icon: Users,
    permission: PERMISSION_IDS.PROCUREMENT_MANAGE_SUPPLIERS_MANAGEMENT,
  },
]
</script>
<template>
  <BaseDepartmentSidebar
    departmentName="Procurement Department"
    :menuItems="menuItems"
    :basePath="'/procurement'"
  />
</template>
