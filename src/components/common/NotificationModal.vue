<template>
  <Transition name="fade">
    <div
      v-if="notificationStore.showNotificationModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2
          class="text-xl font-bold mb-4"
          :class="{
            'text-yellow-600': notificationStore.modalConfig.type === 'warning',
            'text-red-600': notificationStore.modalConfig.type === 'error',
          }"
        >
          {{ notificationStore.modalConfig.title }}
        </h2>
        <p class="text-gray-600 mb-6">
          {{ notificationStore.modalConfig.message }}
        </p>
        <div class="flex justify-end">
          <button
            @click="notificationStore.hideModal"
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { useNotificationStore } from '@/stores/Authentication/notificationStore'

const notificationStore = useNotificationStore()
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
