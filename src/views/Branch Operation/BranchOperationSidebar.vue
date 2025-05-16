<script setup>
import { useRoute } from 'vue-router'
import { LayoutDashboard, ShoppingCart, Package, Users } from 'lucide-vue-next'
import { PERMISSION_IDS } from '@/composables/Admin Composables/User & Role/role/permissionsId'
import { useAuthStore } from '@/stores/Authentication/authStore'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'
import { useAttendanceStore } from '@/stores/HR Management/attendanceStore'
import { ref, computed, onMounted } from 'vue'
import profilePlaceholder from '@/assets/Images/profile-placeholder.png'

const route = useRoute()
const authStore = useAuthStore()
const employeeStore = useEmployeeStore()
const attendanceStore = useAttendanceStore()
const currentUserEmployee = ref(null)
const isLoading = ref(true)

const modules = [
  {
    key: 'dashboard',
    icon: LayoutDashboard,
    path: '/branch-operation/dashboard',
    tooltip: 'Dashboard',
    permission: PERMISSION_IDS.BRANCH_OPERATION_VIEW_DASHBOARD,
  },
  {
    key: 'pos',
    icon: ShoppingCart,
    path: '/branch-operation/pos',
    tooltip: 'POS',
    permission: PERMISSION_IDS.BRANCH_OPERATION_MANAGE_POS,
  },
  {
    key: 'sales',
    icon: ShoppingCart,
    path: '/branch-operation/sales',
    tooltip: 'Sales',
    permission: PERMISSION_IDS.BRANCH_OPERATION_MANAGE_SALES,
  },
  {
    key: 'inventory',
    icon: Package,
    path: '/branch-operation/inventory',
    tooltip: 'Inventory',
    permission: PERMISSION_IDS.BRANCH_OPERATION_MANAGE_INVENTORY,
  },
  {
    key: 'employee',
    icon: Users,
    path: '/branch-operation/employee',
    tooltip: 'Employee',
    permission: PERMISSION_IDS.BRANCH_OPERATION_MANAGE_EMPLOYEES,
  },
]

// Profile image URL computed property
const profileImageUrl = computed(() => {
  if (isLoading.value) {
    return profilePlaceholder
  }

  const employeeData = currentUserEmployee.value
  if (!employeeData?.profile_image_path) {
    return profilePlaceholder
  }

  return `http://localhost:3000/${employeeData.profile_image_path.replace(/^\//, '')}`
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
        v-for="mod in modules"
        :key="mod.key"
        :to="mod.path"
        class="group flex items-center justify-center w-12 h-12 transition-all duration-150 relative"
        :class="{
          'icon-active': $route.path === mod.path,
          'icon-inactive hover:bg-gray-400/20 rounded-lg': $route.path !== mod.path,
        }"
      >
        <component :is="mod.icon" class="w-7 h-7" />
        <!-- Tooltip -->
        <span
          class="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 whitespace-nowrap"
        >
          {{ mod.tooltip }}
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
                Profile
              </router-link>
            </li>
            <li>
              <router-link to="/settings" class="text-gray-700 hover:bg-gray-100">
                Settings
              </router-link>
            </li>
            <li>
              <button
                @click="attendanceStore.getTodayAttendance(currentUserEmployee?.employee_id)"
                class="text-gray-700 hover:bg-gray-100"
              >
                View Attendance
              </button>
            </li>
            <li>
              <button @click="authStore.logout()" class="text-red-600 hover:bg-red-50">
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
