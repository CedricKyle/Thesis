<script setup>
import { computed } from 'vue'
import { usePermissions } from '@/composables/Admin Composables/User & Role/role/usePermissions'
import { useRolesStore } from '@/stores/Users & Role/roleStore'

const props = defineProps({
  department: {
    type: String,
    required: true,
  },
})

const rolesStore = useRolesStore()
const employeeRole = computed(() => rolesStore.getCurrentEmployeeRole())
const { canAccessDepartment, getVisibleMenuItems } = usePermissions(employeeRole)

const menuItems = computed(() => {
  if (!canAccessDepartment(props.department)) return []
  return getVisibleMenuItems(props.department)
})

const isActive = (route) => {
  return route === window.location.pathname
}
</script>

<template>
  <div class="drawer lg:drawer-open">
    <input id="department-drawer" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content flex flex-col items-center justify-center">
      <slot></slot>
    </div>
    <div class="drawer-side">
      <label for="department-drawer" class="drawer-overlay"></label>
      <ul class="menu p-4 w-80 min-h-full bg-base-200 text-base-content">
        <template v-if="menuItems.length > 0">
          <li v-for="item in menuItems" :key="item.route">
            <router-link
              :to="item.route"
              class="flex items-center gap-3 p-3 hover:bg-primaryColor/20 rounded-md"
              :class="{ 'bg-primaryColor/20': isActive(item.route) }"
            >
              <component :is="item.icon" class="w-5 h-5" />
              {{ item.name }}
            </router-link>
          </li>
        </template>
        <template v-else>
          <li class="text-center text-gray-500 mt-4">You don't have access to this department</li>
        </template>
      </ul>
    </div>
  </div>
</template>
