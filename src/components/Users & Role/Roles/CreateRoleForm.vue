<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ChevronLeft } from 'lucide-vue-next'
import NotificationModal from '@/components/Admin Components/HR/Employee/NotificationModal.vue'
import { useRolesStore } from '@/stores/Users & Role/roleStore'
import { storeToRefs } from 'pinia'

const router = useRouter()
const route = useRoute()
const rolesStore = useRolesStore()
const { roles } = storeToRefs(rolesStore)

// Check if we're in edit mode
const isEditMode = computed(() => route.query.edit === 'true')
const originalRoleName = ref('')

// Form state
const roleName = ref('')
const description = ref('')
const permissions = ref([])

// Validation state
const errors = ref({
  roleName: '',
  description: '',
  permissions: '',
})

// Modal state
const notification = ref({
  show: false,
  type: 'success',
  title: '',
  message: '',
})

// If in edit mode, load the role data
onMounted(() => {
  if (isEditMode.value && route.query.roleName) {
    const role = roles.value.find((r) => r['role name'] === route.query.roleName)
    if (role) {
      originalRoleName.value = role['role name']
      roleName.value = role['role name']
      description.value = role.description

      // First uncheck all checkboxes
      const allCheckboxes = document.querySelectorAll('input[type="checkbox"]')
      allCheckboxes.forEach((checkbox) => {
        checkbox.checked = false
      })

      // Then check only the permissions that the role has
      allCheckboxes.forEach((checkbox) => {
        const label = checkbox.nextElementSibling.textContent.trim()
        if (role.permissions.includes(label)) {
          checkbox.checked = true
        }
      })
    }
  } else {
    // If not in edit mode, ensure all checkboxes are unchecked
    const allCheckboxes = document.querySelectorAll('input[type="checkbox"]')
    allCheckboxes.forEach((checkbox) => {
      checkbox.checked = false
    })
  }
})

// Validation functions
const validateRoleName = () => {
  if (!roleName.value.trim()) {
    errors.value.roleName = 'Role name is required'
    return false
  }

  const words = roleName.value
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0)
  if (words.length < 1) {
    errors.value.roleName = 'Role name must contain at least 1 word'
    return false
  }
  errors.value.roleName = ''
  return true
}

const validateDescription = () => {
  if (description.value.length < 10) {
    errors.value.description = 'Description must be at least 10 characters'
    return false
  }
  if (description.value.length > 50) {
    errors.value.description = 'Description must not exceed 50 characters'
    return false
  }
  errors.value.description = ''
  return true
}

const validatePermissions = () => {
  const checkedPermissions = document.querySelectorAll('input[type="checkbox"]:checked')
  if (checkedPermissions.length < 1) {
    errors.value.permissions = 'Please select at least 1 permission'
    return false
  }
  errors.value.permissions = ''
  return true
}

// Form submission
const handleSubmit = () => {
  const isRoleNameValid = validateRoleName()
  const isDescriptionValid = validateDescription()
  const isPermissionsValid = validatePermissions()

  if (isRoleNameValid && isDescriptionValid && isPermissionsValid) {
    // Get selected permissions
    const checkedPermissions = Array.from(
      document.querySelectorAll('input[type="checkbox"]:checked'),
    ).map((checkbox) => checkbox.nextElementSibling.textContent.trim())

    const roleData = {
      roleName: roleName.value,
      description: description.value,
      permissions: checkedPermissions,
    }

    if (isEditMode.value) {
      rolesStore.updateRole(originalRoleName.value, roleData)
      notification.value = {
        show: true,
        type: 'success',
        title: 'Success',
        message: 'Role updated successfully!',
      }
    } else {
      rolesStore.addRole(roleData)
      notification.value = {
        show: true,
        type: 'success',
        title: 'Success',
        message: 'Role added successfully!',
      }
    }
  }
}

// Close notification
const closeNotification = () => {
  notification.value.show = false
  if (notification.value.type === 'success') {
    router.back()
  }
}
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
        />
        <p v-if="errors.roleName" class="text-red-500 text-xs mt-1">{{ errors.roleName }}</p>
        <p v-else class="fieldset-label text-gray-500 text-xs mt-1">Enter a name for the role</p>
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
          <!-- User Management -->
          <div class="user-management">
            <p class="text-black text-sm border border-gray-200 rounded-md p-2 bg-gray-50">
              User Management
            </p>

            <div class="p-5 flex flex-col gap-5">
              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">User List</p>
              </div>
              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">View</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Create</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Edit</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Delete</p>
              </div>
            </div>
          </div>

          <!-- Roles and Permissions -->
          <div class="roles-and-permissions">
            <p class="text-black text-sm border border-gray-200 rounded-md p-2 bg-gray-50">
              Roles and Permissions
            </p>

            <div class="p-5 flex flex-col gap-5">
              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Role List</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Create</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Edit</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Delete</p>
              </div>
            </div>
          </div>

          <!-- Human Resource -->
          <div class="human-resource col-span-2">
            <p class="text-black text-sm border border-gray-200 rounded-md p-2 bg-gray-50">
              Human Resource
            </p>

            <div class="grid grid-cols-4 gap-5">
              <div class="p-5 flex flex-col gap-5">
                <p class="text-black text-sm font-semibold">HR Dashboard</p>
                <div class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                  <p class="text-black text-sm">View Dashboard</p>
                </div>

                <div class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                  <p class="text-black text-sm">Manage Dashboard</p>
                </div>
              </div>

              <div class="p-5 flex flex-col gap-5">
                <p class="text-black text-sm font-semibold">Attendance Report</p>
                <div class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                  <p class="text-black text-sm">View Attendance Report</p>
                </div>

                <div class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                  <p class="text-black text-sm">Export Attendance Report</p>
                </div>
              </div>

              <div class="p-5 flex flex-col gap-5">
                <p class="text-black text-sm font-semibold">Employee Management</p>
                <div class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                  <p class="text-black text-sm">View Employee List</p>
                </div>

                <div class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                  <p class="text-black text-sm">Create Employee</p>
                </div>

                <div class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                  <p class="text-black text-sm">Edit Employee</p>
                </div>

                <div class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                  <p class="text-black text-sm">Delete Employee</p>
                </div>
              </div>

              <div class="p-5 flex flex-col gap-5">
                <p class="text-black text-sm font-semibold">Attendance Management</p>
                <div class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                  <p class="text-black text-sm">View Attendance List</p>
                </div>

                <div class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                  <p class="text-black text-sm">Create Attendance</p>
                </div>

                <div class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                  <p class="text-black text-sm">Edit Attendance</p>
                </div>

                <div class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                  <p class="text-black text-sm">Delete Attendance</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Inventory Management -->
          <div class="inventory-management">
            <p class="text-black text-sm border border-gray-200 rounded-md p-2 bg-gray-50">
              Inventory Management
            </p>

            <div class="p-5 flex flex-col gap-5">
              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Product List</p>
              </div>
              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">View</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Create</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Edit</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Delete</p>
              </div>
            </div>
          </div>

          <!-- Sales Management -->
          <div class="sales-management">
            <p class="text-black text-sm border border-gray-200 rounded-md p-2 bg-gray-50">
              Sales Management
            </p>

            <div class="p-5 flex flex-col gap-5">
              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Order List</p>
              </div>
              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">View</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Create</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Edit</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Delete</p>
              </div>
            </div>
          </div>

          <!-- CRM Management -->
          <div class="crm-management">
            <p class="text-black text-sm border border-gray-200 rounded-md p-2 bg-gray-50">
              CRM Management
            </p>

            <div class="p-5 flex flex-col gap-5">
              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Customer List</p>
              </div>
              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">View</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Create</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Edit</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Delete</p>
              </div>
            </div>
          </div>

          <!-- Finance Management -->
          <div class="finance-management">
            <p class="text-black text-sm border border-gray-200 rounded-md p-2 bg-gray-50">
              Finance Management
            </p>

            <div class="p-5 flex flex-col gap-5">
              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Invoice List</p>
              </div>
              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">View</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Create</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Edit</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Delete</p>
              </div>
            </div>
          </div>
        </div>

        <!-- add permission -->
        <div class="">
          <button
            class="btn bg-primaryColor text-white rounded-none btn-sm border-none"
            @click="handleSubmit"
          >
            {{ isEditMode ? 'Update Role' : 'Add Role' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Success Modal -->
    <NotificationModal
      :show="notification.show"
      :type="notification.type"
      :title="notification.title"
      :message="notification.message"
      :on-close="closeNotification"
    />
  </div>
</template>
