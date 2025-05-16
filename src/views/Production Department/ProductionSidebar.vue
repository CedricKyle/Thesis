<script setup>
import BaseDepartmentSidebar from '@/components/common/BaseDepartmentSidebar.vue'
import { PERMISSION_IDS } from '@/composables/Admin Composables/User & Role/role/permissionsId'
import { LayoutDashboard, Package, HandPlatter, Truck, ScrollText } from 'lucide-vue-next'

const menuItems = [
  {
    name: 'Dashboard',
    route: '/production/dashboard',
    icon: LayoutDashboard,
    permission: PERMISSION_IDS.PRODUCTION_VIEW_DASHBOARD,
  },

  {
    name: 'Inventory Overview',
    route: '/production/inventory-overview',
    icon: Package,
    permission: PERMISSION_IDS.PRODUCTION_VIEW_DASHBOARD,
  },
  {
    name: 'Production Batch Entry',
    route: '/production/production-batch-entry',
    icon: HandPlatter,
    permission: PERMISSION_IDS.PRODUCTION_VIEW_DASHBOARD,
  },
  {
    name: 'Production Distribution',
    route: '/production/production-distribution',
    icon: Truck,
    permission: PERMISSION_IDS.PRODUCTION_VIEW_DASHBOARD,
  },
  {
    name: 'Production History',
    route: '/production/production-history',
    icon: ScrollText,
    permission: PERMISSION_IDS.PRODUCTION_VIEW_DASHBOARD,
  },
]
</script>

<template>
  <BaseDepartmentSidebar :menuItems="menuItems" />
</template>
