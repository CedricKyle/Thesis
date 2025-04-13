<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ChevronLeft } from 'lucide-vue-next'
import Toast from '@/components/Admin Components/HR/Toast.vue'
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
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// Example mapping based on your permissions table
const permissionMap = {
  'Roles and Permissions': {
    'Role List': 1,
    Create: 2,
    Edit: 3,
    Delete: 4,
  },
  'User Management': {
    'User List': 5,
    View: 6,
    Create: 7,
    Edit: 8,
    Delete: 9,
  },
  'HR Dashboard': {
    'View Dashboard': 10,
    'Manage Dashboard': 11,
  },
  'Attendance Report': {
    View: 12,
    Create: 13,
    Edit: 14,
    Delete: 15,
  },
  'Employee Management': {
    View: 16,
    Create: 17,
    Edit: 18,
    Delete: 19,
  },
  'Attendance Management': {
    View: 20,
    Create: 21,
    Edit: 22,
    Delete: 23,
  },
  'Inventory Management': {
    'Product List': 24,
    View: 25,
    Create: 26,
    Edit: 27,
    Delete: 28,
  },
  'Sales Management': {
    'Order List': 29,
    View: 30,
    Create: 31,
    Edit: 32,
    Delete: 33,
  },
  'CRM Management': {
    'Customer List': 34,
    View: 35,
    Create: 36,
    Edit: 37,
    Delete: 38,
  },
  'Finance Management': {
    'Invoice List': 39,
    View: 40,
    Create: 41,
    Edit: 42,
    Delete: 43,
  },
}

// Add after your existing refs
const groupSelectState = ref({})

// Initialize group select state for each section
onMounted(() => {
  Object.keys(permissionMap).forEach((section) => {
    groupSelectState.value[section] = false
  })

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

      // Ensure permissions are defined
      if (role.permissions) {
        allCheckboxes.forEach((checkbox) => {
          const section = checkbox.closest('[data-section]').getAttribute('data-section')
          const permission = checkbox.nextElementSibling.textContent.trim()
          const permissionId = permissionMap[section]?.[permission]
          if (role.permissions.includes(permissionId)) {
            checkbox.checked = true
          }
        })
      }
    }
  }

  // Ensure the role is found by its original name
  const role = roles.value.find((r) => r['role name'] === originalRoleName.value)
  if (role) {
    originalRoleName.value = role['role name']
    roleName.value = role['role name']
    description.value = role.description
    // Set permissions as needed
  }
})

// Get selected permissions helper - modify to include the section name
const getSelectedPermissions = () => {
  return Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
    .map((checkbox) => {
      const section = checkbox.closest('[data-section]').getAttribute('data-section')
      const permission = checkbox.nextElementSibling.textContent.trim()
      const fullPermission = `${section} - ${permission}`

      // Find the permission ID based on the section and permission
      const permissionId = permissionMap[section]?.[permission]
      return { section, permission, id: permissionId }
    })
    .filter((perm) => perm.id !== undefined) // Filter out undefined IDs
}

// Add ref for confirmation modal
const confirmModal = ref(null)
const roleToAdd = ref(null)

// Modify handleSubmit to show confirmation modal after validation
const handleSubmit = () => {
  // Check if form is completely empty
  if (
    !roleName.value.trim() &&
    !description.value.trim() &&
    getSelectedPermissions().length === 0
  ) {
    toastMessage.value = 'Please fill in the required fields'
    toastType.value = 'error'
    showToast.value = true

    setTimeout(() => {
      showToast.value = false
    }, 3000)
    return
  }

  const selectedPermissions = getSelectedPermissions()

  // Validate all fields
  const isRoleNameValid = validateRoleName(roleName.value)
  const isDescriptionValid = validateDescription(description.value)
  const isPermissionsValid = validatePermissions(selectedPermissions.map((perm) => perm.id))

  // Check for duplicate role name only if it's changed
  const isDuplicateRole = roles.value.some(
    (role) => role['role name'] === roleName.value && roleName.value !== originalRoleName.value,
  )
  if (isDuplicateRole) {
    toastMessage.value = 'Role name already exists'
    toastType.value = 'error'
    showToast.value = true

    setTimeout(() => {
      showToast.value = false
    }, 3000)
    return
  }

  if (isRoleNameValid && isDescriptionValid && isPermissionsValid) {
    // Store the role data temporarily
    roleToAdd.value = {
      'role name': roleName.value,
      description: description.value,
      permissions: selectedPermissions.map((perm) => perm.id),
    }

    // Show confirmation modal
    confirmModal.value?.showModal()
  } else {
    // Show validation errors in toast
    toastMessage.value = 'Please fill in all required fields correctly'
    toastType.value = 'error'
    showToast.value = true

    setTimeout(() => {
      showToast.value = false
    }, 3000)
  }
}

// Add confirmation handlers
const confirmAdd = async () => {
  try {
    if (isEditMode.value) {
      const roleId = roles.value.find((r) => r['role name'] === originalRoleName.value)?.id
      if (roleId) {
        await rolesStore.updateRole(roleId, roleToAdd.value)
        toastMessage.value = 'Role updated successfully'
      } else {
        toastMessage.value = 'Role ID not found'
        toastType.value = 'error'
      }
    } else {
      await rolesStore.addRole(roleToAdd.value)
      toastMessage.value = 'Role added successfully'
    }
    toastType.value = 'success'
    showToast.value = true

    // Close modal
    confirmModal.value?.close()
    roleToAdd.value = null

    setTimeout(() => {
      showToast.value = false
      if (toastType.value === 'success') {
        router.push('/hr/roles')
      }
    }, 3000)
  } catch (error) {
    toastMessage.value = 'An error occurred while saving the role'
    toastType.value = 'error'
    showToast.value = true

    setTimeout(() => {
      showToast.value = false
    }, 3000)
  }
}

const cancelAdd = () => {
  confirmModal.value?.close()
  roleToAdd.value = null
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

// Add these new functions
const toggleGroupPermissions = (section) => {
  // Toggle the group state
  groupSelectState.value[section] = !groupSelectState.value[section]

  const checkboxes = document.querySelectorAll(`[data-section="${section}"] input[type="checkbox"]`)
  checkboxes.forEach((checkbox) => {
    checkbox.checked = groupSelectState.value[section]
  })
}

const isGroupFullySelected = (section) => {
  const checkboxes = document.querySelectorAll(`[data-section="${section}"] input[type="checkbox"]`)
  return Array.from(checkboxes).every((checkbox) => checkbox.checked)
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
          <!-- Roles and Permissions -->
          <div class="roles-and-permissions col-span-2" data-section="Roles and Permissions">
            <div
              class="flex items-center justify-between border border-gray-200 rounded-md p-2 bg-gray-50"
            >
              <p class="text-black text-sm">Roles and Permissions</p>
              <div class="flex items-center gap-2">
                <input
                  type="checkbox"
                  :checked="isGroupFullySelected('Roles and Permissions')"
                  @change="toggleGroupPermissions('Roles and Permissions')"
                  class="checkbox checkbox-neutral checkbox-xs"
                />
                <span class="label-text text-xs">Select all</span>
              </div>
            </div>

            <div class="p-5 flex flex-col gap-5">
              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
                <p class="text-black text-sm">Role List</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
                <p class="text-black text-sm">Create</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
                <p class="text-black text-sm">Edit</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
                <p class="text-black text-sm">Delete</p>
              </div>
            </div>
          </div>

          <!-- Human Resource -->
          <div class="human-resource col-span-2" data-section="Human Resource">
            <div
              class="flex items-center justify-between border border-gray-200 rounded-md p-2 bg-gray-50"
            >
              <p class="text-black text-sm">Human Resource</p>
              <div class="flex items-center gap-2">
                <input
                  type="checkbox"
                  :checked="isGroupFullySelected('Human Resource')"
                  @change="toggleGroupPermissions('Human Resource')"
                  class="checkbox checkbox-neutral checkbox-xs"
                />
                <span class="label-text text-xs">Select all</span>
              </div>
            </div>

            <div class="grid grid-cols-4 gap-5">
              <div class="p-5 flex flex-col gap-5" data-section="HR Dashboard">
                <div class="flex items-center justify-between">
                  <p class="text-black text-sm font-semibold">HR Dashboard</p>
                </div>
                <div class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
                  <p class="text-black text-sm">View Dashboard</p>
                </div>

                <div class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
                  <p class="text-black text-sm">Manage Dashboard</p>
                </div>
              </div>

              <div class="p-5 flex flex-col gap-5" data-section="Attendance Report">
                <div class="flex items-center justify-between">
                  <p class="text-black text-sm font-semibold">Attendance Report</p>
                </div>
                <div class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
                  <p class="text-black text-sm">View</p>
                </div>

                <div class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
                  <p class="text-black text-sm">Create</p>
                </div>

                <div class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
                  <p class="text-black text-sm">Edit</p>
                </div>

                <div class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
                  <p class="text-black text-sm">Delete</p>
                </div>
              </div>

              <div class="p-5 flex flex-col gap-5" data-section="Employee Management">
                <div class="flex items-center justify-between">
                  <p class="text-black text-sm font-semibold">Employee Management</p>
                </div>
                <div class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
                  <p class="text-black text-sm">View</p>
                </div>

                <div class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
                  <p class="text-black text-sm">Create</p>
                </div>

                <div class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
                  <p class="text-black text-sm">Edit</p>
                </div>

                <div class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
                  <p class="text-black text-sm">Delete</p>
                </div>
              </div>

              <div class="p-5 flex flex-col gap-5" data-section="Attendance Management">
                <div class="flex items-center justify-between">
                  <p class="text-black text-sm font-semibold">Attendance Management</p>
                </div>
                <div class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
                  <p class="text-black text-sm">View</p>
                </div>

                <div class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
                  <p class="text-black text-sm">Create</p>
                </div>

                <div class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
                  <p class="text-black text-sm">Edit</p>
                </div>

                <div class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
                  <p class="text-black text-sm">Delete</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Inventory Management -->
          <div class="inventory-management" data-section="Inventory Management">
            <div
              class="flex items-center justify-between border border-gray-200 rounded-md p-2 bg-gray-50"
            >
              <p class="text-black text-sm">Inventory Management</p>
              <div class="flex items-center gap-2">
                <input
                  type="checkbox"
                  :checked="isGroupFullySelected('Inventory Management')"
                  @change="toggleGroupPermissions('Inventory Management')"
                  class="checkbox checkbox-neutral checkbox-xs"
                />
                <span class="label-text text-xs">Select all</span>
              </div>
            </div>

            <div class="p-5 flex flex-col gap-5">
              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
                <p class="text-black text-sm">Product List</p>
              </div>
              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
                <p class="text-black text-sm">View</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
                <p class="text-black text-sm">Create</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
                <p class="text-black text-sm">Edit</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
                <p class="text-black text-sm">Delete</p>
              </div>
            </div>
          </div>

          <!-- Sales Management -->
          <div class="sales-management" data-section="Sales Management">
            <div
              class="flex items-center justify-between border border-gray-200 rounded-md p-2 bg-gray-50"
            >
              <p class="text-black text-sm">Sales Management</p>
              <div class="flex items-center gap-2">
                <input
                  type="checkbox"
                  :checked="isGroupFullySelected('Sales Management')"
                  @change="toggleGroupPermissions('Sales Management')"
                  class="checkbox checkbox-neutral checkbox-xs"
                />
                <span class="label-text text-xs">Select all</span>
              </div>
            </div>

            <div class="p-5 flex flex-col gap-5">
              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
                <p class="text-black text-sm">Order List</p>
              </div>
              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
                <p class="text-black text-sm">View</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
                <p class="text-black text-sm">Create</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
                <p class="text-black text-sm">Edit</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
                <p class="text-black text-sm">Delete</p>
              </div>
            </div>
          </div>

          <!-- CRM Management -->
          <div class="crm-management" data-section="CRM Management">
            <div
              class="flex items-center justify-between border border-gray-200 rounded-md p-2 bg-gray-50"
            >
              <p class="text-black text-sm">CRM Management</p>
              <div class="flex items-center gap-2">
                <input
                  type="checkbox"
                  :checked="isGroupFullySelected('CRM Management')"
                  @change="toggleGroupPermissions('CRM Management')"
                  class="checkbox checkbox-neutral checkbox-xs"
                />
                <span class="label-text text-xs">Select all</span>
              </div>
            </div>

            <div class="p-5 flex flex-col gap-5">
              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
                <p class="text-black text-sm">Customer List</p>
              </div>
              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
                <p class="text-black text-sm">View</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
                <p class="text-black text-sm">Create</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
                <p class="text-black text-sm">Edit</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
                <p class="text-black text-sm">Delete</p>
              </div>
            </div>
          </div>

          <!-- Finance Management -->
          <div class="finance-management" data-section="Finance Management">
            <div
              class="flex items-center justify-between border border-gray-200 rounded-md p-2 bg-gray-50"
            >
              <p class="text-black text-sm">Finance Management</p>
              <div class="flex items-center gap-2">
                <input
                  type="checkbox"
                  :checked="isGroupFullySelected('Finance Management')"
                  @change="toggleGroupPermissions('Finance Management')"
                  class="checkbox checkbox-neutral checkbox-xs"
                />
                <span class="label-text text-xs">Select all</span>
              </div>
            </div>

            <div class="p-5 flex flex-col gap-5">
              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
                <p class="text-black text-sm">Invoice List</p>
              </div>
              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
                <p class="text-black text-sm">View</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
                <p class="text-black text-sm">Create</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
                <p class="text-black text-sm">Edit</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
                <p class="text-black text-sm">Delete</p>
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
                {{ getSelectedPermissions().length }} permissions selected
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
