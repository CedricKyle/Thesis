<script setup>
import { ChevronLeft, ChevronRight, Check, Dot } from 'lucide-vue-next'
import { useRouter, useRoute } from 'vue-router'
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRolesStore } from '@/stores/Users & Role/roleStore'
import Toast from '@/components/Admin Components/HR/Toast.vue'
import {
  PERMISSION_IDS,
  permissionGroups,
  DEPARTMENTS,
} from '@/composables/Admin Composables/User & Role/role/permissionsId'

// Define props
const props = defineProps({
  id: {
    type: [String, Number],
    required: false,
  },
})

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

// Replace the existing permissionGroups ref with the imported one
const permissionGroupsRef = ref(permissionGroups)

// Add these after your existing refs
const groupSelectState = ref({})

// Add department selection
const selectedDepartment = ref('')
const departments = Object.values(DEPARTMENTS)

// Initialize group select state
onMounted(() => {
  permissionGroupsRef.value.forEach((group) => {
    groupSelectState.value[group.name] = false
  })
})

// Update the fetch role data function
onMounted(async () => {
  try {
    const roleId = props.id || route.params.id
    console.log('Fetching role with ID:', roleId)

    if (!roleId) {
      throw new Error('Role ID is required')
    }

    const roleData = await rolesStore.getRoleById(roleId)
    console.log('Fetched role data:', roleData)

    if (!roleData) {
      throw new Error('Role not found')
    }

    // Update form data
    formData.value = {
      roleName: roleData.role_name || '',
      description: roleData.description || '',
    }

    // Set department
    selectedDepartment.value = roleData.department || ''

    // Handle permissions with better error handling
    let permissions = []
    try {
      if (typeof roleData.permissions === 'string') {
        permissions = JSON.parse(roleData.permissions)
      } else if (Array.isArray(roleData.permissions)) {
        permissions = roleData.permissions
      }
    } catch (e) {
      console.error('Error parsing permissions:', e)
      permissions = []
    }

    selectedPermissions.value = permissions

    // Update group select states
    permissionGroupsRef.value.forEach((group) => {
      groupSelectState.value[group.name] = isGroupFullySelected(group.name)
    })
  } catch (error) {
    console.error('Error loading role:', error)
    toastType.value = 'error'
    toastMessage.value = error.message || 'Error loading role data'
    showToast.value = true

    // Redirect back to roles list after error
    setTimeout(() => {
      const isAdmin = route.path.startsWith('/admin')
      router.push(isAdmin ? '/admin/hr/roles' : '/hr/roles')
    }, 2000)
  }
})

// Update the filteredPermissionGroups computed property
const filteredPermissionGroups = computed(() => {
  if (!selectedDepartment.value) return []

  // For Super Admin, show all permissions
  if (formData.value.roleName === 'Super Admin') {
    return permissionGroupsRef.value
  }

  // For Finance Manager, show Finance permissions
  if (formData.value.roleName === 'Finance Manager') {
    return permissionGroupsRef.value.filter(
      (group) => group.department === DEPARTMENTS.FINANCE || group.name === 'Finance Management',
    )
  }

  // For other roles, filter by department
  return permissionGroupsRef.value.filter((group) => group.department === selectedDepartment.value)
})

// Validation functions
const validateGeneralInfo = () => {
  let isValid = true
  formErrors.value = {
    roleName: '',
    description: '',
    department: '',
  }

  if (!formData.value.roleName) {
    formErrors.value.roleName = 'Role Name is required'
    isValid = false
  }
  if (!formData.value.description) {
    formErrors.value.description = 'Description is required'
    isValid = false
  }
  if (!selectedDepartment.value && formData.value.roleName !== 'Super Admin') {
    formErrors.value.department = 'Department is required'
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
    const roleId = props.id || route.params.id

    // Clear existing permissions when department changes
    let updatedPermissions = []
    if (selectedPermissions.value.length > 0) {
      // Filter permissions based on selected department
      updatedPermissions = selectedPermissions.value.filter((permissionId) => {
        const permissionGroup = permissionGroupsRef.value.find((group) =>
          group.permissions.some((p) => p.id === permissionId),
        )
        return permissionGroup?.department === selectedDepartment.value
      })
    }

    const updatedRole = {
      role_name: formData.value.roleName,
      description: formData.value.description,
      department: selectedDepartment.value,
      permissions: updatedPermissions,
    }

    await rolesStore.updateRole(roleId, updatedRole)

    toastType.value = 'success'
    toastMessage.value = 'Role updated successfully'
    showToast.value = true

    confirmModal.value?.close()

    // Add check for Super Admin
    const isAdmin = route.path.startsWith('/admin')

    setTimeout(() => {
      router.push(isAdmin ? '/admin/hr/roles' : '/hr/roles')
    }, 500)
  } catch (error) {
    confirmModal.value?.close()

    if (error.message === 'Role changed for current user') {
      // Error page is already shown by the roleStore
      return
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      // Show unauthorized error page
      const errorDiv = document.createElement('div')
      errorDiv.className =
        'fixed inset-0 bg-white flex flex-col items-center justify-center z-[9999]'
      errorDiv.innerHTML = `
        <div class="text-center p-8 max-w-lg">
          <div class="mb-6">
            <svg class="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-red-600 mb-4">Unauthorized Access</h1>
          <p class="text-gray-700 mb-6">You do not have permission to perform this action.</p>
          <button onclick="window.location.href='/login'" class="bg-green-700 text-white px-6 py-2 rounded hover:bg-green-800">
            Back to Login
          </button>
        </div>
      `
      document.body.appendChild(errorDiv)
      return
    }

    toastType.value = 'error'
    toastMessage.value = error.message || 'Error updating role'
    showToast.value = true
  }
}

const cancelSave = () => {
  confirmModal.value?.close()
}

// Update the toggleGroupPermissions function
const toggleGroupPermissions = (groupName) => {
  const group = permissionGroupsRef.value.find((g) => g.name === groupName)
  if (!group) return

  groupSelectState.value[groupName] = !groupSelectState.value[groupName]
  const groupPermissionIds = group.permissions.map((p) => p.id)

  if (groupSelectState.value[groupName]) {
    groupPermissionIds.forEach((id) => {
      if (!selectedPermissions.value.includes(id)) {
        selectedPermissions.value.push(id)
      }
    })
  } else {
    selectedPermissions.value = selectedPermissions.value.filter(
      (id) => !groupPermissionIds.includes(id),
    )
  }
}

// Update the isGroupFullySelected function
const isGroupFullySelected = (groupName) => {
  const group = permissionGroupsRef.value.find((g) => g.name === groupName)
  if (!group) return false

  return group.permissions.every((permission) => selectedPermissions.value.includes(permission.id))
}

// Add watch effect for department changes
watch(selectedDepartment, (newDepartment, oldDepartment) => {
  if (newDepartment !== oldDepartment) {
    // Clear existing permissions when department changes
    selectedPermissions.value = []

    // Reset group select states
    permissionGroupsRef.value.forEach((group) => {
      groupSelectState.value[group.name] = false
    })
  }
})

// Update the watch effect for permissions
watch(
  selectedPermissions,
  () => {
    permissionGroupsRef.value.forEach((group) => {
      groupSelectState.value[group.name] = isGroupFullySelected(group.name)
    })
  },
  { deep: true },
)
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
          <div class="form-control flex gap-2 items-center">
            <div class="w-30">
              <label class="label">
                <span class="label-text text-gray-500 text-sm">Role Name</span>
              </label>
            </div>
            <div class="w-full">
              <input
                v-model="formData.roleName"
                type="text"
                class="input-search input-bordered bg-white text-black"
                :class="{ 'input-error': formErrors.roleName }"
              />
              <label class="label" v-if="formErrors.roleName">
                <span class="label-text-alt text-error text-xs">{{ formErrors.roleName }}</span>
              </label>
            </div>
          </div>

          <div class="form-control flex gap-2 items-center">
            <div class="w-30">
              <label class="label">
                <span class="label-text text-gray-500 text-sm">Description</span>
              </label>
            </div>
            <div class="w-full">
              <textarea
                v-model="formData.description"
                class="textarea textarea-bordered border-black bg-white text-black h-24"
                :class="{ 'textarea-error': formErrors.description }"
              ></textarea>
              <label class="label" v-if="formErrors.description">
                <span class="label-text-alt text-error text-xs">{{ formErrors.description }}</span>
              </label>
            </div>
          </div>

          <div class="form-control flex gap-2 items-center">
            <div class="w-30">
              <label class="label">
                <span class="label-text text-gray-500 text-sm">Department</span>
              </label>
            </div>
            <div class="w-full">
              <select
                v-model="selectedDepartment"
                class="select w-full border !border-gray-200 !bg-white !text-black"
                :disabled="formData.roleName === 'Super Admin'"
              >
                <option value="" disabled>Select a department</option>
                <option v-for="dept in departments" :key="dept" :value="dept">
                  {{ dept }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: Permissions -->
      <div v-if="step === 2" class="mt-5 border border-gray-200 rounded-md p-5 bg-white shadow-sm">
        <div class="font-semibold mb-4">Permissions</div>
        <div class="grid gap-6">
          <div v-for="group in filteredPermissionGroups" :key="group.name" class="">
            <div class="flex items-center gap-2 mb-3">
              <label
                class="label cursor-pointer border border-gray-200 rounded-md p-2 bg-gray-50 justify-between w-full items-center mb-3"
              >
                <div class="">
                  <span class="label-text text-sm">{{ group.name }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    :checked="isGroupFullySelected(group.name)"
                    @change="toggleGroupPermissions(group.name)"
                    class="checkbox checkbox-neutral checkbox-xs"
                  />
                  <span class="label-text text-xs">Select all</span>
                </div>
              </label>
            </div>
            <div class="grid grid-cols-2 gap-3 ml-4">
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
                    class="checkbox checkbox-neutral checkbox-xs"
                  />
                  <span class="label-text text-sm">{{ permission.name }}</span>
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
                <span class="w-32 text-gray-500 text-sm">Role Name:</span>
                <span class="text-sm">{{ formData.roleName }}</span>
              </div>
              <div class="flex">
                <span class="w-32 text-gray-500 text-sm">Description:</span>
                <span class="text-sm">{{ formData.description }}</span>
              </div>
              <div class="flex">
                <span class="w-32 text-gray-500 text-sm">Department:</span>
                <span class="text-sm">{{ selectedDepartment }}</span>
              </div>
            </div>
          </div>

          <div class="mb-4">
            <div class="flex justify-between items-center">
              <div class="">
                <h4 class="font-semibold mb-2">Selected Permissions</h4>
              </div>
              <div class="flex gap-2">
                <div class="flex items-center">
                  <Dot class="w-10 h-10 text-primary" />
                  <p class="text-primary text-sm">active permissions</p>
                </div>
                <div class="flex items-center">
                  <Dot class="w-10 h-10 text-gray-500" />
                  <p class="text-gray-500 text-sm">inactive permissions</p>
                </div>
              </div>
            </div>
            <div class="bg-gray-50 p-4 rounded-md">
              <div v-for="group in filteredPermissionGroups" :key="group.name" class="mb-3">
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
