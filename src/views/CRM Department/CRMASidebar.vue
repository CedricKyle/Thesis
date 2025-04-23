<script setup>
import BaseDepartmentSidebar from '@/components/common/BaseDepartmentSidebar.vue'
import { PERMISSION_IDS } from '@/composables/Admin Composables/User & Role/role/permissionsId'
import { LayoutDashboard } from 'lucide-vue-next'

const menuItems = [
  {
    name: 'Dashboard',
    route: '/crm/dashboard',
    icon: LayoutDashboard,
    permission: PERMISSION_IDS.CRM_VIEW_DASHBOARD,
  },
]
</script>

<template>
  <BaseDepartmentSidebar
    departmentName="Customer Relationship Management"
    :menuItems="menuItems"
    :basePath="'/crm'"
  />
</template>
