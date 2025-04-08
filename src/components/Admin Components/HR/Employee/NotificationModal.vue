<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    default: 'success',
    validator: (value) => {
      return ['success', 'error', 'warning', 'info', ''].includes(value)
    },
  },
  title: {
    type: String,
    default: '',
  },
  message: {
    type: String,
    default: '',
  },
  onClose: {
    type: Function,
    required: true,
  },
})
</script>

<template>
  <dialog :open="show" class="modal">
    <div class="modal-box bg-white text-black">
      <div class="flex items-center gap-2">
        <!-- Success Icon -->
        <div v-if="type === 'success'" class="text-green-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <!-- Error Icon -->
        <div v-else class="text-red-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
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
        <h3 class="font-bold text-lg">{{ title }}</h3>
      </div>

      <p class="py-4">{{ message }}</p>

      <div class="modal-action">
        <button
          @click="onClose"
          :class="[
            'btn btn-sm border-none text-white shadow-none',
            type === 'success' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600',
          ]"
        >
          Close
        </button>
      </div>
    </div>
  </dialog>
</template>
