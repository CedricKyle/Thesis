<script setup>
import BaseDepartmentSidebar from '@/components/common/BaseDepartmentSidebar.vue'
import { PERMISSION_IDS } from '@/composables/Admin Composables/User & Role/role/permissionsId'
import {
  LayoutDashboard,
  Package,
  Building2,
  HandCoins,
  UsersRound,
  ArchiveRestore,
  Mails,
} from 'lucide-vue-next'

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
    name: 'Purchase Order Management',
    route: '/scm/purchase-order-management',
    icon: ArchiveRestore,
    permission: PERMISSION_IDS.SCM_MANAGE_PURCHASE_ORDER_MANAGEMENT,
  },
  {
    name: 'Request Management',
    route: '/scm/request-management',
    icon: Mails,
    permission: PERMISSION_IDS.SCM_MANAGE_REQUEST_MANAGEMENT,
  },
  {
    name: 'Supplier Management',
    route: '/scm/supplier-management',
    icon: UsersRound,
    permission: PERMISSION_IDS.SCM_MANAGE_SUPPLIERS_MANAGEMENT,
  },

  {
    name: 'Branch Distribution',
    route: '/scm/branch-distribution-management',
    icon: Building2,
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
