<script setup>
import HumanResourceManagement from './HumanResourceManagement.vue'
import CRMManagement from './CRMManagement.vue'
import FinancialManagement from './FinancialManagement.vue'
import InventoryManagement from './InventoryManagement.vue'
import SalesManagement from './SalesManagement.vue'

//this is sub menu for hr management
import { ref, defineAsyncComponent, onMounted } from 'vue'

//this is import icons
import { Building2, Landmark, ChartNoAxesColumnIncreasing, Archive, Mail } from 'lucide-vue-next'

import { useRouter } from 'vue-router'
const router = useRouter()

// Change the initial states to be null instead of having default values
const currentTab = ref(null) // Changed from 'Dashboard'
const openParentMenu = ref(null) // Changed from 'Human Resource'

//this is loading state
const isLoading = ref(false)

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

// Create async components with loading state
const AsyncHRDashboard = defineAsyncComponent({
  loader: () => import('../Human Resource/HRDashboard.vue'),
  loadingComponent: LoadingSpinner,
  delay: 5000, // delay in ms before showing loading state
  onLoadingStart: () => {
    isLoading.value = true
  },
  onLoadingComplete: () => {
    isLoading.value = false
  },
})

const tabs = {
  Sales: { component: SalesManagement, icon: ChartNoAxesColumnIncreasing },
  Inventory: { component: InventoryManagement, icon: Archive },
  CRM: { component: CRMManagement, icon: Mail },
  Finance: {
    component: FinancialManagement,
    icon: Landmark,
    submenu: {
      Dashboard: defineAsyncComponent({
        loader: () => import('../Finance/FinanceDashboard.vue'),
        loadingComponent: LoadingSpinner,
        delay: 1000,
      }),
      Payroll: defineAsyncComponent({
        loader: () => import('../Finance/FinancePayroll.vue'),
        loadingComponent: LoadingSpinner,
        delay: 1000,
      }),
      'Finance Report': defineAsyncComponent({
        loader: () => import('../Finance/FinanceReport.vue'),
        loadingComponent: LoadingSpinner,
        delay: 1000,
      }),
    },
  },
  'Human Resource': {
    component: HumanResourceManagement,
    icon: Building2,
    submenu: {
      Dashboard: AsyncHRDashboard,
      Employees: defineAsyncComponent({
        loader: () => import('../Human Resource/Employees.vue'),
        loadingComponent: LoadingSpinner,
        delay: 1000,
      }),
      Attendance: defineAsyncComponent({
        loader: () => import('../Human Resource/Attendance.vue'),
        loadingComponent: LoadingSpinner,
        delay: 1000,
      }),
      'Attendance Report': defineAsyncComponent({
        loader: () => import('../Human Resource/AttendanceReport.vue'),
        loadingComponent: LoadingSpinner,
        delay: 1000,
      }),
      Roles: defineAsyncComponent({
        loader: () => import('../Human Resource/UserRolesManagement.vue'),
        loadingComponent: LoadingSpinner,
        delay: 1000,
      }),
    },
  },
}

// Modify the setTab function to handle both component switching and routing
const setTab = (tabName, parentTab = null) => {
  currentTab.value = tabName
  if (parentTab) {
    openParentMenu.value = parentTab
  }

  // Handle routing based on tab name
  switch (tabName) {
    case 'Roles':
      router.push({ name: 'Roles' })
      break
    case 'Sales':
      router.push({ name: 'Sales' })
      break
    case 'Inventory':
      router.push({ name: 'Inventory' })
      break
    case 'CRM':
      router.push({ name: 'CRM' })
      break
    case 'Dashboard':
      if (openParentMenu.value === 'Finance') {
        router.push({ name: 'FinanceDashboard' })
      } else {
        router.push({ name: 'HRDashboard' })
      }
      break
    //this is for finance management
    case 'Payroll':
      router.push({ name: 'FinancePayroll' })
      break
    case 'Finance Report':
      router.push({ name: 'FinanceReport' })
      break
    //this is for hr management
    case 'Employees':
      router.push({ name: 'Employees' })
      break
    case 'Attendance':
      router.push({ name: 'Attendance' })
      break
    case 'Attendance Report':
      router.push({ name: 'AttendanceReport' })
      break
    default:
      // If no specific route, just update the component
      break
  }
}

// Modify the onMounted function to better handle the initial route
onMounted(() => {
  const route = router.currentRoute.value
  const routeToTab = {
    Roles: { tab: 'Roles', parent: 'Human Resource' },
    CreateRole: { tab: 'Roles', parent: 'Human Resource' },
    Finance: { tab: 'Dashboard', parent: 'Finance' },
    FinanceDashboard: { tab: 'Dashboard', parent: 'Finance' },
    Payroll: { tab: 'Payroll', parent: 'Finance' },
    'Finance Report': { tab: 'Finance Report', parent: 'Finance' },
    Sales: { tab: 'Sales', parent: null },
    Inventory: { tab: 'Inventory', parent: null },
    CRM: { tab: 'CRM', parent: null },
    HRDashboard: { tab: 'Dashboard', parent: 'Human Resource' },
    Employees: { tab: 'Employees', parent: 'Human Resource' },
    Attendance: { tab: 'Attendance', parent: 'Human Resource' },
    AttendanceReport: { tab: 'Attendance Report', parent: 'Human Resource' },
  }

  if (routeToTab[route.name]) {
    const { tab, parent } = routeToTab[route.name]
    currentTab.value = tab
    openParentMenu.value = parent
  } else {
    // Default to HR Dashboard if no matching route is found
    currentTab.value = 'Dashboard'
    openParentMenu.value = 'Human Resource'
    router.push({ name: 'HRDashboard' })
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
            class="w-20 h-20"
          />
        </div>
        <div class="text-log">
          <h1 class="text-[25px] text-secondaryColor font-bold">Countryside</h1>
          <p class="text-[12px] text-gray-300">Serving sizzling steaks since 1984!</p>
        </div>
      </div>
      <ul class="menu w-full text-base-content">
        <li v-for="(tab, tabName) in tabs" :key="tabName" class="m-2">
          <template v-if="tab.submenu">
            <details :open="tabName === openParentMenu">
              <summary
                class="flex items-center w-full px-4 py-2 transition hover:text-gray-300 relative"
              >
                <div class="flex items-center flex-1">
                  <component :is="tab.icon" class="w-6 h-6 mr-3" />
                  {{ tabName }}
                </div>
              </summary>
              <ul class="pl-10">
                <li v-for="(subComp, subTab) in tab.submenu" :key="subTab">
                  <button
                    :class="[
                      'flex items-center px-4 py-2 submenu-button',
                      currentTab === subTab && openParentMenu === tabName
                        ? 'active-submenu'
                        : 'text-white hover:text-gray-300',
                    ]"
                    @click="setTab(subTab, tabName)"
                  >
                    {{ subTab }}
                  </button>
                </li>
              </ul>
            </details>
          </template>
          <template v-else>
            <button
              :class="[
                'flex items-center px-4 py-2 submenu-button',
                currentTab === tabName ? 'active-submenu' : 'text-white hover:text-gray-300',
              ]"
              @click="setTab(tabName)"
            >
              <component :is="tab.icon" class="w-6 h-6 mr-3" />
              {{ tabName }}
            </button>
          </template>
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
.submenu-button {
  transition: color 0.2s ease;
  transition-property: color;
  background-color: transparent;
}

.active-submenu {
  background-color: rgba(217, 217, 217, 0.15);
  color: var(--color-secondaryColor);
  border-left: 2px solid;
  border-top-right-radius: 0.125rem;
  border-bottom-right-radius: 0.125rem;
  border-top-left-radius: 0px;
  border-bottom-left-radius: 0px;
}
</style>
