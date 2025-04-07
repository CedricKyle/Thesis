<script setup>
import HumanResourceManagement from './HumanResourceManagement.vue'
import CRMManagement from './CRMManagement.vue'
import FinancialManagement from './FinancialManagement.vue'
import InventoryManagement from './InventoryManagement.vue'
import SalesManagement from './SalesManagement.vue'
import UserManagement from '../Users Management/UserManagement.vue'
import UserRolesManagement from '../Users Management/UserRolesManagement.vue'

//this is sub menu for hr management
import { ref, defineAsyncComponent } from 'vue'

//this is import icons
import {
  Building2,
  Landmark,
  ChartNoAxesColumnIncreasing,
  Archive,
  Mail,
  Users,
  LockKeyhole,
  ChevronDown,
} from 'lucide-vue-next'

// Set initial tab to HRDashboard
const currentTab = ref('Dashboard')

// Add a ref to track which parent menu should be open
const openParentMenu = ref('Human Resource')

//this is loading state
const isLoading = ref(false)

// Define a simple loading spinner component
const LoadingSpinner = {
  template: `
    <div class="flex items-center justify-center h-full">
      <span class="loading loading-spinner loading-lg text-secondaryColor"></span>
    </div>
  `,
}

// Create async components with loading state
const AsyncHRDashboard = defineAsyncComponent({
  loader: () => import('../Human Resource/HRDashboard.vue'),
  loadingComponent: LoadingSpinner,
  delay: 1000, // delay in ms before showing loading state
  onLoadingStart: () => {
    isLoading.value = true
  },
  onLoadingComplete: () => {
    isLoading.value = false
  },
})

const tabs = {
  Finance: { component: FinancialManagement, icon: Landmark },
  Sales: { component: SalesManagement, icon: ChartNoAxesColumnIncreasing },
  Inventory: { component: InventoryManagement, icon: Archive },
  CRM: { component: CRMManagement, icon: Mail },
  Users: {
    component: UserManagement,
    icon: Users,
  },
  Roles: {
    component: UserRolesManagement,
    icon: LockKeyhole,
  },
  'Human Resource': {
    component: HumanResourceManagement,
    icon: Building2,
    submenu: {
      Dashboard: AsyncHRDashboard, // Use async component
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
    },
  },
}

// Modify the setTab function to track parent menu
const setTab = (tabName, parentTab = null) => {
  currentTab.value = tabName
  if (parentTab) {
    openParentMenu.value = parentTab
  }
}
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
                  <a
                    :class="[
                      'flex items-center px-4 py-2 transition',
                      currentTab === subTab
                        ? 'bg-[rgba(217,217,217,0.15)] text-white' /* Active state with 30% opacity */
                        : 'hover: text-gray-300' /* Default & hover */,
                    ]"
                    @click="setTab(subTab, tabName)"
                  >
                    {{ subTab }}
                  </a>
                </li>
              </ul>
            </details>
          </template>
          <template v-else>
            <a
              :class="[
                'flex items-center px-4 py-2 transition',
                currentTab === tabName
                  ? 'bg-[rgba(217,217,217,0.15)] text-white' /* Active state with 30% opacity */
                  : 'hover: text-gray-300' /* Default & hover */,
              ]"
              @click="setTab(tabName)"
            >
              <component :is="tab.icon" class="w-6 h-6 mr-3" />
              {{ tabName }}
            </a>
          </template>
        </li>
      </ul>
    </div>

    <!-- Main Content -->
    <div class="flex-1 p-6 bg-bgColor overflow-y-auto max-h-screen">
      <Transition
        enter-active-class="transition-opacity duration-300"
        leave-active-class="transition-opacity duration-300"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div class="min-h-full">
          <component
            v-if="
              currentTab &&
              (tabs[currentTab]?.component || tabs['Human Resource'].submenu[currentTab])
            "
            :is="tabs[currentTab]?.component || tabs['Human Resource'].submenu[currentTab]"
            :key="currentTab"
          ></component>
        </div>
      </Transition>
    </div>
  </div>
</template>
