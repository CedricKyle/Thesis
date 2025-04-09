<script setup>
import { Lock, Mail } from 'lucide-vue-next'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useNotification } from '@/composables/Admin Composables/User & Role/role/useNotification'

const router = useRouter()
const authStore = useAuthStore()
const { showNotification } = useNotification()

// Form data
const formData = ref({
  email: '',
  password: '',
})

// Form errors
const formErrors = ref({
  email: '',
  password: '',
})

// Validate form
const validateForm = () => {
  let isValid = true
  formErrors.value = {
    email: '',
    password: '',
  }

  // Email validation
  if (!formData.value.email) {
    formErrors.value.email = 'Email is required'
    isValid = false
  } else if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(formData.value.email)) {
    formErrors.value.email = 'Please enter a valid Gmail address'
    isValid = false
  }

  // Password validation
  if (!formData.value.password) {
    formErrors.value.password = 'Password is required'
    isValid = false
  } else if (formData.value.password.length < 8) {
    formErrors.value.password = 'Password must be at least 8 characters'
    isValid = false
  }

  return isValid
}

// Handle form submission
const submitForm = async () => {
  if (!validateForm()) {
    showNotification('Please check your input', 'error')
    return
  }

  try {
    const success = await authStore.login(formData.value)
    if (success) {
      showNotification('Login successful', 'success')
      router.push({ name: 'Dashboard' }) // Adjust route name as needed
    }
  } catch (error) {
    showNotification(error.message, 'error')
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
          <form @submit.prevent="submitForm" class="w-80 mx-auto">
            <div class="flex flex-col items-center w-full gap-3">
              <!-- Email Input -->
              <div class="relative w-full">
                <label class="input bg-white">
                  <Mail class="text-gray-500" />
                  <input
                    v-model="formData.email"
                    type="email"
                    placeholder="Email"
                    class="placeholder:text-gray-500 text-black w-full"
                  />
                </label>
                <span class="text-red-500 text-xs">{{ formErrors.email }}</span>
              </div>
              <!-- Password Input -->
              <div class="relative w-full">
                <label class="input bg-white">
                  <Lock class="text-gray-500 w-5 h-5" />
                  <input
                    v-model="formData.password"
                    type="password"
                    placeholder="Password"
                    class="placeholder:text-gray-500 text-black w-full"
                  />
                </label>
                <span class="text-red-500 text-xs">{{ formErrors.password }}</span>
              </div>
              <!-- Submit Button -->
              <button type="submit" class="btn bg-secondaryColor border-none w-full">Login</button>
            </div>
            <p class="text-center mt-5 text-[12px]">All Right Reserved | 2025</p>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
