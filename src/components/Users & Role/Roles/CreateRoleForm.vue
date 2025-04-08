<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ChevronLeft } from 'lucide-vue-next'
import NotificationModal from '@/components/Admin Components/HR/Employee/NotificationModal.vue'
import { useRolesStore } from '@/stores/Users & Role/roleStore'
import { storeToRefs } from 'pinia'
import { useFormValidation } from '@/composables/Admin Composables/User & Role/role/useRoleFormValidation'
import { useNotification } from '@/composables/Admin Composables/User & Role/role/useNotification'

const router = useRouter()
const route = useRoute()
const rolesStore = useRolesStore()
const { roles } = storeToRefs(rolesStore)

// Form validation composable
const { errors, validateRoleName, validateDescription, validatePermissions, clearErrors } =
  useFormValidation()

// Check if we're in edit mode
const isEditMode = computed(() => route.query.edit === 'true')
const originalRoleName = ref('')

// Form state
const roleName = ref('')
const description = ref('')
const permissions = ref([])

// Modal state
const { notification, showNotification, closeNotification } = useNotification()

// If in edit mode, load the role data
onMounted(() => {
  // First uncheck all checkboxes regardless of mode
  const allCheckboxes = document.querySelectorAll('input[type="checkbox"]')
  allCheckboxes.forEach((checkbox) => {
    checkbox.checked = false
  })

  // Then if in edit mode, check only the permissions that the role has
  if (isEditMode.value && route.query.roleName) {
    const role = roles.value.find((r) => r['role name'] === route.query.roleName)
    if (role) {
      originalRoleName.value = role['role name']
      roleName.value = role['role name']
      description.value = role.description

      // Check only the permissions that the role has
      allCheckboxes.forEach((checkbox) => {
        const section = checkbox.closest('[data-section]').getAttribute('data-section')
        const permission = checkbox.nextElementSibling.textContent.trim()
        const fullPermission = `${section} - ${permission}`
        if (role.permissions.includes(fullPermission)) {
          checkbox.checked = true
        }
      })
    }
  }
})

// Get selected permissions helper - modify to include the section name
const getSelectedPermissions = () => {
  return Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map((checkbox) => {
    const section = checkbox.closest('[data-section]').getAttribute('data-section')
    const permission = checkbox.nextElementSibling.textContent.trim()
    return `${section} - ${permission}`
  })
}

// Form submission
const handleSubmit = () => {
  // Get selected permissions first
  const selectedPermissions = getSelectedPermissions()

  // Validate all fields
  const isRoleNameValid = validateRoleName(roleName.value)
  const isDescriptionValid = validateDescription(description.value)
  const isPermissionsValid = validatePermissions(selectedPermissions)

  if (isRoleNameValid && isDescriptionValid && isPermissionsValid) {
    const roleData = {
      'role name': roleName.value,
      description: description.value,
      permissions: selectedPermissions,
    }

    try {
      if (isEditMode.value) {
        rolesStore.updateRole(originalRoleName.value, roleData)
        showNotification('success', 'Success', 'Role updated successfully')
      } else {
        rolesStore.addRole(roleData)
        showNotification('success', 'Success', 'Role added successfully')
      }
    } catch (error) {
      showNotification('error', 'Error', 'An error occurred while saving the role')
    }
  }
}

// Modify the closeNotification function to handle navigation
const handleCloseNotification = () => {
  closeNotification()
  // Only navigate if it was a success notification
  if (notification.value.type === 'success') {
    router.push('/roles')
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
          <div class="user-management" data-section="User Management">
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
          <div class="roles-and-permissions" data-section="Roles and Permissions">
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
          <div class="human-resource col-span-2" data-section="Human Resource">
            <p class="text-black text-sm border border-gray-200 rounded-md p-2 bg-gray-50">
              Human Resource
            </p>

            <div class="grid grid-cols-4 gap-5">
              <div class="p-5 flex flex-col gap-5" data-section="HR Dashboard">
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

              <div class="p-5 flex flex-col gap-5" data-section="Attendance Report">
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

              <div class="p-5 flex flex-col gap-5" data-section="Employee Management">
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

              <div class="p-5 flex flex-col gap-5" data-section="Attendance Management">
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
          <div class="inventory-management" data-section="Inventory Management">
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
          <div class="sales-management" data-section="Sales Management">
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
          <div class="crm-management" data-section="CRM Management">
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
          <div class="finance-management" data-section="Finance Management">
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
      :on-close="handleCloseNotification"
    />
  </div>
</template>
