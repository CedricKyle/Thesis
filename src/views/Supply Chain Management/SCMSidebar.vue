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
  {
    name: 'Inventory',
    route: '/scm/inventory-management',
    icon: Package,
    permission: PERMISSION_IDS.SCM_MANAGE_INVENTORY_MANAGEMENT,
  },
  {
    name: 'Supplier',
    route: '/scm/supplier-management',
    icon: Package,
    permission: PERMISSION_IDS.SCM_MANAGE_SUPPLIERS_MANAGEMENT,
  },
  {
    name: 'Purchase',
    route: '/scm/purchase-management',
    icon: Package,
    permission: PERMISSION_IDS.SCM_MANAGE_PURCHASE_MANAGEMENT,
  },
  {
    name: 'Branch Distribution',
    route: '/scm/branch-distribution-management',
    icon: Package,
    permission: PERMISSION_IDS.SCM_MANAGE_BRANCH_DISTRIBUTION_MANAGEMENT,
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
