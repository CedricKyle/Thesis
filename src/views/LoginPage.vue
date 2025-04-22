<script setup>
import { ref, onMounted } from 'vue'
import { Lock, IdCard } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/Authentication/authStore'
import { useRouter } from 'vue-router'
import { useRolesStore } from '@/stores/Users & Role/roleStore'

const router = useRouter()
const authStore = useAuthStore()
const rolesStore = useRolesStore()

// Form data
const userId = ref('')
const password = ref('')
const rememberMe = ref(false)
const error = ref('')

// Add this to logout any existing session when the login page is mounted
onMounted(() => {
  authStore.logout() // This will clear the auth state
})

// Add this helper function at the top of the script
function getDepartmentPath(department) {
  if (!department) return ''

  const deptMap = {
    'Super Admin': 'admin',
    'Human Resource': 'hr',
    Finance: 'finance',
    Sales: 'sales',
    'Supply Chain Management': 'scm', // Map SCM correctly
    'Customer Relationship Management': 'crm',
  }

  return deptMap[department] || department.toLowerCase().split(' ')[0]
}

const handleSubmit = async (e) => {
  e.preventDefault()
  error.value = ''

  try {
    const response = await authStore.login(userId.value, password.value)
    console.log('Login response:', response)

    if (response) {
      console.log('Current user:', authStore.currentUser)

      // Get user role and department
      const userRole = authStore.currentUser?.role?.role_name || authStore.currentUser?.role
      const department = authStore.currentUser?.department

      console.log('User role:', userRole)
      console.log('Department:', department)

      // Set the current employee role in the role store
      await rolesStore.setCurrentEmployeeRole({
        role: userRole,
        department: department,
        permissions: authStore.currentUser?.role?.permissions || [],
      })

      // Determine redirect path using the helper function
      let redirectPath = ''

      if (userRole === 'Super Admin') {
        redirectPath = '/admin/hr/dashboard'
      } else {
        const deptPath = getDepartmentPath(department)
        redirectPath = `/${deptPath}/dashboard`
      }

      console.log('Redirecting to:', redirectPath)

      try {
        await router.push(redirectPath)
      } catch (navError) {
        console.error('Navigation error:', navError)
        // Fallback to window.location if router.push fails
        window.location.href = redirectPath
      }
    } else {
      error.value = 'Invalid credentials'
    }
  } catch (err) {
    console.error('Login error:', err)
    error.value = err.message || 'An error occurred during login'
  }
}
</script>

<template>
  <div class="flex w-full justify-center items-center h-screen bg-auth">
    <div class="flex justify-center items-center w-full max-w-md bg-white shadow-md h-96">
      <img class="h-full" src="../assets/Images/Landing-Page.jpg" alt="" />
    </div>
    <div class="w-full max-w-md p-5 bg-primaryColor shadow-md h-96">
      <div class="form-container flex flex-col items-center w-full h-full">
        <div class="logo flex flex-col items-center">
          <img
            class="h-15 w-15"
            src="../assets/Images/countryside-logo.png"
            alt="this is logo img"
          />
          <h1 class="text-2xl font-bold text-secondaryColor">Welcome back,</h1>
        </div>

        <div class="input-container card items-center w-96 p-5">
          <form @submit="handleSubmit" class="w-80 mx-auto">
            <!-- Error message -->
            <div v-if="error" class="text-red-500 text-sm mb-3 text-center">
              {{ error }}
            </div>

            <div class="flex flex-col items-center w-full gap-3">
              <!-- User ID Input -->
              <div class="relative w-full">
                <label class="input bg-white">
                  <IdCard class="text-gray-500 w-5 h-5" />
                  <input
                    v-model="userId"
                    type="text"
                    placeholder="Employee ID"
                    class="placeholder:text-gray-500 text-black w-full"
                    required
                  />
                </label>
              </div>
              <!-- Password Input -->
              <div class="relative w-full">
                <label class="input bg-white">
                  <Lock class="text-gray-500 w-4 h-4" />
                  <input
                    v-model="password"
                    type="password"
                    placeholder="Password"
                    class="placeholder:text-gray-500 text-black w-full"
                    required
                  />
                </label>
              </div>
              <!-- Submit Button -->
              <button type="submit" class="btn-loginStyle w-full h-10">Login</button>
            </div>

            <div class="flex justify-between text-xs mt-2">
              <div class="flex items-center gap-1">
                <input
                  v-model="rememberMe"
                  type="checkbox"
                  class="checkbox checkbox-white checkbox-xs"
                />
                <p>Remember Me</p>
              </div>
              <div class="">
                <p class="hover:text-secondaryColor cursor-pointer transition-all">
                  Forgot Password?
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
