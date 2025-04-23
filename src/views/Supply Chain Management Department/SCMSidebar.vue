<script setup>
import BaseDepartmentSidebar from '@/components/common/BaseDepartmentSidebar.vue'
import { PERMISSION_IDS } from '@/composables/Admin Composables/User & Role/role/permissionsId'
import { LayoutDashboard, Package } from 'lucide-vue-next'

const menuItems = [
  {
    name: 'Dashboard',
    route: '/scm/dashboard',
    icon: LayoutDashboard,
    permission: PERMISSION_IDS.SCM_VIEW_DASHBOARD,
  },
  {
    name: 'Stocks',
    route: '/scm/stocks',
    icon: Package,
    permission: PERMISSION_IDS.SCM_VIEW_STOCKS,
  },
]
</script>

<template>
  <BaseDepartmentSidebar
    departmentName="Supply Chain Management"
    :menuItems="menuItems"
    :basePath="'/scm'"
  />
</template>
