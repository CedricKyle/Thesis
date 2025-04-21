<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-red-500 mb-4">Access Denied</h1>
      <p class="text-gray-600 mb-4">You don't have permission to access this page.</p>
      <button
        @click="$router.push('/login')"
        class="bg-primaryColor text-white px-4 py-2 rounded hover:bg-opacity-90 cursor-pointer"
      >
        Return to Login
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
</script>
