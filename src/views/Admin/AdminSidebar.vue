<script setup>
import { ref, defineAsyncComponent, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePermissions } from '@/composables/Admin Composables/User & Role/role/usePermissions'
import { useRolesStore } from '@/stores/Users & Role/roleStore'
import { useAuthStore } from '@/stores/Authentication/authStore'
import { LogOut, User, Settings } from 'lucide-vue-next'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'
import profilePlaceholder from '@/assets/Images/profile-placeholder.png'

const router = useRouter()
const rolesStore = useRolesStore()
const authStore = useAuthStore()
const employeeStore = useEmployeeStore()

// Current state
const currentTab = ref(null)
const openParentMenu = ref(null)
const isLoading = ref(false)
const currentUserEmployee = ref(null)

const employeeRole = computed(() => rolesStore.getCurrentEmployeeRole())
const { isSuperAdmin, getAdminMenuItems } = usePermissions(employeeRole)

// Loading spinner component
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

// Get admin menu configuration
const menuItems = ref(getAdminMenuItems())

// Watch for role changes to update menu items
watch(
  [() => authStore.currentUser, employeeRole],
  async ([newUser, newRole], [oldUser, oldRole]) => {
    if (newUser && newRole) {
      // Update menu items
      menuItems.value = getAdminMenuItems()

      // If no current tab is set, set default
      if (!currentTab.value) {
        currentTab.value = 'Dashboard'
        openParentMenu.value = 'Human Resource'
      }
    }
  },
  { immediate: true },
)

// Create computed tabs with async components
const tabs = computed(() => {
  const items = { ...menuItems.value }

  // Add async components to each submenu
  Object.keys(items).forEach((parentKey) => {
    const parent = items[parentKey]
    if (parent.submenu) {
      Object.keys(parent.submenu).forEach((subKey) => {
        const route = parent.submenu[subKey].route
        parent.submenu[subKey].component = defineAsyncComponent({
          loader: () => import(`../${route.split('/').slice(2).join('/')}.vue`),
          loadingComponent: LoadingSpinner,
          delay: 1000,
          onLoadingStart: () => {
            isLoading.value = true
          },
          onLoadingComplete: () => {
            isLoading.value = false
          },
        })
      })
    }
  })

  return items
})

// Handle tab switching
const setTab = (tabName, parentTab = null) => {
  currentTab.value = tabName
  if (parentTab) {
    openParentMenu.value = parentTab
  }

  const parentMenu = tabs.value[parentTab]
  if (parentMenu?.submenu?.[tabName]) {
    router.push(parentMenu.submenu[tabName].route)
  }
}

// Initialize based on current route
onMounted(async () => {
  isLoading.value = true
  try {
    await loadCurrentUserData()
    const route = router.currentRoute.value
    const path = route.path.split('/')

    // Find matching menu item
    Object.entries(tabs.value).forEach(([parentKey, parent]) => {
      if (parent.submenu) {
        Object.entries(parent.submenu).forEach(([subKey, sub]) => {
          if (sub.route === route.path) {
            currentTab.value = subKey
            openParentMenu.value = parentKey
          }
        })
      }
    })

    // Default to HR Dashboard if no match found
    if (!currentTab.value) {
      currentTab.value = 'Dashboard'
      openParentMenu.value = 'Human Resource'
      router.push('/admin/hr/dashboard')
    }
  } catch (error) {
    console.error('Error in onMounted:', error)
  } finally {
    isLoading.value = false
  }
})

const loadCurrentUserData = async () => {
  try {
    // Wait for auth store to initialize
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Check auth status and get current user
    const isAuth = await authStore.checkAuth()
    console.log('Auth status:', isAuth)
    console.log('Current user:', authStore.currentUser)

    if (!isAuth || !authStore.currentUser) {
      console.log('Not authenticated or no user data')
      return
    }

    // Load employees if needed
    if (employeeStore.employees.length === 0) {
      console.log('Loading employees...')
      await employeeStore.loadEmployees()
    }

    // Find the current user's employee record
    const userEmail = authStore.currentUser.email
    console.log('Looking for employee with email:', userEmail)

    const userEmployee = employeeStore.employees.find((emp) => emp.email === userEmail)

    if (userEmployee) {
      console.log('Found employee data:', userEmployee)
      currentUserEmployee.value = userEmployee
    } else {
      // If no match found by email, try matching by employee_id
      const employeeById = employeeStore.employees.find(
        (emp) => emp.employee_id === authStore.currentUser.id,
      )
      if (employeeById) {
        console.log('Found employee by ID:', employeeById)
        currentUserEmployee.value = employeeById
      } else {
        console.log('No matching employee found')
      }
    }
  } catch (error) {
    console.error('Error loading employee data:', error)
  }
}

const profileImageUrl = computed(() => {
  if (isLoading.value) return profilePlaceholder

  const employeeData = currentUserEmployee.value
  if (!employeeData?.profile_image_path) return profilePlaceholder

  return `http://localhost:3000/${employeeData.profile_image_path.replace(/^\//, '')}`
})

const navbarDisplayData = computed(() => {
  if (isLoading.value) {
    return {
      name: 'Loading...',
      jobTitle: '',
      role: '',
      email: '',
      department: '',
    }
  }

  const employeeData = currentUserEmployee.value
  if (!employeeData) {
    return {
      name: authStore.currentUser?.full_name || '',
      jobTitle: '',
      role: authStore.currentUser?.role || '',
      email: authStore.currentUser?.email || '',
      department: authStore.currentUser?.department || '',
    }
  }

  return {
    name: employeeData.full_name || '',
    jobTitle: employeeData.job_title || '',
    role: employeeData.role || '',
    email: employeeData.email || '',
    department: employeeData.department || '',
  }
})

const showLogoutModal = ref(false)

const handleLogout = () => {
  showLogoutModal.value = true
}

const confirmLogout = async () => {
  await authStore.logout()
  router.push('/login')
  showLogoutModal.value = false
}

const cancelLogout = () => {
  showLogoutModal.value = false
}
</script>

<template>
  <div class="flex h-screen">
    <!-- Sidebar -->
    <div class="w-80 bg-primaryColor flex flex-col overflow-hidden">
      <div class="flex-1 overflow-y-auto scrollbar-hide">
        <div class="p-4">
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
                    <li v-for="(subItem, subTab) in tab.submenu" :key="subTab">
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
            </li>
          </ul>
        </div>
      </div>

      <div class="p-4 border-t border-gray-700/50">
        <div class="dropdown dropdown-top dropdown-hover dropdown-end w-full">
          <label
            tabindex="0"
            class="cursor-pointer flex items-center gap-3 p-4 hover:bg-gray-300/5 w-full"
          >
            <!-- Employee Image -->
            <div class="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-300 bg-white">
              <img
                :src="profileImageUrl"
                class="w-full h-full object-cover"
                alt="Profile"
                @error="$event.target.src = profilePlaceholder"
                :class="{ 'opacity-50': isLoading }"
                loading="lazy"
              />
            </div>
            <!-- Name and Role -->
            <div class="name-container flex-1">
              <h3 class="font-semibold text-sm text-white">{{ navbarDisplayData.name }}</h3>
              <p class="text-xs text-gray-300">{{ navbarDisplayData.role }}</p>
            </div>
          </label>

          <!-- Dropdown Menu -->
          <ul
            tabindex="0"
            class="dropdown-content menu menu-sm shadow-lg bg-white rounded-box w-full mb-2"
          >
            <li>
              <button
                class="flex items-center gap-2 text-black hover:bg-[rgba(217,217,217,0.15)]"
                @click="router.push('/profile')"
              >
                <User class="w-4 h-4" />
                Profile
              </button>
            </li>
            <li>
              <button
                class="flex items-center gap-2 text-black hover:bg-[rgba(217,217,217,0.15)]"
                @click="router.push('/settings')"
              >
                <Settings class="w-4 h-4" />
                Settings
              </button>
            </li>
            <li>
              <button
                class="flex items-center gap-2 text-red-400 hover:bg-[rgba(217,217,217,0.15)]"
                @click="handleLogout"
              >
                <LogOut class="w-4 h-4" />
                Log out
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 bg-bgColor overflow-hidden flex flex-col">
      <div class="flex-1 p-6 overflow-y-auto">
        <router-view></router-view>
      </div>
    </div>
  </div>

  <div v-if="showLogoutModal" class="fixed inset-0 z-[9999] overflow-y-auto backdrop-blur-sm">
    <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
      <div
        class="relative transform overflow-hidden rounded-lg bg-white/80 backdrop-blur-md text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
      >
        <div class="bg-white/80 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
              <h3 class="text-base font-semibold leading-6 text-gray-900">Confirm Logout</h3>
              <div class="mt-2">
                <p class="text-sm text-gray-500">Are you sure you want to log out?</p>
              </div>
            </div>
          </div>
        </div>
        <div class="bg-gray-50/80 backdrop-blur-md px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
          <button type="button" class="btn-errorStyle ml-2" @click="confirmLogout">
            <LogOut class="h-4 w-4 text-white" />Logout
          </button>
          <button type="button" class="btn-secondaryStyle" @click="cancelLogout">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

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

.dropdown {
  position: relative;
  width: 100%;
}

.dropdown label {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.dropdown label:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.name-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* Profile image styles */
.rounded-full {
  position: relative;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rounded-full img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Dropdown menu positioning */
.dropdown-content {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 0.5rem;
  min-width: 200px;
  z-index: 50;
}

/* Menu item styles */
.menu li > a {
  padding: 0.75rem 1rem;
  transition: all 0.2s ease;
}

.menu li > a:hover {
  background-color: rgba(217, 217, 217, 0.15);
}

.opacity-50 {
  opacity: 0.5;
  transition: opacity 0.3s ease;
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.modal-enter-to,
.modal-leave-from {
  opacity: 1;
  transform: scale(1);
}
</style>
