<script setup>
import BaseDepartmentSidebar from '@/components/common/BaseDepartmentSidebar.vue'
import { PERMISSION_IDS } from '@/composables/Admin Composables/User & Role/role/permissionsId'
import { LayoutDashboard } from 'lucide-vue-next'

const menuItems = [
  {
    name: 'Dashboard',
    route: '/production/dashboard',
    icon: LayoutDashboard,
    permission: PERMISSION_IDS.PRODUCTION_VIEW_DASHBOARD,
  },
    {
    name: 'Point Of Sales',
    route: '/production/Point_of_Sales',
    icon: LayoutDashboard,
    permission: PERMISSION_IDS.PRODUCTION_VIEW_DASHBOARD,
  },
]
</script>

<template>
  <BaseDepartmentSidebar :menuItems="menuItems" />
</template>
