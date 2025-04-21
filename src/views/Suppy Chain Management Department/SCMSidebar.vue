<script setup>
import { ref, defineAsyncComponent, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { LayoutDashboard, Package } from 'lucide-vue-next'

const router = useRouter()
const currentTab = ref('Dashboard')

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

// Define menu items with their components and icons
const menuItems = {
  Dashboard: {
    component: defineAsyncComponent({
      loader: () => import('./SCMDashboard.vue'),
      loadingComponent: LoadingSpinner,
      delay: 1000,
    }),
    icon: LayoutDashboard,
    route: 'SCMDashboard',
  },
  'Stock Management': {
    component: defineAsyncComponent({
      loader: () => import('./StockView.vue'),
      loadingComponent: LoadingSpinner,
      delay: 1000,
    }),
    icon: Package,
    route: 'SCMStocks',
  },
  // Inventory: {
  //   component: defineAsyncComponent({
  //     loader: () => import('./Inventory.vue'),
  //     loadingComponent: LoadingSpinner,
  //     delay: 1000,
  //   }),
  //   icon: Boxes,
  //   route: 'SCMInventory',
  // },
  // 'Purchase Orders': {
  //   component: defineAsyncComponent({
  //     loader: () => import('./PurchaseOrders.vue'),
  //     loadingComponent: LoadingSpinner,
  //     delay: 1000,
  //   }),
  //   icon: ClipboardList,
  //   route: 'SCMPurchaseOrders',
  // },
  // Suppliers: {
  //   component: defineAsyncComponent({
  //     loader: () => import('./Suppliers.vue'),
  //     loadingComponent: LoadingSpinner,
  //     delay: 1000,
  //   }),
  //   icon: TruckDelivery,
  //   route: 'SCMSuppliers',
  // },
}

const setTab = (tabName) => {
  currentTab.value = tabName
  router.push({ name: menuItems[tabName].route })
}

// Set initial active tab based on current route
onMounted(() => {
  const route = router.currentRoute.value
  const routeNames = {
    SCMDashboard: 'Dashboard',
    SCMStocks: 'Stock Management',
    SCMInventory: 'Inventory',
    SCMPurchaseOrders: 'Purchase Orders',
    SCMSuppliers: 'Suppliers',
  }

  if (routeNames[route.name]) {
    currentTab.value = routeNames[route.name]
  } else {
    // Default to Dashboard if no matching route is found
    currentTab.value = 'Dashboard'
    router.push({ name: 'SCMDashboard' })
  }
})
</script>

<template>
  <div class="flex">
    <!-- Sidebar -->
    <div class="w-80 min-h-screen p-4 bg-primaryColor">
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
          <p class="text-[12px] text-gray-300">Supply Chain Management</p>
        </div>
      </div>

      <ul class="menu w-full text-base-content">
        <li v-for="(item, name) in menuItems" :key="name" class="m-2">
          <button
            :class="[
              'flex items-center w-full px-4 py-2 transition',
              currentTab === name ? 'active-menu' : 'text-white hover:text-gray-300',
            ]"
            @click="setTab(name)"
          >
            <component :is="item.icon" class="w-6 h-6 mr-3" />
            {{ name }}
          </button>
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
</style>
