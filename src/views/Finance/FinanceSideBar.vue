<script setup>
import { ref, defineAsyncComponent, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { LayoutDashboard, Wallet, FileText } from 'lucide-vue-next'
import {
  DEPARTMENTS,
  PERMISSION_IDS,
} from '@/composables/Admin Composables/User & Role/role/permissionsId'
import { usePermissions } from '@/composables/Admin Composables/User & Role/role/usePermissions'
import { useRolesStore } from '@/stores/Users & Role/roleStore'

const router = useRouter()
const currentTab = ref('Dashboard')
const rolesStore = useRolesStore()
const employeeRole = computed(() => rolesStore.getCurrentEmployeeRole())
const { hasPermission } = usePermissions(employeeRole)

// Define a simple loading spinner component
const LoadingSpinner = {
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center animate-fade-in">
      <div class="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center animate-slide-up">
        <span class="loading loading-dots loading-xl text-primaryColor"></span>
        <p class="mt-2 text-gray-700">Loading...</p>
      </div>
    </div>
  `,
}

// Compute visible menu items based on permissions
const visibleMenuItems = computed(() => {
  const items = []

  // If user has FINANCE_FULL_ACCESS, show all menu items
  if (hasPermission(PERMISSION_IDS.FINANCE_FULL_ACCESS)) {
    return [
      {
        name: 'Dashboard',
        route: '/finance/dashboard',
        icon: LayoutDashboard,
      },
      {
        name: 'Payroll',
        route: '/finance/payroll',
        icon: Wallet,
      },
      {
        name: 'Reports',
        route: '/finance/report',
        icon: FileText,
      },
    ]
  }

  // Otherwise, check individual permissions
  if (hasPermission(PERMISSION_IDS.FINANCE_VIEW_DASHBOARD)) {
    items.push({
      name: 'Dashboard',
      route: '/finance/dashboard',
      icon: LayoutDashboard,
    })
  }

  if (hasPermission(PERMISSION_IDS.FINANCE_MANAGE_PAYROLL)) {
    items.push({
      name: 'Payroll',
      route: '/finance/payroll',
      icon: Wallet,
    })
  }

  if (hasPermission(PERMISSION_IDS.FINANCE_VIEW_REPORTS)) {
    items.push({
      name: 'Reports',
      route: '/finance/report',
      icon: FileText,
    })
  }

  return items
})

onMounted(() => {
  // Set initial tab based on current route
  const currentRoute = router.currentRoute.value
  const matchingItem = visibleMenuItems.value.find((item) => item.route === currentRoute.path)
  if (matchingItem) {
    currentTab.value = matchingItem.name
  }
})
</script>

<template>
  <div class="flex">
    <!-- Sidebar -->
    <div class="w-80 min-h-screen p-4 bg-primaryColor">
      <!-- Logo Section -->
      <div class="logo-section flex items-center mb-5 gap-4">
        <div class="logo-content">
          <img
            src="../../assets/Images/countryside-logo.png"
            alt="this is logo"
            class="w-15 h-15"
          />
        </div>
        <div class="text-log">
          <h1 class="text-[25px] text-secondaryColor">Countryside</h1>
          <p class="text-[12px] text-gray-300">Serving sizzling steaks since 1984!</p>
        </div>
      </div>

      <!-- Menu Items -->
      <ul class="menu w-full text-base-content">
        <li v-for="item in visibleMenuItems" :key="item.name">
          <router-link
            :to="item.route"
            class="flex items-center gap-3 p-3 hover:bg-primaryColor/20 rounded-md text-white"
            :class="{ 'active-menu': currentTab === item.name }"
            @click="currentTab = item.name"
          >
            <component :is="item.icon" class="w-5 h-5" />
            {{ item.name }}
          </router-link>
        </li>
      </ul>
    </div>

    <!-- Main Content -->
    <div class="flex-1 p-6 bg-bgColor overflow-y-auto max-h-screen">
      <router-view></router-view>
    </div>
  </div>
</template>

<style scoped>
.active-menu {
  background-color: rgba(217, 217, 217, 0.15);
  color: var(--color-secondaryColor);
  border-left: 2px solid;
  border-radius: 0.125rem;
}

.menu li a {
  color: white;
}

.menu li a:hover {
  color: var(--color-secondaryColor);
}

.menu li a.active-menu {
  color: var(--color-secondaryColor);
}
</style>
