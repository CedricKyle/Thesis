<script setup>
import { PERMISSION_IDS } from '@/composables/Admin Composables/User & Role/role/permissionsId'
import BaseDepartmentSidebar from '@/components/common/BaseDepartmentSidebar.vue'
import { FileText, LayoutDashboard } from 'lucide-vue-next'
const menuItems = [
  {
    name: 'Dashboard',
    route: '/branch-operation/dashboard',
    icon: LayoutDashboard,
    permission: PERMISSION_IDS.BRANCH_OPERATION_VIEW_DASHBOARD,
  },
  {
    name: 'Request Management',
    route: '/branch-operation/request-module',
    icon: FileText,
    permission: PERMISSION_IDS.BRANCH_OPERATION_MANAGE_REQUESTS_MODULE,
  },
]
</script>

<template>
  <BaseDepartmentSidebar
    departmentName="Branch Operation"
    :menuItems="menuItems"
    :basePath="'/branch-operation'"
  />
</template>
