<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/Authentication/authStore'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'
import { useAttendanceStore } from '@/stores/HR Management/attendanceStore'
import { LogOut, User, Settings, Timer } from 'lucide-vue-next'
import profilePlaceholder from '@/assets/Images/profile-placeholder.png'

const props = defineProps({
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
const attendanceStore = useAttendanceStore()
const currentUserEmployee = ref(null)
const isLoading = ref(true)
const API_URL = import.meta.env.VITE_API_URL

// Profile image URL computed property
const profileImageUrl = computed(() => {
  if (isLoading.value) {
    return profilePlaceholder
  }

  const employeeData = currentUserEmployee.value
  if (!employeeData?.profile_image_path) {
    return profilePlaceholder
  }

  return `${API_URL}/${employeeData.profile_image_path.replace(/^\//, '')}`
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
    jobTitle: employeeData.positionInfo?.position_title || '',
    role: employeeData.role || '',
    email: employeeData.email || '',
    department: employeeData.department || '',
  }
})

const loadCurrentUserData = async () => {
  try {
    // Wait for auth store to initialize
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Check auth status and get current user
    const isAuth = await authStore.checkAuth()
    if (!isAuth || !authStore.currentUser) {
      return
    }

    // Load employees if needed
    if (employeeStore.employees.length === 0) {
      await employeeStore.loadEmployees()
    }

    // Find the current user's employee record
    const userEmail = authStore.currentUser.email
    const userEmployee = employeeStore.employees.find((emp) => emp.email === userEmail)

    if (userEmployee) {
      currentUserEmployee.value = userEmployee
    } else {
      // If no match found by email, try matching by employee_id
      const employeeById = employeeStore.employees.find(
        (emp) => emp.employee_id === authStore.currentUser.id,
      )
      if (employeeById) {
        currentUserEmployee.value = employeeById
      }
    }
  } catch (error) {
    console.error('Error loading employee data:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  isLoading.value = true
  try {
    await authStore.checkAuth()
    await loadCurrentUserData()
  } catch (error) {
    console.error('Error in onMounted:', error)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <aside
    class="w-20 bg-primaryColor h-screen flex flex-col items-center justify-between py-4 shadow-lg"
  >
    <!-- Logo Only -->
    <div>
      <img src="/countryside-logo.png" alt="Logo" class="w-12 h-12 rounded-full" />
    </div>

    <!-- Icons Only Menu with Tooltip -->
    <nav class="flex-1 flex flex-col items-center gap-6 mt-8">
      <router-link
        v-for="item in menuItems"
        :key="item.name"
        :to="item.path"
        class="group flex items-center justify-center w-12 h-12 transition-all duration-150 relative"
        :class="{
          'icon-active': $route.path === item.path,
          'icon-inactive hover:bg-gray-400/20 rounded-lg': $route.path !== item.path,
        }"
      >
        <component :is="item.icon" class="w-7 h-7" />
        <!-- Tooltip -->
        <span
          class="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 whitespace-nowrap"
        >
          {{ item.name }}
        </span>
      </router-link>
    </nav>

    <!-- Profile Pic Only, aligned right with dropdown -->
    <div class="w-full flex justify-end pr-2">
      <div class="dropdown dropdown-top dropdown-end">
        <label tabindex="0" class="cursor-pointer">
          <img
            :src="profileImageUrl"
            class="w-12 h-12 rounded-full"
            :class="{ 'opacity-50': isLoading }"
            @error="$event.target.src = profilePlaceholder"
            loading="lazy"
          />
        </label>
        <div
          tabindex="0"
          class="dropdown-content menu menu-sm shadow-lg bg-white rounded-box w-52 mb-2"
          style="position: fixed; left: 80px; bottom: 24px; z-index: 9999"
        >
          <div class="p-4 border-b border-gray-200">
            <h3 class="font-medium text-gray-900">{{ navbarDisplayData.name }}</h3>
            <p class="text-sm text-gray-500">{{ navbarDisplayData.jobTitle }}</p>
            <p class="text-xs text-gray-400">{{ navbarDisplayData.department }}</p>
          </div>
          <ul class="p-2">
            <li>
              <router-link to="/profile" class="text-gray-700 hover:bg-gray-100">
                <User class="w-4 h-4 mr-2" />
                Profile
              </router-link>
            </li>
            <li>
              <router-link to="/settings" class="text-gray-700 hover:bg-gray-100">
                <Settings class="w-4 h-4 mr-2" />
                Settings
              </router-link>
            </li>
            <li>
              <button
                @click="attendanceStore.getTodayAttendance(currentUserEmployee?.employee_id)"
                class="text-gray-700 hover:bg-gray-100"
              >
                <Timer class="w-4 h-4 mr-2" />
                View Attendance
              </button>
            </li>
            <li>
              <button @click="authStore.logout()" class="text-red-600 hover:bg-red-50">
                <LogOut class="w-4 h-4 mr-2" />
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.icon-active {
  background-color: rgba(217, 217, 217, 0.15) !important;
  color: #ff9800 !important; /* or your highlight color */
  border-left: 3px solid #ff9800 !important;
  border-radius: 0 0.25rem 0.25rem 0 !important;
}

.icon-inactive {
  color: #fff;
}

/* Dropdown styles */
.dropdown {
  position: relative;
}

.dropdown-content {
  bottom: 100%;
  margin-bottom: 0.5rem;
}

/* Add loading state styles */
.opacity-50 {
  opacity: 0.5;
  transition: opacity 0.3s ease;
}

.dropdown-end .dropdown-content {
  right: 0 !important;
  left: auto !important;
}
</style>
