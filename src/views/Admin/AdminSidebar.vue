<script setup>
import { ref, defineAsyncComponent, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePermissions } from '@/composables/Admin Composables/User & Role/role/usePermissions'
import { useRolesStore } from '@/stores/Users & Role/roleStore'
import { useAuthStore } from '@/stores/Authentication/authStore'

const router = useRouter()
const rolesStore = useRolesStore()
const authStore = useAuthStore()

// Current state
const currentTab = ref(null)
const openParentMenu = ref(null)
const isLoading = ref(false)

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
onMounted(() => {
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
