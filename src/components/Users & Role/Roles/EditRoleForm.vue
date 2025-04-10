<script setup>
import { ChevronLeft, ChevronRight, Check } from 'lucide-vue-next'
import { useRouter, useRoute } from 'vue-router'
import { ref, onMounted, onUnmounted } from 'vue'
import { useRolesStore } from '@/stores/Users & Role/roleStore'
import Toast from '@/components/Admin Components/HR/Toast.vue'

const router = useRouter()
const route = useRoute()
const step = ref(1)
const rolesStore = useRolesStore()
const confirmModal = ref(null)

// Form data
const formData = ref({
  roleName: '',
  description: '',
})

// Selected permissions
const selectedPermissions = ref([])

// Form errors
const formErrors = ref({
  roleName: '',
  description: '',
  permissions: '',
})

// Toast state
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// Define permissions structure
const permissionGroups = ref([
  {
    name: 'Roles and Permissions',
    permissions: [
      { id: 1, name: 'Role List' },
      { id: 2, name: 'Create' },
      { id: 3, name: 'Edit' },
      { id: 4, name: 'Delete' },
    ],
  },
  {
    name: 'User Management',
    permissions: [
      { id: 5, name: 'User List' },
      { id: 6, name: 'View' },
      { id: 7, name: 'Create' },
      { id: 8, name: 'Edit' },
      { id: 9, name: 'Delete' },
    ],
  },
])

// Fetch role data on mount
onMounted(async () => {
  try {
    const roleId = route.params.id
    const roleData = await rolesStore.getRoleById(roleId)

    formData.value = {
      roleName: roleData.role_name,
      description: roleData.description || '',
    }
    selectedPermissions.value = roleData.permissions || []
  } catch (error) {
    toastType.value = 'error'
    toastMessage.value = error.message || 'Error loading role data. Please try again.'
    showToast.value = true
  }
})

// Validation functions
const validateGeneralInfo = () => {
  let isValid = true
  formErrors.value = {
    roleName: '',
    description: '',
  }

  if (!formData.value.roleName) {
    formErrors.value.roleName = 'Role Name is required'
    isValid = false
  }
  if (!formData.value.description) {
    formErrors.value.description = 'Description is required'
    isValid = false
  }

  return isValid
}

const validatePermissions = () => {
  let isValid = true
  formErrors.value.permissions = ''

  if (selectedPermissions.value.length === 0) {
    formErrors.value.permissions = 'At least one permission must be selected'
    isValid = false
  }

  return isValid
}

// Handle next/back navigation
const handleNext = () => {
  if (step.value === 1 && validateGeneralInfo()) {
    step.value++
  } else if (step.value === 2 && validatePermissions()) {
    step.value++
  }
}

// Toggle permission selection
const togglePermission = (permissionId) => {
  const index = selectedPermissions.value.indexOf(permissionId)
  if (index === -1) {
    selectedPermissions.value.push(permissionId)
  } else {
    selectedPermissions.value.splice(index, 1)
  }
}

// Submit handling
const handleSubmit = () => {
  confirmModal.value?.showModal()
}

const confirmSave = async () => {
  try {
    const response = await rolesStore.updateRole(route.params.id, {
      'role name': formData.value.roleName,
      description: formData.value.description,
      permissions: selectedPermissions.value,
    })

    toastType.value = response.status === 'unchanged' ? 'info' : 'success'
    toastMessage.value =
      response.status === 'unchanged'
        ? 'No changes were made to the role'
        : 'Role updated successfully'
    showToast.value = true

    confirmModal.value?.close()
    setTimeout(() => {
      router.push('/roles')
    }, 500)
    setTimeout(() => {
      showToast.value = false
    }, 3000)
  } catch (error) {
    toastType.value = 'error'
    toastMessage.value = error.response?.data?.message || 'Error updating role'
    showToast.value = true
    setTimeout(() => {
      showToast.value = false
    }, 3000)
  }
}

const cancelSave = () => {
  confirmModal.value?.close()
}
</script>

<template>
  <div class="container p-5 text-black">
    <div class="title flex items-center gap-2">
      <ChevronLeft
        class="w-6 h-6 cursor-pointer hover:bg-primaryColor/20 rounded-full"
        @click="router.back()"
      />
      <div class="text-[24px] font-semibold">Edit Role</div>
    </div>

    <div class="flex gap-2 flex-col">
      <!-- form status -->
      <div class="bg-white rounded-md p-5 mt-5 border border-gray-200 shadow-sm">
        <!-- steps -->
        <div class="">
          <ul class="steps w-full text-xs [--size:1rem] [--success:var(--color-primaryColor)]">
            <li
              class="step text-gray-400"
              :class="{
                'step-success': step >= 1,
                '!text-black': step === 1,
              }"
            >
              General Information
            </li>
            <li
              class="step text-gray-400"
              :class="{
                'step-success': step >= 2,
                '!text-black': step === 2,
              }"
            >
              Permissions
            </li>
            <li
              class="step text-gray-400"
              :class="{
                'step-success': step >= 3,
                '!text-black': step === 3,
              }"
            >
              Overview
            </li>
          </ul>
        </div>
      </div>

      <!-- Step 1: General Information -->
      <div v-if="step === 1" class="mt-5 border border-gray-200 rounded-md p-5 bg-white shadow-sm">
        <div class="font-semibold">General Information</div>
        <div class="mt-5 grid gap-5">
          <div class="form-control">
            <label class="label">
              <span class="label-text text-black">Role Name</span>
            </label>
            <input
              v-model="formData.roleName"
              type="text"
              class="input input-bordered bg-white text-black"
              :class="{ 'input-error': formErrors.roleName }"
            />
            <label class="label" v-if="formErrors.roleName">
              <span class="label-text-alt text-error">{{ formErrors.roleName }}</span>
            </label>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text text-black">Description</span>
            </label>
            <textarea
              v-model="formData.description"
              class="textarea textarea-bordered bg-white text-black h-24"
              :class="{ 'textarea-error': formErrors.description }"
            ></textarea>
            <label class="label" v-if="formErrors.description">
              <span class="label-text-alt text-error">{{ formErrors.description }}</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Step 2: Permissions -->
      <div v-if="step === 2" class="mt-5 border border-gray-200 rounded-md p-5 bg-white shadow-sm">
        <div class="font-semibold mb-4">Permissions</div>
        <div class="grid gap-6">
          <div v-for="group in permissionGroups" :key="group.name" class="border-b pb-4">
            <h3 class="font-medium mb-3">{{ group.name }}</h3>
            <div class="grid grid-cols-2 gap-3">
              <div
                v-for="permission in group.permissions"
                :key="permission.id"
                class="flex items-center"
              >
                <label class="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    :checked="selectedPermissions.includes(permission.id)"
                    @change="togglePermission(permission.id)"
                    class="checkbox checkbox-primary"
                  />
                  <span class="label-text">{{ permission.name }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div v-if="formErrors.permissions" class="mt-2 text-error text-sm">
          {{ formErrors.permissions }}
        </div>
      </div>

      <!-- Step 3: Overview -->
      <div v-if="step === 3" class="mt-5 border border-gray-200 rounded-md p-5 bg-white shadow-sm">
        <div class="font-semibold mb-4">Overview</div>
        <div class="flex flex-col gap-2 p-5 border border-gray-200 rounded-md">
          <div class="mb-4">
            <h4 class="font-semibold mb-2">General Information</h4>
            <div class="grid gap-2">
              <div class="flex">
                <span class="w-32 text-gray-500">Role Name:</span>
                <span>{{ formData.roleName }}</span>
              </div>
              <div class="flex">
                <span class="w-32 text-gray-500">Description:</span>
                <span>{{ formData.description }}</span>
              </div>
            </div>
          </div>

          <div class="mb-4">
            <h4 class="font-semibold mb-2">Selected Permissions</h4>
            <div class="bg-gray-50 p-4 rounded-md">
              <div v-for="group in permissionGroups" :key="group.name" class="mb-3">
                <h5 class="font-medium text-sm mb-2">{{ group.name }}</h5>
                <div class="grid grid-cols-2 gap-2">
                  <div
                    v-for="permission in group.permissions"
                    :key="permission.id"
                    class="flex items-center"
                  >
                    <span
                      class="text-sm"
                      :class="{
                        'text-gray-500': !selectedPermissions.includes(permission.id),
                        'text-primary': selectedPermissions.includes(permission.id),
                      }"
                    >
                      {{ permission.name }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Buttons -->
    <div class="flex justify-between items-center mt-5">
      <button
        class="btn-secondaryStyle disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="step === 1"
        @click="step--"
      >
        <ChevronLeft class="w-4 h-4" /> Back
      </button>
      <button
        v-if="step < 3"
        class="btn-primaryStyle disabled:cursor-not-allowed disabled:opacity-50"
        @click="handleNext"
      >
        Next <ChevronRight class="w-4 h-4" />
      </button>
      <button v-if="step === 3" class="btn-primaryStyle" @click="handleSubmit">
        Update <Check class="w-4 h-4" />
      </button>
    </div>
  </div>

  <!-- Confirmation Modal -->
  <dialog ref="confirmModal" class="modal">
    <div class="modal-box bg-white w-[400px]">
      <h3 class="font-bold text-lg text-black">Confirm Role Update</h3>
      <div
        class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
      ></div>

      <div class="py-4">
        <p class="text-black mb-4">Are you sure you want to update this role?</p>
        <div class="bg-gray-50 p-4 rounded-md">
          <div class="grid gap-3 text-sm">
            <div class="flex items-center">
              <span class="text-gray-500 w-24">Role Name:</span>
              <span class="text-black">{{ formData.roleName }}</span>
            </div>
            <div class="flex items-center">
              <span class="text-gray-500 w-24">Description:</span>
              <span class="text-black">{{ formData.description }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-action flex justify-center gap-3">
        <button class="btn-primaryStyle" @click="confirmSave">Update</button>
        <button class="btn-secondaryStyle" @click="cancelSave">Cancel</button>
      </div>
    </div>
  </dialog>

  <!-- Update the Toast component usage -->
  <Toast :show="showToast" :type="toastType" :message="toastMessage" custom-class="z-50" />
</template>
