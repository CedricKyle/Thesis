<script setup>
import { ref, onMounted } from 'vue'
import { Lock, IdCard } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/Authentication/authStore'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()

// Form data
const userId = ref('')
const password = ref('')
const rememberMe = ref(false)
const error = ref('')

// Add this to logout any existing session when the login page is mounted
onMounted(() => {
  authStore.logout() // This will clear the auth state
})

const handleSubmit = async (e) => {
  e.preventDefault()
  error.value = ''

  try {
    const success = await authStore.login(userId.value, password.value)
    if (success) {
      // Let the router handle the redirection based on role
      // Don't redirect here, just let the navigation guard handle it
      if (authStore.currentUser?.role?.role_name === 'Super Admin') {
        router.push('/admin/hr/dashboard')
      } else {
        // Get department from the role
        const department = authStore.currentUser?.role?.department?.toLowerCase()
        if (department) {
          // Convert department name to route path
          const routePath =
            department === 'human resource'
              ? '/hr/dashboard'
              : department === 'supply chain management'
                ? '/scm/dashboard'
                : `/${department.split(' ')[0].toLowerCase()}/dashboard`
          router.push(routePath)
        }
      }
    } else {
      error.value = 'Invalid credentials'
    }
  } catch (err) {
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
