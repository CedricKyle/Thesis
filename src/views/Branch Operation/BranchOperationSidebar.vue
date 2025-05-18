<script setup>
import BaseBranchOperationSidebar from '@/components/common/BaseBranchOperationSidebar.vue'
import { PERMISSION_IDS } from '@/composables/Admin Composables/User & Role/role/permissionsId'
import { ShoppingCart, Package, Users, LayoutDashboard } from 'lucide-vue-next'

const menuItems = [
  {
    name: 'Dashboard',
    path: '/branch-operation/dashboard',
    icon: LayoutDashboard,
    permission: PERMISSION_IDS.BRANCH_OPERATION_FULL_ACCESS,
  },
  {
    name: 'POS',
    path: '/branch-operation/pos',
    icon: ShoppingCart,
    permission: PERMISSION_IDS.BRANCH_OPERATION_POS,
  },
  {
    name: 'Inventory',
    path: '/branch-operation/inventory',
    icon: Package,
    permission: PERMISSION_IDS.BRANCH_OPERATION_MANAGE_INVENTORY,
  },
  {
    name: 'Sales',
    path: '/branch-operation/sales',
    icon: ShoppingCart,
    permission: PERMISSION_IDS.BRANCH_OPERATION_MANAGE_SALES,
  },
  {
    name: 'Employees',
    path: '/branch-operation/employee',
    icon: Users,
    permission: PERMISSION_IDS.BRANCH_OPERATION_MANAGE_EMPLOYEES,
  },
]
</script>

<template>
  <BaseBranchOperationSidebar :menuItems="menuItems" basePath="/branch-operation" />
</template>
