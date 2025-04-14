<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ChevronLeft } from 'lucide-vue-next'
import Toast from '@/components/Admin Components/HR/Toast.vue'
import { useRolesStore } from '@/stores/Users & Role/roleStore'
import { storeToRefs } from 'pinia'
import { useFormValidation } from '@/composables/Admin Composables/User & Role/role/useRoleFormValidation'
import { permissionGroups } from '@/composables/Admin Composables/User & Role/role/permissionsId'

const router = useRouter()
const route = useRoute()
const rolesStore = useRolesStore()
const { roles } = storeToRefs(rolesStore)
const { errors, validateRoleName, validateDescription, validatePermissions, clearErrors } =
  useFormValidation()

// Form state
const isEditMode = computed(() => route.query.edit === 'true')
const roleName = ref('')
const description = ref('')
const selectedPermissions = ref([])
const permissionGroupsRef = ref(permissionGroups)
const groupSelectState = ref({})
const confirmModal = ref(null)
const roleToAdd = ref(null)

// Toast state
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

onMounted(() => {
  initializeGroupState()
  if (isEditMode.value && route.query.roleName) {
    loadExistingRole()
  }
})

const initializeGroupState = () => {
  permissionGroupsRef.value.forEach((group) => {
    groupSelectState.value[group.name] = false
  })
}

const loadExistingRole = () => {
  const role = roles.value.find((r) => r.role_name === route.query.roleName)
  if (role) {
    roleName.value = role.role_name
    description.value = role.description
    selectedPermissions.value = role.permissions || []
  }
}

const togglePermission = (permissionId) => {
  const index = selectedPermissions.value.indexOf(permissionId)
  if (index === -1) {
    selectedPermissions.value.push(permissionId)
  } else {
    selectedPermissions.value.splice(index, 1)
  }
}

const handleSubmit = async () => {
  clearErrors()

  if (!validateForm()) return

  roleToAdd.value = {
    role_name: roleName.value.trim(),
    description: description.value.trim(),
    permissions: selectedPermissions.value,
  }
  confirmModal.value?.showModal()
}

const validateForm = () => {
  if (!roleName.value?.trim()) {
    showError('Please enter a role name')
    return false
  }

  const isDuplicate = roles.value.some(
    (role) => role.role_name?.toLowerCase().trim() === roleName.value.toLowerCase().trim(),
  )

  if (isDuplicate) {
    showError('This role name already exists')
    return false
  }

  const isRoleNameValid = validateRoleName(roleName.value)
  const isDescriptionValid = validateDescription(description.value)
  const isPermissionsValid = validatePermissions(selectedPermissions.value)

  if (!isRoleNameValid || !isDescriptionValid || !isPermissionsValid) {
    showValidationErrors(isRoleNameValid, isDescriptionValid, isPermissionsValid)
    return false
  }

  return true
}

const showError = (message) => {
  errors.roleName = message
  toastMessage.value = message
  toastType.value = 'error'
  showToast.value = true
}

const showValidationErrors = (isRoleNameValid, isDescriptionValid, isPermissionsValid) => {
  let errorMessage = 'Please correct the following errors:'
  if (!isRoleNameValid) errorMessage += '\n- ' + (errors.roleName || 'Invalid role name')
  if (!isDescriptionValid) errorMessage += '\n- ' + (errors.description || 'Invalid description')
  if (!isPermissionsValid)
    errorMessage += '\n- ' + (errors.permissions || 'Please select at least one permission')

  toastMessage.value = errorMessage
  toastType.value = 'error'
  showToast.value = true
}

const confirmAdd = async () => {
  try {
    if (!roleToAdd.value) return

    await rolesStore.addRole(roleToAdd.value)
    showSuccessAndRedirect()
  } catch (error) {
    showError(error.message || 'An error occurred while saving the role')
  }
}

const showSuccessAndRedirect = () => {
  toastMessage.value = 'Role added successfully'
  toastType.value = 'success'
  showToast.value = true
  confirmModal.value?.close()
  roleToAdd.value = null

  setTimeout(() => {
    showToast.value = false
    router.push('/hr/roles')
  }, 3000)
}

const cancelAdd = () => {
  confirmModal.value?.close()
  roleToAdd.value = null
}

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

const isGroupFullySelected = (groupName) => {
  const group = permissionGroupsRef.value.find((g) => g.name === groupName)
  return group
    ? group.permissions.every((permission) => selectedPermissions.value.includes(permission.id))
    : false
}

watch(roleName, (newValue) => {
  if (!newValue?.trim()) {
    errors.roleName = 'Role name is required'
    return
  }

  const isDuplicate = roles.value.some(
    (role) => role.role_name?.toLowerCase().trim() === newValue.toLowerCase().trim(),
  )
  errors.roleName = isDuplicate ? 'This role name already exists' : ''
})
</script>

<template>
  <div class="container p-5 text-black">
    <div class="title flex items-center gap-2">
      <ChevronLeft
        class="w-6 h-6 cursor-pointer hover:bg-primaryColor/20 rounded-full"
        @click="router.back()"
      />
      <div class="text-[24px] font-semibold">{{ isEditMode ? 'Edit Role' : 'Create Role' }}</div>
    </div>

    <!-- role name -->
    <div class="role-name p-5 bg-white rounded-md flex gap-5 mt-5 border border-gray-200 shadow-sm">
      <div class="input-container flex-1">
        <legend class="fieldset-legend text-black !m-0 !text-xs">Role Name</legend>
        <input
          v-model="roleName"
          type="text"
          class="input bg-white border-b border-gray-400 w-full"
          :class="{ 'border-red-500': errors.roleName }"
          placeholder="Enter role name"
        />
        <p v-if="errors.roleName" class="text-red-500 text-xs mt-1">{{ errors.roleName }}</p>
        <p v-else class="fieldset-label text-gray-500 text-xs mt-1">
          Enter a unique name for the role
        </p>
      </div>
      <div class="description-container flex-1">
        <legend class="fieldset-legend text-black !m-0 !text-xs">Description</legend>
        <input
          v-model="description"
          class="input bg-white border-b border-gray-400 w-full"
          :class="{ 'border-red-500': errors.description }"
        />
        <p v-if="errors.description" class="text-red-500 text-xs mt-1">{{ errors.description }}</p>
        <p v-else class="fieldset-label text-gray-500 text-xs mt-1">
          Add a description to help identify the role
        </p>
      </div>
    </div>

    <!-- permissions -->
    <div
      class="permissions p-5 bg-white rounded-md flex flex-col gap-5 mt-5 border border-gray-200 shadow-sm"
    >
      <div class="permissions-container flex-1">
        <p class="text-black text-sm font-semibold">Select permissions to enable access control</p>
        <p v-if="errors.permissions" class="text-red-500 text-xs mt-1">{{ errors.permissions }}</p>
      </div>

      <div class="flex flex-col gap-5">
        <!-- permissions list -->
        <div class="permissions-list grid grid-cols-2 gap-5 border border-gray-200 rounded-md p-2">
          <div
            v-for="group in permissionGroupsRef"
            :key="group.name"
            :class="group.name.toLowerCase().replace(' ', '-')"
            :data-section="group.name"
          >
            <div
              class="flex items-center justify-between border border-gray-200 rounded-md p-2 bg-gray-50"
            >
              <p class="text-black text-sm">{{ group.name }}</p>
              <div class="flex items-center gap-2">
                <input
                  type="checkbox"
                  :checked="isGroupFullySelected(group.name)"
                  @change="toggleGroupPermissions(group.name)"
                  class="checkbox checkbox-neutral checkbox-xs"
                />
                <span class="label-text text-xs">Select all</span>
              </div>
            </div>

            <div class="p-5 flex flex-col gap-5">
              <div
                v-for="permission in group.permissions"
                :key="permission.id"
                class="flex items-center gap-2"
              >
                <input
                  type="checkbox"
                  :checked="selectedPermissions.includes(permission.id)"
                  @change="togglePermission(permission.id)"
                  class="checkbox checkbox-xs checkbox-neutral"
                />
                <p class="text-black text-sm">{{ permission.name }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- add permission -->
        <div class="flex justify-end">
          <button class="btn-primaryStyle" @click="handleSubmit">
            {{ isEditMode ? 'Update Role' : '+ Add Role' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Add Confirmation Modal -->
    <dialog ref="confirmModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-lg text-black">Confirm Add Role</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>

        <div v-if="roleToAdd" class="py-4">
          <p class="text-center text-black mb-4">
            Are you sure you want to {{ isEditMode ? 'update' : 'add' }} the role
            <span class="font-bold">{{ roleToAdd['role name'] }}</span
            >?
          </p>

          <div class="mt-4 flex flex-col gap-2">
            <div class="flex flex-row">
              <div class="w-32 text-gray-500">Description:</div>
              <div class="text-black">{{ roleToAdd.description }}</div>
            </div>
            <div class="flex flex-col">
              <div class="text-gray-500 mb-2">Selected Permissions:</div>
              <div class="text-black text-sm">
                {{ selectedPermissions.length }} permissions selected
              </div>
            </div>
          </div>
        </div>

        <div class="modal-action justify-center gap-4">
          <button class="btn-primaryStyle" @click="confirmAdd">
            {{ isEditMode ? 'Update Role' : 'Add Role' }}
          </button>
          <button class="btn-secondaryStyle" @click="cancelAdd">Cancel</button>
        </div>
      </div>
    </dialog>

    <!-- Toast -->
    <Toast :show="showToast" :message="toastMessage" :type="toastType" />
  </div>
</template>
