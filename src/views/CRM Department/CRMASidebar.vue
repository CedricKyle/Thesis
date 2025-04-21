<script setup>
import { ref, defineAsyncComponent, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { LayoutDashboard, Users, MessageSquare, Calendar, BarChart3, Mail } from 'lucide-vue-next'
import BaseDepartmentSidebar from '@/components/common/BaseDepartmentSidebar.vue'
import { DEPARTMENTS } from '@/composables/Admin Composables/User & Role/role/permissionsId'

const router = useRouter()
const currentTab = ref('Dashboard')

// Define loading spinner component
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

// Define menu items with their components and icons
const menuItems = {
  Dashboard: {
    component: defineAsyncComponent({
      loader: () => import('./CRMDashboard.vue'),
      loadingComponent: LoadingSpinner,
      delay: 1000,
    }),
    icon: LayoutDashboard,
    route: 'CRMDashboard',
  },
}

const setTab = (tabName) => {
  currentTab.value = tabName
  router.push({ name: menuItems[tabName].route })
}

// Set initial active tab based on current route
onMounted(() => {
  const route = router.currentRoute.value
  const routeNames = {
    CRMDashboard: 'Dashboard',
    CRMCustomers: 'Customer Management',
    CRMCommunications: 'Communications',
    CRMAppointments: 'Appointments',
    CRMEmailCampaigns: 'Email Campaigns',
    CRMAnalytics: 'Analytics',
  }

  if (routeNames[route.name]) {
    currentTab.value = routeNames[route.name]
  } else {
    // Default to Dashboard if no matching route is found
    currentTab.value = 'Dashboard'
    router.push({ name: 'CRMDashboard' })
  }
})
</script>

<template>
  <BaseDepartmentSidebar :department="DEPARTMENTS.CRM">
    <router-view></router-view>
  </BaseDepartmentSidebar>
</template>

<style scoped>
.active-menu {
  background-color: rgba(217, 217, 217, 0.15);
  color: var(--color-secondaryColor);
  border-left: 2px solid;
  border-radius: 0.125rem;
}
</style>
