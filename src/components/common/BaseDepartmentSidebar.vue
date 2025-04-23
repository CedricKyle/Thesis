<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/Authentication/authStore'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'
import { LogOut, User, Settings } from 'lucide-vue-next'
import profilePlaceholder from '@/assets/Images/profile-placeholder.png'

const props = defineProps({
  departmentName: {
    type: String,
    required: true,
  },
  menuItems: {
    type: Array,
    required: true,
  },
  basePath: {
    type: String,
    required: true,
  },
})

const router = useRouter()
const authStore = useAuthStore()
const employeeStore = useEmployeeStore()
const currentTab = ref(null)
const isLoading = ref(true)
const currentUserEmployee = ref(null)
const showLogoutModal = ref(false)

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

// Update the watchers to be more robust
watch(
  [() => authStore.currentUser, () => employeeStore.employees],
  async ([newUser, newEmployees], [oldUser]) => {
    if (newUser && (!oldUser || newUser.email !== oldUser?.email)) {
      console.log('User data changed, reloading employee data')
      await loadCurrentUserData()
    }
  },
  { deep: true },
)

// Profile image URL computed property
const profileImageUrl = computed(() => {
  if (isLoading.value) {
    console.log('Still loading...')
    return profilePlaceholder
  }

  const employeeData = currentUserEmployee.value
  console.log('Current employee data for image:', employeeData)

  if (!employeeData?.profile_image_path) {
    console.log('No profile image path found')
    return profilePlaceholder
  }

  const imageUrl = `http://localhost:3000/${employeeData.profile_image_path.replace(/^\//, '')}`
  console.log('Using image URL:', imageUrl)
  return imageUrl
})

// Navbar display data with proper null checks
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

const visibleMenuItems = computed(() => {
  const userPermissions = authStore.currentUser?.permissions || []

  // Show all items for Super Admin
  if (authStore.currentUser?.role === 'Super Admin') {
    return props.menuItems
  }

  // Filter items based on user's permissions
  return props.menuItems.filter((item) => userPermissions.includes(item.permission))
})

onMounted(async () => {
  isLoading.value = true
  try {
    // Wait a bit for auth store to initialize
    await new Promise((resolve) => setTimeout(resolve, 100))
    await authStore.checkAuth()
    await loadCurrentUserData()
  } catch (error) {
    console.error('Error in onMounted:', error)
  } finally {
    isLoading.value = false
  }
})

const handleLogout = async () => {
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
  <div class="flex">
    <!-- Sidebar -->
    <div class="w-80 h-screen p-4 bg-primaryColor flex flex-col justify-between">
      <div>
        <!-- Logo Section -->
        <div class="logo-section flex items-center mb-5 gap-4">
          <div class="logo-content">
            <img
              src="@/assets/Images/countryside-logo.png"
              alt="Countryside logo"
              class="w-[60px] h-[60px]"
            />
          </div>
          <div class="text-log">
            <h1 class="text-[25px] text-secondaryColor font-bold">Countryside</h1>
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

      <!-- User Profile Section at Bottom -->
      <div class="p-4 border-t border-gray-700/50">
        <div class="dropdown dropdown-top dropdown-end">
          <label
            tabindex="0"
            class="cursor-pointer flex items-center gap-3 p-4 hover:bg-gray-300/5 w-full"
          >
            <!-- Employee Image -->
            <div class="w-10 h-10 rounded-full overflow-hidden ring ring-gray-300">
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
            <div class="name-container">
              <h3 class="font-semibold text-sm text-gray-300">{{ navbarDisplayData.name }}</h3>
              <p v-if="navbarDisplayData.jobTitle" class="text-gray-300 text-xs">
                {{ navbarDisplayData.jobTitle }}
              </p>
            </div>
          </label>
          <!-- Dropdown Menu - Now appears above the profile -->
          <ul
            tabindex="0"
            class="dropdown-content menu menu-sm shadow-lg bg-white rounded-box w-52 mb-2"
          >
            <!-- <li class="menu-title px-4 py-2">
              <span class="text-xs font-thin text-black">Signed in as</span>
              <span class="font-thin text-sm text-black">{{ navbarDisplayData.email }}</span>
            </li> -->
            <li>
              <a
                class="flex items-center gap-2 text-black hover:bg-[rgba(217,217,217,0.15)]"
                @click="router.push('/profile')"
              >
                <User class="w-4 h-4" />
                Profile
              </a>
            </li>
            <li>
              <a
                class="flex items-center gap-2 text-black hover:bg-[rgba(217,217,217,0.15)]"
                @click="router.push('/settings')"
              >
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
                Log out
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col h-screen overflow-hidden">
      <!-- Main Content -->
      <div class="flex-1 p-6 bg-bgColor overflow-y-auto max-h-screen">
        <router-view></router-view>
      </div>
    </div>
  </div>

  <!-- Updated Logout Confirmation Modal -->
  <div v-if="showLogoutModal" class="fixed inset-0 z-[9999] overflow-y-auto backdrop-blur-sm">
    <!-- Modal -->
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
.active-menu {
  background-color: rgba(217, 217, 217, 0.15) !important;
  color: var(--color-secondaryColor) !important;
  border-left: 2px solid !important;
  border-top-right-radius: 0.125rem !important;
  border-bottom-right-radius: 0.125rem !important;
  border-top-left-radius: 0px !important;
  border-bottom-left-radius: 0px !important;
}

/* Dropdown styles */
.dropdown {
  position: relative;
}

.dropdown-content {
  bottom: 100%;
  margin-bottom: 0.5rem;
}

/* Menu item hover effects */
.menu li > a {
  transition: color 0.2s ease;
  transition-property: color;
  background-color: transparent;
}

.menu li > a:hover {
  background-color: rgba(217, 217, 217, 0.15);
}

/* Add loading state styles */
.opacity-50 {
  opacity: 0.5;
  transition: opacity 0.3s ease;
}

/* Ensure proper z-index for dropdown */
.dropdown-content {
  z-index: 999;
}

/* Updated modal styles */
.backdrop-blur-sm {
  backdrop-filter: blur(4px);
  background-color: rgba(255, 255, 255, 0.1);
}

.backdrop-blur-md {
  backdrop-filter: blur(8px);
}

/* Animation classes */
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
