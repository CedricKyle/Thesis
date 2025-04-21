<script setup>
import BaseDepartmentSidebar from '@/components/common/BaseDepartmentSidebar.vue'
import { DEPARTMENTS } from '@/composables/Admin Composables/User & Role/role/permissionsId'
</script>

<template>
  <BaseDepartmentSidebar :department="DEPARTMENTS.SCM">
    <router-view></router-view>
  </BaseDepartmentSidebar>
</template>
