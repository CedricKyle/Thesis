<script setup>
import { ref, onMounted, computed } from 'vue'
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
const originalData = ref(null)
const changedFields = ref(new Set())

const hasPersonalInfoChanges = computed(() => {
  if (!employeeToUpdate.value || !originalData.value) return false

  return (
    employeeToUpdate.value.firstName !== originalData.value.first_name ||
    employeeToUpdate.value.middleName !== originalData.value.middle_name ||
    employeeToUpdate.value.lastName !== originalData.value.last_name ||
    employeeToUpdate.value.dateOfBirth !== originalData.value.date_of_birth ||
    employeeToUpdate.value.gender !== originalData.value.gender ||
    employeeToUpdate.value.contactNumber !== originalData.value.contact_number ||
    employeeToUpdate.value.email !== originalData.value.email ||
    employeeToUpdate.value.address !== originalData.value.address
  )
})

const hasEmergencyContactChanges = computed(() => {
  if (!employeeToUpdate.value?.emergencyContact || !originalData.value?.emergency_contact)
    return false

  return (
    employeeToUpdate.value.emergencyContact.firstName !==
      originalData.value.emergency_contact.first_name ||
    employeeToUpdate.value.emergencyContact.middleName !==
      originalData.value.emergency_contact.middle_name ||
    employeeToUpdate.value.emergencyContact.lastName !==
      originalData.value.emergency_contact.last_name ||
    employeeToUpdate.value.emergencyContact.relationship !==
      originalData.value.emergency_contact.relationship ||
    employeeToUpdate.value.emergencyContact.contactNumber !==
      originalData.value.emergency_contact.contact_number
  )
})

onMounted(async () => {
  try {
    const employeeId = route.params.id
    const response = await store.getEmployee(employeeId)
    employeeData.value = response
    originalData.value = JSON.parse(JSON.stringify(response)) // Keep original data for comparison
    isLoading.value = false
  } catch (error) {
    console.error('Error loading employee:', error)
    showToastMessage('Error loading employee data', 'error')
    const isAdmin = route.path.startsWith('/admin')
    router.push(isAdmin ? '/admin/hr/employees' : '/hr/employees')
  }
})

const handleFieldChange = (fieldName, value) => {
  if (JSON.stringify(originalData.value[fieldName]) !== JSON.stringify(value)) {
    changedFields.value.add(fieldName)
  } else {
    changedFields.value.delete(fieldName)
  }
}

const handleUpdate = async (formData) => {
  try {
    const employeeDataObj = JSON.parse(formData.get('employeeData'))

    // Check if there are any changes
    const hasChanges =
      Array.from(changedFields.value).length > 0 ||
      formData.has('profile_picture') ||
      formData.has('resume')

    if (!hasChanges) {
      showToastMessage('No changes detected. Update cancelled.', 'info')
      return
    }

    // Only proceed with update if there are changes
    formDataToUpdate.value = formData
    employeeToUpdate.value = {
      ...employeeDataObj,
      changed_fields: Array.from(changedFields.value),
    }
    confirmModal.value?.showModal()
  } catch (error) {
    console.error('Error preparing update:', error)
    showToastMessage('Error preparing update', 'error')
  }
}

const confirmUpdate = async () => {
  try {
    await store.updateEmployee(route.params.id, formDataToUpdate.value)
    // Reload the employee list to get fresh data
    await store.loadEmployees()
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

const formatFieldName = (field) => {
  return field
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
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

    <EmployeeForm
      v-else
      :initial-data="employeeData"
      :is-editing="true"
      @submit="handleUpdate"
      @field-change="handleFieldChange"
    />

    <!-- Confirmation Modal -->
    <dialog ref="confirmModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-lg text-black">Confirm Update Employee</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>

        <div v-if="employeeToUpdate" class="py-4">
          <p class="text-center text-black mb-4">
            Update information for
            <span class="font-bold"
              >{{ employeeToUpdate.first_name }} {{ employeeToUpdate.middle_name }}
              {{ employeeToUpdate.last_name }}</span
            >?
          </p>

          <div class="mt-4 flex flex-col gap-2">
            <template v-if="changedFields.size > 0">
              <div class="text-sm font-semibold mb-2">Changed Fields:</div>
              <template v-for="field in Array.from(changedFields)" :key="field">
                <div class="flex flex-row" v-if="employeeToUpdate[field]">
                  <div class="w-32 text-gray-500">{{ formatFieldName(field) }}:</div>
                  <div class="text-black">{{ employeeToUpdate[field] }}</div>
                </div>
              </template>
            </template>

            <!-- File Updates Section -->
            <template
              v-if="formDataToUpdate?.has('profile_picture') || formDataToUpdate?.has('resume')"
            >
              <div class="text-sm font-semibold mt-3 mb-2">File Updates:</div>
              <div v-if="formDataToUpdate?.has('profile_picture')" class="flex flex-row">
                <div class="w-32 text-gray-500">Profile Image:</div>
                <div class="text-black">New image selected</div>
              </div>
              <div v-if="formDataToUpdate?.has('resume')" class="flex flex-row">
                <div class="w-32 text-gray-500">Resume:</div>
                <div class="text-black">New resume selected</div>
              </div>
            </template>
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
