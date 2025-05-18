<script setup>
import { ref } from 'vue'
import { employeeAPI } from '@/services/main branch/api'
import { EyeIcon, EyeOffIcon } from 'lucide-vue-next'

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const message = ref('')
const messageType = ref('') // 'success' or 'error'
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const showConfirmModal = ref(false)

const resetForm = () => {
  currentPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  showCurrentPassword.value = false
  showNewPassword.value = false
  showConfirmPassword.value = false
}

const changePassword = async () => {
  // Reset message
  message.value = ''
  messageType.value = ''

  // Validation
  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
    message.value = 'All fields are required'
    messageType.value = 'error'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    message.value = 'New password and confirmation do not match'
    messageType.value = 'error'
    return
  }

  if (newPassword.value.length < 6) {
    message.value = 'Password must be at least 6 characters long'
    messageType.value = 'error'
    return
  }

  if (currentPassword.value === newPassword.value) {
    message.value = 'New password must be different from current password'
    messageType.value = 'error'
    return
  }

  isLoading.value = true

  try {
    console.log('Attempting to change password...')
    const response = await employeeAPI.changePassword({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
      confirmPassword: confirmPassword.value,
    })

    console.log('Password change response:', response)

    message.value = 'Password changed successfully'
    messageType.value = 'success'
    resetForm()
    showConfirmModal.value = false
  } catch (error) {
    console.error('Password change error:', error)
    if (error.response?.data?.message) {
      message.value = error.response.data.message
    } else {
      message.value = 'Error changing password. Please try again.'
    }
    messageType.value = 'error'
  } finally {
    isLoading.value = false

    // Clear success message after 3 seconds
    if (messageType.value === 'success') {
      setTimeout(() => {
        message.value = ''
        messageType.value = ''
      }, 3000)
    }
  }
}
</script>

<template>
  <div class="bg-white rounded-lg shadow-md p-6 text-black">
    <h3 class="text-xl font-semibold mb-4 text-primaryColor border-b pb-2">Change Password</h3>

    <!-- Feedback message -->
    <div
      v-if="message"
      class="mb-4 p-3 rounded"
      :class="{
        'bg-green-100 text-green-800 border border-green-200': messageType === 'success',
        'bg-red-100 text-red-800 border border-red-200': messageType === 'error',
      }"
    >
      {{ message }}
    </div>

    <form @submit.prevent="showConfirmModal = true" class="space-y-4">
      <!-- Current Password -->
      <div>
        <label for="currentPassword" class="block mb-1 text-sm font-medium text-gray-700">
          Current Password
        </label>
        <div class="relative">
          <input
            :type="showCurrentPassword ? 'text' : 'password'"
            id="currentPassword"
            v-model="currentPassword"
            class="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primaryColor focus:border-primaryColor"
            placeholder="Enter current password"
          />
          <button
            type="button"
            @click="showCurrentPassword = !showCurrentPassword"
            class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
          >
            <EyeIcon v-if="!showCurrentPassword" class="h-5 w-5" />
            <EyeOffIcon v-else class="h-5 w-5" />
          </button>
        </div>
      </div>

      <!-- New Password -->
      <div>
        <label for="newPassword" class="block mb-1 text-sm font-medium text-gray-700">
          New Password
        </label>
        <div class="relative">
          <input
            :type="showNewPassword ? 'text' : 'password'"
            id="newPassword"
            v-model="newPassword"
            class="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primaryColor focus:border-primaryColor"
            placeholder="Enter new password"
          />
          <button
            type="button"
            @click="showNewPassword = !showNewPassword"
            class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
          >
            <EyeIcon v-if="!showNewPassword" class="h-5 w-5" />
            <EyeOffIcon v-else class="h-5 w-5" />
          </button>
        </div>
        <p class="mt-1 text-sm text-gray-500">Password must be at least 6 characters long</p>
      </div>

      <!-- Confirm Password -->
      <div>
        <label for="confirmPassword" class="block mb-1 text-sm font-medium text-gray-700">
          Confirm New Password
        </label>
        <div class="relative">
          <input
            :type="showConfirmPassword ? 'text' : 'password'"
            id="confirmPassword"
            v-model="confirmPassword"
            class="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primaryColor focus:border-primaryColor"
            placeholder="Confirm new password"
          />
          <button
            type="button"
            @click="showConfirmPassword = !showConfirmPassword"
            class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
          >
            <EyeIcon v-if="!showConfirmPassword" class="h-5 w-5" />
            <EyeOffIcon v-else class="h-5 w-5" />
          </button>
        </div>
      </div>

      <!-- Submit Button -->
      <div>
        <button
          type="submit"
          class="w-full px-4 py-2 text-white bg-primaryColor rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryColor"
          :disabled="isLoading"
        >
          <span v-if="isLoading" class="flex items-center justify-center">
            <svg
              class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Changing Password...
          </span>
          <span v-else>Change Password</span>
        </button>
      </div>
    </form>

    <dialog :open="showConfirmModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-lg text-black">Confirm Password Change</h3>
        <div class="divider"></div>
        <p class="py-4 text-center text-black">Are you sure you want to change your password?</p>
        <div class="modal-action justify-center gap-2">
          <button
            class="btn-primaryStyle"
            @click="
              () => {
                showConfirmModal = false
                changePassword()
              }
            "
          >
            Yes, Change Password
          </button>
          <button class="btn-secondaryStyle" @click="showConfirmModal = false">Cancel</button>
        </div>
      </div>
    </dialog>
  </div>
</template>
