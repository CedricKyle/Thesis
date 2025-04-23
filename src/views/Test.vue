<script setup>
import HumanResourceManagement from './HumanResourceManagement.vue'
import CRMManagement from './CRMManagement.vue'
import FinancialManagement from './FinancialManagement.vue'
import InventoryManagement from './InventoryManagement.vue'
import SalesManagement from './SalesManagement.vue'
import UserManagement from '../Users Management/UserManagement.vue'
import UserRolesManagement from '../Users Management/UserRolesManagement.vue'

//this is sub menu for hr management
import { ref, defineAsyncComponent, onMounted, computed } from 'vue'

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
  LogOut,
  User,
  Settings,
} from 'lucide-vue-next'

import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/Users & Role/authStore'
import FinanceDashboard from '../Finance/FinanceDashboard.vue'

const router = useRouter()
const auth = useAuthStore()

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

// Add this new function to check if submenu is active
const isSubmenuActive = (tabName) => {
  if (tabName === 'Human Resource') {
    return ['Dashboard', 'Employees', 'Attendance', 'Attendance Report'].includes(currentTab.value)
  }
  return false
}

// Modify the setTab function to handle both component switching and routing
const setTab = (tabName, parentTab = null) => {
  currentTab.value = tabName
  if (parentTab) {
    openParentMenu.value = parentTab
  } else {
    // Reset openParentMenu if clicking a main menu item
    openParentMenu.value = null
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
    case 'Payroll':
      router.push({ name: 'FinancePayroll' })
      break
    case 'Finance Report':
      router.push({ name: 'FinanceReport' })
      break
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

// Add a method to handle the current route
onMounted(() => {
  const route = router.currentRoute.value
  const routeToTab = {
    Roles: 'Roles',
    CreateRole: 'Roles',
    Finance: 'Finance',
    FinanceDashboard: 'Dashboard',
    Payroll: 'Payroll',
    'Finance Report': 'Finance Report',
    Sales: 'Sales',
    Inventory: 'Inventory',
    CRM: 'CRM',
    HRDashboard: 'Dashboard',
    Employees: 'Employees',
    Attendance: 'Attendance',
    AttendanceReport: 'Attendance Report',
  }

  if (routeToTab[route.name]) {
    currentTab.value = routeToTab[route.name]
    // Only set openParentMenu for HR routes
    if (['HRDashboard', 'Employees', 'Attendance', 'AttendanceReport'].includes(route.name)) {
      openParentMenu.value = 'Human Resource'
    }
    if (['FinanceDashboard', 'Payroll', 'Finance Report'].includes(route.name)) {
      openParentMenu.value = 'Finance'
    }
  }
})

// Get user from auth store
const user = computed(() => auth.user)

// Get user initials
const userInitials = computed(() => {
  if (!user.value?.full_name) return ''
  return user.value.full_name
    .split(' ')
    .map((name) => name[0])
    .join('')
    .toUpperCase()
})

// Format last login time
const formatLastLogin = computed(() => {
  if (!user.value?.last_modified) return 'Never'
  return new Date(user.value.last_modified).toLocaleString()
})

// Handle logout
const handleLogout = async () => {
  try {
    await auth.logout()
    router.push('/login')
  } catch (error) {
    console.error('Logout error:', error)
  }
}
</script>

<template>
  <div class="flex h-screen">
    <!-- Sidebar -->
    <div class="w-80 h-screen overflow-y-auto bg-primaryColor">
      <div class="logo-section flex items-center p-4 gap-4">
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

      <!-- User Profile Section -->

      <ul class="menu w-full text-base-content">
        <li v-for="(tab, tabName) in tabs" :key="tabName" class="m-2">
          <template v-if="tab.submenu">
            <details :open="tabName === openParentMenu" class="bg-transparent">
              <summary
                :class="[
                  'flex items-center w-full px-4 py-2 transition rounded-lg',
                  // Only show active state if current tab is in this submenu
                  isSubmenuActive(tabName)
                    ? 'bg-[rgba(217,217,217,0.15)] text-white'
                    : 'hover:bg-[rgba(217,217,217,0.15)] hover:text-white text-gray-300',
                ]"
              >
                <div class="flex items-center flex-1">
                  <component :is="tab.icon" class="w-6 h-6 mr-3" />
                  {{ tabName }}
                </div>
              </summary>
              <ul class="pl-10 mt-2 bg-transparent">
                <li v-for="(subComp, subTab) in tab.submenu" :key="subTab" class="bg-transparent">
                  <button
                    :class="[
                      'flex items-center px-4 py-2 transition duration-100 ease-in-out',
                      currentTab === subTab
                        ? 'bg-[rgba(217,217,217,0.15)] text-secondaryColor rouded-r-sm !rounded-l-none !border-l-2'
                        : 'hover: text-gray-300',
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
                'flex items-center px-4 py-2 transition duration-100 ease-in-out',
                currentTab === tabName
                  ? 'bg-[rgba(217,217,217,0.15)] text-secondaryColor rounded-r-sm !rounded-l-none !border-l-2'
                  : 'hover: text-gray-300',
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

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col h-screen overflow-hidden">
      <!-- Navbar -->
      <div class="navbar bg-white shadow-sm flex items-end justify-end">
        <div class="">
          <ul class="menu menu-horizontal px-1">
            <li>
              <details class="dropdown dropdown-end">
                <summary class="flex items-center gap-2 cursor-pointer">
                  <!-- User Avatar -->
                  <div class="avatar placeholder">
                    <div
                      class="bg-secondaryColor text-white rounded-full w-8 h-8 flex items-center justify-center"
                    >
                      <span
                        class="text-sm font-medium flex items-center justify-center w-full h-full"
                      >
                        {{ userInitials }}
                      </span>
                    </div>
                  </div>
                  <span class="text-gray-700">{{ user?.full_name }}</span>
                </summary>
                <ul
                  class="dropdown-content menu !bg-primaryColor rounded-box w-56 shadow-lg mt-4 z-[999]"
                >
                  <!-- User Info -->
                  <li class="menu-title px-4 py-2">
                    <span class="text-xs font-thin text-gray-300">Signed in as</span>
                    <span class="font-thin text-sm text-white">{{ user?.email }}</span>
                  </li>
                  <!-- Menu Items -->
                  <li>
                    <a
                      class="flex items-center gap-2 text-white hover:bg-[rgba(217,217,217,0.15)]"
                      @click="router.push('/profile')"
                    >
                      <User class="w-4 h-4" />
                      Your Profile
                    </a>
                  </li>
                  <li>
                    <a class="flex items-center gap-2 text-white hover:bg-[rgba(217,217,217,0.15)]">
                      <Settings class="w-4 h-4" />
                      Settings
                    </a>
                  </li>
                  <li>
                    <a
                      class="flex items-center gap-2 text-red-400 hover:bg-[rgba(217,217,217,0.15)]"
                      @click="handleLogout"
                    >
                      <LogOut class="w-4 h-4" />
                      Sign out
                    </a>
                  </li>
                </ul>
              </details>
            </li>
          </ul>
        </div>
      </div>

      <!-- Page Content -->
      <div class="flex-1 p-6 bg-bgColor overflow-y-auto">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-profile {
  transition: all 0.3s ease;
}

.user-profile button {
  transition: all 0.2s ease;
}

.user-profile button:hover {
  transform: translateY(-1px);
}

/* Add these styles to customize the dropdown */

/* Ensure proper scrolling behavior */
.h-screen {
  height: 100vh;
}

/* Hide scrollbar but keep functionality (optional) */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: rgba(155, 155, 155, 0.5) transparent;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgba(155, 155, 155, 0.5);
  border-radius: 20px;
  border: transparent;
}

/* Add these styles for consistent hover effects */
.menu li > a,
.menu li > summary {
  transition: all 0.2s ease;
}

.menu li > a:active,
.menu li > summary:active {
  background-color: rgba(217, 217, 217, 0.25);
}

/* Remove default details marker */
details > summary {
  list-style: none;
}
details > summary::-webkit-details-marker {
  display: none;
}

/* Ensure text colors are consistent */
.menu li > a,
.menu li > summary {
  color: #fff;
}

/* Add hover effect to all menu items */
.menu li > a:hover,
.menu li > summary:hover {
  background-color: rgba(217, 217, 217, 0.15);
  color: white;
}

/* Active state for all menu items */
.menu li > a.active,
.menu li > summary.active {
  background-color: rgba(217, 217, 217, 0.15);
  color: white;
}

/* Reset background colors */
.menu li {
  background-color: transparent;
}

.menu details {
  background-color: transparent !important;
}

.menu details > ul {
  background-color: transparent !important;
}

/* Remove default details styles */
details > summary {
  list-style: none;
}

details > summary::-webkit-details-marker {
  display: none;
}

/* Hover effects */
.menu li > a,
.menu li > summary {
  transition: all 0.2s ease;
}

/* Active states */
.menu li > a:active,
.menu li > summary:active {
  background-color: rgba(217, 217, 217, 0.25);
}

/* Ensure submenu items don't inherit parent's background */
details[open] > ul > li {
  background-color: transparent;
}

details[open] > ul > li > a {
  background-color: transparent;
}

details[open] > ul > li > a:hover {
  background-color: rgba(217, 217, 217, 0.15);
}

/* Add these styles for the dropdown */
.dropdown-content {
  position: absolute;
  right: 0;
}

/* Ensure dropdown is always on top */
.dropdown {
  position: relative;
}

.dropdown details[open] > summary {
  background-color: transparent;
}

.dropdown details[open] > summary:hover {
  background-color: transparent;
}
</style>
