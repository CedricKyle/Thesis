<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ChevronLeft } from 'lucide-vue-next'
import Toast from '@/components/Admin Components/HR/Toast.vue'
import { useRolesStore } from '@/stores/Users & Role/roleStore'
import { storeToRefs } from 'pinia'
import { useFormValidation } from '@/composables/Admin Composables/User & Role/role/useRoleFormValidation'
import {
  permissionGroups,
  DEPARTMENTS,
} from '@/composables/Admin Composables/User & Role/role/permissionsId'

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
const selectedDepartment = ref('')

// Add state for full access toggles
const departmentFullAccess = ref({})

// Computed property for department-specific permissions
const filteredPermissionGroups = computed(() => {
  if (!selectedDepartment.value) return []

  // If Super Admin is selected, show all permission groups
  if (selectedDepartment.value === DEPARTMENTS.ADMIN) {
    return permissionGroups
  }

  // Otherwise, filter by selected department
  return permissionGroups.filter((group) => group.department === selectedDepartment.value)
})

// Add this computed property after your other computed properties
const departments = computed(() => {
  // Check if we're on the admin route
  const isAdminRoute = route.path.startsWith('/admin')

  // If we're on the admin route, include ADMIN in departments
  if (isAdminRoute) {
    return Object.values(DEPARTMENTS)
  }

  // For non-admin routes, filter out the ADMIN department
  return Object.values(DEPARTMENTS).filter((dept) => dept !== DEPARTMENTS.ADMIN)
})

// Function to handle full access toggle
const toggleFullAccess = (department) => {
  departmentFullAccess.value[department] = !departmentFullAccess.value[department]

  // Find all permissions for this department
  const departmentPermissions = permissionGroups
    .filter((group) => group.department === department)
    .flatMap((group) => group.permissions)
    .map((perm) => perm.id)

  if (departmentFullAccess.value[department]) {
    // Add all department permissions
    departmentPermissions.forEach((permId) => {
      if (!selectedPermissions.value.includes(permId)) {
        selectedPermissions.value.push(permId)
      }
    })
  } else {
    // Remove all department permissions except individually selected ones
    selectedPermissions.value = selectedPermissions.value.filter(
      (permId) => !departmentPermissions.includes(permId),
    )
  }
}

// Function to check if department has full access
const hasDepartmentFullAccess = (department) => {
  const departmentPermissions = permissionGroups
    .filter((group) => group.department === department)
    .flatMap((group) => group.permissions)
    .map((perm) => perm.id)

  return departmentPermissions.every((permId) => selectedPermissions.value.includes(permId))
}

// Watch for department changes
watch(selectedDepartment, (newDepartment) => {
  // Reset permissions when department changes
  selectedPermissions.value = []
  departmentFullAccess.value = {}
})

// Modify the existing validateForm function
const validateForm = () => {
  clearErrors()

  if (!selectedDepartment.value) {
    errors.department = 'Please select a department'
    return false
  }

  if (!roleName.value?.trim()) {
    showError('Please enter a role name')
    return false
  }

  // Special handling for Super Admin role
  if (
    roleName.value.toLowerCase().trim() === 'super admin' &&
    selectedDepartment.value !== DEPARTMENTS.ADMIN
  ) {
    showError('Super Admin role can only be created in Admin department')
    return false
  }

  const isDuplicate = roles.value.some(
    (role) => role.role_name?.toLowerCase().trim() === roleName.value.toLowerCase().trim(),
  )

  if (isDuplicate) {
    showError('This role name already exists')
    return false
  }

  if (selectedPermissions.value.length === 0) {
    showError('Please select at least one permission')
    return false
  }

  return true
}

onMounted(() => {
  if (isEditMode.value && route.query.roleName) {
    loadExistingRole()
  }
})

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
  if (!validateForm()) return

  const roleToAdd = {
    role_name: roleName.value.trim(),
    description: description.value.trim(),
    department: selectedDepartment.value,
    permissions: selectedPermissions.value,
  }
  await rolesStore.addRole(roleToAdd)
  showSuccessAndRedirect()
}

const showError = (message) => {
  errors.roleName = message
  toastMessage.value = message
  toastType.value = 'error'
  showToast.value = true
}

const showSuccessAndRedirect = () => {
  toastMessage.value = 'Role added successfully'
  toastType.value = 'success'
  showToast.value = true

  // Add check for Super Admin
  const isAdmin = route.path.startsWith('/admin')

  setTimeout(() => {
    showToast.value = false
    // Redirect based on user role
    router.push(isAdmin ? '/admin/hr/roles' : '/hr/roles')
  }, 3000)
}

// Toast state
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')
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
        <legend class="fieldset-legend text-black !m-0 !text-xs justify-start">
          Role Name <span class="text-red-500">*</span>
        </legend>
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
        <legend class="fieldset-legend text-black !m-0 !text-xs justify-start">
          Description <span class="text-red-500">*</span>
        </legend>
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

    <!-- Department Selection -->
    <div class="mt-5 border border-gray-200 rounded-md p-5 bg-white shadow-sm">
      <div class="font-semibold mb-4">Department Selection</div>
      <div class="form-control">
        <label class="label">
          <span class="label-text text-gray-500 text-sm">
            Select Department<span class="text-red-500">*</span>
          </span>
        </label>
        <select
          v-model="selectedDepartment"
          class="select border-gray-300 bg-white w-full"
          :class="{ 'select-error': errors.department }"
        >
          <option value="">Select a department</option>
          <option
            v-for="dept in departments"
            :key="dept"
            :value="dept"
            :disabled="dept === DEPARTMENTS.ADMIN && !route.path.startsWith('/admin')"
          >
            {{ dept }}
          </option>
        </select>
        <label class="label" v-if="errors.department">
          <span class="label-text-alt text-error">{{ errors.department }}</span>
        </label>
      </div>
    </div>

    <!-- permissions -->
    <div
      class="permissions p-5 bg-white rounded-md flex flex-col gap-5 mt-5 border border-gray-200 shadow-sm"
    >
      <div class="permissions-container flex-1">
        <p class="text-black text-sm font-semibold">
          Select permissions to enable access control <span class="text-red-500">*</span>
        </p>
        <p v-if="errors.permissions" class="text-red-500 text-xs mt-1">{{ errors.permissions }}</p>
      </div>

      <div class="flex flex-col gap-5">
        <!-- permissions list -->
        <div class="permissions-list" v-if="selectedDepartment">
          <div v-for="group in filteredPermissionGroups" :key="group.name">
            <div
              class="flex items-center justify-between border border-gray-200 rounded-md p-2 bg-gray-50"
            >
              <p class="text-black text-sm">{{ group.name }}</p>
              <!-- Full Access toggle in header -->
              <div class="flex items-center gap-2">
                <input
                  type="checkbox"
                  :checked="hasDepartmentFullAccess(group.department)"
                  @change="toggleFullAccess(group.department)"
                  class="checkbox checkbox-neutral checkbox-xs"
                />
                <span class="label-text text-xs">Full Access</span>
              </div>
            </div>

            <div class="p-5 flex flex-col gap-5">
              <!-- Individual permissions without Full Access option -->
              <div
                v-for="permission in group.permissions.filter(
                  (p) => !p.name.includes('Full Access'),
                )"
                :key="permission.id"
                class="flex items-center gap-2"
              >
                <input
                  type="checkbox"
                  :checked="selectedPermissions.includes(permission.id)"
                  @change="togglePermission(permission.id)"
                  :disabled="hasDepartmentFullAccess(group.department)"
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

    <!-- Toast -->
    <Toast :show="showToast" :message="toastMessage" :type="toastType" />
  </div>
</template>
