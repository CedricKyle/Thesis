<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/Authentication/authStore'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'
import { useAttendanceStore } from '@/stores/HR Management/attendanceStore'
import { LogOut, User, Settings, Timer, X } from 'lucide-vue-next'
import profilePlaceholder from '@/assets/Images/profile-placeholder.png'
import { useAttendanceLogic } from '@/composables/Admin Composables/Human Resource/useAttendanceLogic'

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
const attendanceStore = useAttendanceStore()
const currentTab = ref(null)
const isLoading = ref(true)
const currentUserEmployee = ref(null)
const showLogoutModal = ref(false)
const showAddAttendanceModal = ref(false)
const currentDateTime = ref(new Date())
const todayAttendance = ref(null)
const isProcessing = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success') // 'success', 'error', 'warning'
const lastCheckedDay = ref(new Date().getDate())

// Add this before onMounted
let dayCheckInterval = null

const setupDayCheck = () => {
  // Set up an interval to check for day change
  const checkDayChange = () => {
    const now = new Date()
    const currentDay = now.getDate()

    if (lastCheckedDay.value !== currentDay) {
      loadTodayAttendance() // Reload attendance data when day changes
      lastCheckedDay.value = currentDay
    }
  }

  // Check every minute for day change
  dayCheckInterval = setInterval(checkDayChange, 60000)
}

// Register cleanup first
onBeforeUnmount(() => {
  if (dayCheckInterval) {
    clearInterval(dayCheckInterval)
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
    await new Promise((resolve) => setTimeout(resolve, 100))
    await authStore.checkAuth()
    await loadCurrentUserData()

    // Load and reset attendance if needed
    await attendanceStore.resetDailyAttendance()
    attendanceStore.loadRecords()
    await loadTodayAttendance()

    // Setup day check after everything is loaded
    setupDayCheck()
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

const handleAddAttendance = async () => {
  console.log('Opening attendance modal...')
  console.log('Current user employee:', currentUserEmployee.value)
  await loadTodayAttendance()
  showAddAttendanceModal.value = true
}

// Update time every second
setInterval(() => {
  currentDateTime.value = new Date()
}, 1000)

// Computed properties for formatted date and time
const formattedDate = computed(() => {
  return currentDateTime.value.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

const formattedTime = computed(() => {
  return currentDateTime.value.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
})

// Update the canTimeIn computed property
const canTimeIn = computed(() => {
  const attendance = attendanceStore.todayAttendance
  const result =
    !attendance || attendance.signIn === '-' || attendance.id?.toString().startsWith('absent-')
  console.log('canTimeIn computed:', { attendance, result })
  return result
})

// Update the canTimeOut computed property
const canTimeOut = computed(() => {
  const attendance = attendanceStore.todayAttendance
  if (!attendance) {
    console.log('canTimeOut: No attendance found')
    return false
  }

  // Check both time_in/time_out and signIn/signOut
  const hasTimeIn = Boolean(
    (attendance.time_in && attendance.time_in !== '-') ||
      (attendance.signIn && attendance.signIn !== '-'),
  )

  const hasTimeOut = Boolean(
    (attendance.time_out && attendance.time_out !== '-') ||
      (attendance.signOut && attendance.signOut !== '-'),
  )

  const result = hasTimeIn && !hasTimeOut
  console.log('canTimeOut computed:', {
    attendance,
    hasTimeIn,
    hasTimeOut,
    result,
  })
  return result
})

// Toast function
const showToastMessage = (message, type = 'success') => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// Time In/Out handlers
const handleTimeIn = async () => {
  if (!currentUserEmployee.value?.employee_id) {
    showToastMessage('Employee information not found', 'error')
    return
  }

  console.log('Current employee:', currentUserEmployee.value)
  isProcessing.value = true
  try {
    // Check for day change first
    await attendanceStore.resetDailyAttendance()

    // Check for existing attendance
    const existingAttendance = await attendanceStore.getTodayAttendance(
      currentUserEmployee.value.employee_id,
    )

    if (
      existingAttendance &&
      existingAttendance.signIn &&
      existingAttendance.signIn !== '-' &&
      !existingAttendance.id?.toString().startsWith('absent-')
    ) {
      showToastMessage('You have already timed in for today', 'error')
      return
    }

    const result = await attendanceStore.recordTimeIn(currentUserEmployee.value.employee_id)
    console.log('Time in result:', result)
    showToastMessage(`Time In recorded successfully at ${formattedTime.value}`)
    await loadTodayAttendance()
  } catch (error) {
    console.error('Time in error:', error)
    showToastMessage(error.message || 'Failed to record Time In', 'error')
  } finally {
    isProcessing.value = false
  }
}

const handleTimeOut = async () => {
  if (!currentUserEmployee.value?.employee_id) {
    showToastMessage('Employee information not found', 'error')
    return
  }

  // Check for day change first
  await attendanceStore.resetDailyAttendance()

  // Get latest attendance data
  const currentAttendance = await attendanceStore.getTodayAttendance(
    currentUserEmployee.value.employee_id,
  )

  if (!currentAttendance || !currentAttendance.signIn || currentAttendance.signIn === '-') {
    showToastMessage('You need to Time In first', 'error')
    return
  }

  if (currentAttendance.signOut && currentAttendance.signOut !== '-') {
    showToastMessage('You have already Timed Out for today', 'error')
    return
  }

  isProcessing.value = true
  try {
    const result = await attendanceStore.recordTimeOut(currentUserEmployee.value.employee_id)
    console.log('Time out result:', result)

    if (result.overtime > 0) {
      showToastMessage(
        `Time Out recorded successfully at ${formattedTime.value}. Overtime: ${result.overtime} hours`,
        'success',
      )
    } else {
      showToastMessage(`Time Out recorded successfully at ${formattedTime.value}`)
    }

    await loadTodayAttendance()
  } catch (error) {
    console.error('Time out error:', error)
    showToastMessage(error.message || 'Failed to record Time Out', 'error')
  } finally {
    isProcessing.value = false
  }
}

// Load today's attendance data
const loadTodayAttendance = async () => {
  if (currentUserEmployee.value?.employee_id) {
    try {
      console.log('=== Starting loadTodayAttendance ===')
      console.log('Employee ID:', currentUserEmployee.value.employee_id)

      const attendance = await attendanceStore.getTodayAttendance(
        currentUserEmployee.value.employee_id,
      )

      console.log('Raw attendance data from backend:', attendance)

      if (attendance) {
        console.log('Mapping attendance data...')
        // Map the backend data structure to match frontend expectations
        const mappedAttendance = {
          id: attendance.id,
          employee_id: attendance.employee_id,
          full_name: attendance.employee?.full_name || currentUserEmployee.value.full_name,
          department: attendance.employee?.department || currentUserEmployee.value.department,
          signIn: attendance.time_in || '-',
          signOut: attendance.time_out || '-',
          status: attendance.status || 'Absent',
          approvalStatus: attendance.approval_status || 'Not Submitted',
          overtime: attendance.overtime_hours || 0,
          workingHours: attendance.working_hours || 0,
          approvedBy: attendance.approved_by || null,
          approvedAt: attendance.approved_at || null,
          // Add these to ensure consistency
          time_in: attendance.time_in || '-',
          time_out: attendance.time_out || '-',
        }
        console.log('Mapped attendance data:', mappedAttendance)
        attendanceStore.todayAttendance = mappedAttendance
      } else {
        console.log('No attendance found, creating default record')
        // Initialize default attendance if none exists
        const defaultAttendance = {
          employee_id: currentUserEmployee.value.employee_id,
          full_name: currentUserEmployee.value.full_name,
          department: currentUserEmployee.value.department,
          signIn: '-',
          signOut: '-',
          time_in: '-',
          time_out: '-',
          status: 'Absent',
          approvalStatus: 'Not Submitted',
        }
        attendanceStore.todayAttendance = defaultAttendance
      }

      todayAttendance.value = attendanceStore.todayAttendance
      console.log('Final todayAttendance value:', todayAttendance.value)
    } catch (error) {
      console.error('Error in loadTodayAttendance:', error)
      showToastMessage('Error loading attendance data', 'error')
    }
  }
}

// Watch for modal open/close
watch(
  showAddAttendanceModal,
  async (newValue) => {
    console.log('Modal visibility changed:', newValue)
    if (newValue) {
      console.log('Modal opened, loading attendance data')
      await loadTodayAttendance()
    }
  },
  { immediate: true },
)

// Add this watch effect after your existing watches
watch(
  () => attendanceStore.todayAttendance,
  (newAttendance) => {
    console.log('todayAttendance store updated:', newAttendance)
    if (newAttendance) {
      todayAttendance.value = { ...newAttendance }
      console.log('Local todayAttendance updated:', todayAttendance.value)
    }
  },
  { deep: true },
)
</script>

<template>
  <div class="flex h-screen">
    <!-- Sidebar -->
    <div class="w-80 bg-primaryColor flex flex-col overflow-hidden">
      <div class="flex-1 overflow-y-auto scrollbar-hide">
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
              class="flex items-center gap-3 p-3 hover:bg-primaryColor/20 rounded-xs text-white"
              :class="{ 'active-menu': currentTab === item.name }"
              @click="currentTab = item.name"
            >
              <component :is="item.icon" class="w-6 h-6 mr-3" />
              {{ item.name }}
            </router-link>
          </li>
        </ul>
      </div>

      <!-- User Profile Section at Bottom -->
      <div class="p-4 border-t border-gray-700/50">
        <div class="dropdown dropdown-top dropdown-hover dropdown-end w-full">
          <!-- Profile Button -->
          <label
            tabindex="0"
            class="cursor-pointer flex items-center gap-3 p-4 hover:bg-gray-300/15 hover:rounded-md"
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

          <!-- Menu Items -->
          <div
            tabindex="0"
            class="dropdown-content menu menu-sm shadow-lg bg-white rounded-box w-full mb-2"
          >
            <li>
              <button
                @click="router.push('/profile')"
                class="flex items-center gap-2 text-black hover:bg-[rgba(217,217,217,0.15)]"
              >
                <User class="w-4 h-4" />
                Profile
              </button>
            </li>
            <li>
              <button
                @click="router.push('/settings')"
                class="flex items-center gap-2 text-black hover:bg-[rgba(217,217,217,0.15)]"
              >
                <Settings class="w-4 h-4" />
                Settings
              </button>
            </li>
            <li>
              <button
                @click="handleAddAttendance"
                class="flex items-center gap-2 text-black hover:bg-[rgba(217,217,217,0.15)]"
              >
                <Timer class="w-4 h-4" />
                Add Attendance
              </button>
            </li>
            <li>
              <button
                @click="handleLogout"
                class="flex items-center gap-2 text-red-400 hover:bg-[rgba(217,217,217,0.15)]"
              >
                <LogOut class="w-4 h-4" />
                Log out
              </button>
            </li>
          </div>
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

  <!-- Add Attendance Modal -->
  <div
    v-if="showAddAttendanceModal"
    class="fixed inset-0 z-[9999] overflow-y-auto backdrop-blur-sm"
  >
    <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
      <div
        class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
      >
        <!-- Close button -->
        <button
          @click="showAddAttendanceModal = false"
          class="btn-secondaryStyle bg-transparent text-black hover:text-gray-500 absolute right-2 top-2"
        >
          <X class="h-5 w-5" />
        </button>

        <!-- Header -->
        <div class="px-4 pt-5 pb-4">
          <h3 class="font-bold text-lg text-black">Add Attendance</h3>
          <div
            class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
          />

          <!-- Attendance Info -->
          <div class="pt-4 flex flex-col gap-2 text-sm">
            <!-- Date and Time -->
            <div class="text-gray-600">{{ formattedDate }} {{ formattedTime }}</div>

            <!-- Employee Info -->
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">Employee:</div>
              <div class="text-primaryColor">
                {{
                  attendanceStore.todayAttendance?.full_name ||
                  currentUserEmployee.value?.full_name ||
                  '-'
                }}
              </div>
            </div>

            <!-- Department -->
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">Department:</div>
              <div class="text-primaryColor">
                {{
                  attendanceStore.todayAttendance?.department ||
                  currentUserEmployee.value?.department ||
                  '-'
                }}
              </div>
            </div>

            <!-- Time In -->
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">Time In:</div>
              <div class="text-green-600">
                {{
                  attendanceStore.todayAttendance?.signIn ||
                  attendanceStore.todayAttendance?.time_in ||
                  '-'
                }}
              </div>
            </div>

            <!-- Time Out -->
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">Time Out:</div>
              <div class="text-red-400">
                {{
                  attendanceStore.todayAttendance?.signOut ||
                  attendanceStore.todayAttendance?.time_out ||
                  '-'
                }}
              </div>
            </div>

            <!-- Status -->
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">Status:</div>
              <div
                :class="{
                  'text-green-600': attendanceStore.todayAttendance?.status === 'Present',
                  'text-yellow-600': attendanceStore.todayAttendance?.status === 'Late',
                  'text-red-600':
                    !attendanceStore.todayAttendance?.signIn ||
                    attendanceStore.todayAttendance?.status === 'Absent',
                }"
              >
                {{
                  !attendanceStore.todayAttendance?.signIn
                    ? 'Absent'
                    : attendanceStore.todayAttendance?.status || 'Absent'
                }}
              </div>
            </div>

            <!-- Overtime -->
            <div class="flex flex-row" v-if="attendanceStore.todayAttendance?.overtime">
              <div class="w-40 text-gray-500">Overtime:</div>
              <div class="text-blue-600">{{ attendanceStore.todayAttendance.overtime }} hours</div>
            </div>

            <!-- Add Approval Status -->
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">Approval Status:</div>
              <div
                :class="{
                  'text-green-600': attendanceStore.todayAttendance?.approvalStatus === 'Approved',
                  'text-yellow-600': attendanceStore.todayAttendance?.approvalStatus === 'Pending',
                  'text-red-600': !attendanceStore.todayAttendance?.approvalStatus,
                }"
              >
                {{ attendanceStore.todayAttendance?.approvalStatus || 'Not Submitted' }}
              </div>
            </div>

            <!-- Add Approved By (if approved) -->
            <div
              class="flex flex-row"
              v-if="attendanceStore.todayAttendance?.approvalStatus === 'Approved'"
            >
              <div class="w-40 text-gray-500">Approved By:</div>
              <div class="text-gray-700">
                {{ attendanceStore.todayAttendance?.approvedBy || '-' }}
              </div>
            </div>

            <!-- Add Approval Time (if approved) -->
            <div
              class="flex flex-row"
              v-if="attendanceStore.todayAttendance?.approvalStatus === 'Approved'"
            >
              <div class="w-40 text-gray-500">Approved At:</div>
              <div class="text-gray-700">
                {{
                  attendanceStore.todayAttendance?.approvedAt
                    ? new Date(attendanceStore.todayAttendance.approvedAt).toLocaleString()
                    : '-'
                }}
              </div>
            </div>
          </div>
        </div>

        <!-- Buttons Section -->
        <div class="bg-gray-50 px-4 py-3">
          <div class="flex flex-col gap-4">
            <div class="flex w-full gap-4">
              <!-- Time In Button -->
              <button
                class="btn-primaryStyle flex-1"
                :disabled="isProcessing || !canTimeIn"
                @click="handleTimeIn"
              >
                <span v-if="isProcessing">Processing...</span>
                <span v-else>{{ canTimeIn ? 'Time In' : 'Already Timed In' }}</span>
              </button>

              <!-- Time Out Button -->
              <button
                v-if="
                  attendanceStore.todayAttendance?.signIn ||
                  attendanceStore.todayAttendance?.time_in
                "
                class="btn-errorStyle flex-1"
                :disabled="isProcessing || !canTimeOut"
                @click="handleTimeOut"
              >
                <span v-if="isProcessing">Processing...</span>
                <span v-else>{{ canTimeOut ? 'Time Out' : 'Already Timed Out' }}</span>
              </button>
            </div>

            <!-- Close Button -->
            <button class="btn-secondaryStyle w-full" @click="showAddAttendanceModal = false">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Toast Notification -->
  <div
    v-if="showToast"
    :class="{
      'fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-[10000] transition-all duration-300': true,
      'bg-green-100 text-green-800': toastType === 'success',
      'bg-red-100 text-red-800': toastType === 'error',
      'bg-yellow-100 text-yellow-800': toastType === 'warning',
    }"
  >
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <!-- Success Icon -->
        <svg
          v-if="toastType === 'success'"
          class="h-5 w-5 text-green-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clip-rule="evenodd"
          />
        </svg>
        <!-- Error Icon -->
        <svg
          v-if="toastType === 'error'"
          class="h-5 w-5 text-red-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clip-rule="evenodd"
          />
        </svg>
        <!-- Warning Icon -->
        <svg
          v-if="toastType === 'warning'"
          class="h-5 w-5 text-yellow-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clip-rule="evenodd"
          />
        </svg>
      </div>
      <div class="ml-3">
        <p class="text-sm font-medium">{{ toastMessage }}</p>
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
