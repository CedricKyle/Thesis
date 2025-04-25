<template>
  <div class="fixed inset-0 bg-white flex flex-col items-center justify-center z-[9999]">
    <div class="text-center p-8 max-w-lg">
      <div class="mb-6">
        <svg
          class="mx-auto h-16 w-16 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h1 class="text-2xl font-bold text-red-600 mb-4">{{ title }}</h1>
      <p class="text-gray-700 mb-6">{{ message }}</p>
      <button @click="handleLogin" class="btn-primaryStyle">Back to Login</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/Authentication/authStore'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const title = computed(() => {
  switch (route.query.reason) {
    case 'role_changed':
      return 'Role Changed'
    case 'session_expired':
      return 'Session Expired'
    default:
      return 'Unauthorized Access'
  }
})

const message = computed(() => {
  return route.query.message || 'You are not authorized to access this page.'
})

const handleLogin = async () => {
  // Add a small delay before redirecting
  setTimeout(async () => {
    await authStore.logout()
    router.push('/login')
  })
}
</script>
