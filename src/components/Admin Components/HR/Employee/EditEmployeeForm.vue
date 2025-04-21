<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'
import { useToast } from '@/composables/Admin Composables/Human Resource/useToast'
import EmployeeForm from './EmployeeForm.vue'
import Toast from '@/components/Admin Components/HR/Toast.vue'

const router = useRouter()
const route = useRoute()
const store = useEmployeeStore()
const { showToast, toastMessage, toastType, showToastMessage } = useToast()

const employeeData = ref(null)
const isLoading = ref(true)
const confirmModal = ref(null)
const formDataToUpdate = ref(null)
const employeeToUpdate = ref(null)

onMounted(async () => {
  try {
    // Get employee ID from route params
    const employeeId = route.params.id

    // Fetch employee data
    const response = await store.getEmployee(employeeId)
    employeeData.value = response
    isLoading.value = false
  } catch (error) {
    console.error('Error loading employee:', error)
    showToastMessage('Error loading employee data', 'error')
    // Redirect back to employee list
    const isAdmin = route.path.startsWith('/admin')
    router.push(isAdmin ? '/admin/hr/employees' : '/hr/employees')
  }
})

const handleUpdate = async (formData) => {
  try {
    // Store the FormData and parse employee data for display
    formDataToUpdate.value = formData
    const employeeDataStr = formData.get('employeeData')
    employeeToUpdate.value = JSON.parse(employeeDataStr)

    // Show confirmation modal
    confirmModal.value?.showModal()
  } catch (error) {
    console.error('Error preparing update:', error)
    showToastMessage('Error preparing update', 'error')
  }
}

const confirmUpdate = async () => {
  try {
    await store.updateEmployee(route.params.id, formDataToUpdate.value)
    showToastMessage('Employee updated successfully', 'success')
    confirmModal.value?.close()

    // Redirect back to employee list after a short delay to show the toast
    setTimeout(() => {
      const isAdmin = route.path.startsWith('/admin')
      router.push(isAdmin ? '/admin/hr/employees' : '/hr/employees')
    }, 1500) // 1.5 second delay
  } catch (error) {
    console.error('Error updating employee:', error)
    showToastMessage(error.message || 'Error updating employee', 'error')
  }
}

const cancelUpdate = () => {
  confirmModal.value?.close()
  formDataToUpdate.value = null
  employeeToUpdate.value = null
}
</script>

<template>
  <div class="p-5">
    <div class="flex items-center gap-2 mb-5">
      <button
        class="btn-secondaryStyle bg-gray-100/0 hover:text-gray-600 border-none text-black shadow-none btn-sm"
        @click="router.back()"
      >
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>
      <h2 class="text-xl font-semibold text-black">Edit Employee</h2>
    </div>

    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <div class="loading loading-spinner loading-lg"></div>
    </div>

    <EmployeeForm v-else :initial-data="employeeData" :is-editing="true" @submit="handleUpdate" />

    <!-- Confirmation Modal -->
    <dialog ref="confirmModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-lg text-black">Confirm Update Employee</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>

        <div v-if="employeeToUpdate" class="py-4">
          <p class="text-center text-black mb-4">
            Are you sure you want to update employee
            <span class="font-bold">{{
              [
                employeeToUpdate.first_name,
                employeeToUpdate.middle_name,
                employeeToUpdate.last_name,
              ]
                .filter(Boolean)
                .join(' ')
            }}</span
            >?
          </p>

          <div class="mt-4 flex flex-col gap-2">
            <div class="flex flex-row">
              <div class="w-32 text-gray-500">Department:</div>
              <div class="text-black">{{ employeeToUpdate.department }}</div>
            </div>
            <div class="flex flex-row">
              <div class="w-32 text-gray-500">Job Title:</div>
              <div class="text-black">{{ employeeToUpdate.job_title }}</div>
            </div>
            <div class="flex flex-row">
              <div class="w-32 text-gray-500">Role:</div>
              <div class="text-black">{{ employeeToUpdate.role }}</div>
            </div>
          </div>
        </div>

        <div class="modal-action justify-center gap-4">
          <button
            class="btn-primaryStyle bg-primaryColor border-none text-white shadow-none"
            @click="confirmUpdate"
          >
            Update Employee
          </button>
          <button
            class="btn-secondaryStyle bg-gray-400 border-none text-white shadow-none"
            @click="cancelUpdate"
          >
            Cancel
          </button>
        </div>
      </div>
    </dialog>

    <!-- Add Toast component -->
    <Toast :show="showToast" :message="toastMessage" :type="toastType" />
  </div>
</template>
