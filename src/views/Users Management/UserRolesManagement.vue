<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import { Plus, RefreshCw } from 'lucide-vue-next'
import { TabulatorFull as Tabulator } from 'tabulator-tables'
import { useRouter } from 'vue-router'
import { useRolesStore } from '@/stores/Users & Role/roleStore'
import { storeToRefs } from 'pinia'
import Toast from '@/components/Admin Components/HR/Toast.vue'
import { useToast } from '@/composables/Admin Composables/User & Role/role/useToast'
import { useNotification } from '@/composables/Admin Composables/User & Role/role/useNotification'

const router = useRouter()
const rolesStore = useRolesStore()
const { roles } = storeToRefs(rolesStore)
const { toast, showToast } = useToast()
const { showNotification } = useNotification()

const tableRef = ref(null)
const isTableBuilt = ref(false)
let table = null

// Add these new refs
const searchInput = ref('')
const filteredRoles = ref([])

// Add new ref for update confirmation
const updateConfirmModal = ref(null)
const roleDataToUpdate = ref(null)

// Add new ref for edit confirmation
const editConfirmModal = ref(null)
const roleToEdit = ref(null)

// Add back the delete confirmation modal ref
const deleteConfirmModal = ref(null)
const roleToDelete = ref(null)

// Add these new refs for duplicate confirmation
const duplicateConfirmModal = ref(null)
const roleToDuplicate = ref(null)

// Define permissionMap at the top of your script
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
  // Add other permissions as needed
}

// Define columns for Tabulator
const columns = [
  {
    title: 'Role Name',
    field: 'role name',
    sorter: 'string',
    headerSort: true,
  },
  {
    title: 'Description',
    field: 'description',
    sorter: 'string',
    headerSort: true,
  },
  {
    title: 'Last Modified',
    field: 'last modified',
    sorter: 'date',
    headerSort: true,
    formatter: (cell) => {
      const date = new Date(cell.getValue())
      return date
        .toLocaleString('en-PH', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
          timeZone: 'Asia/Manila',
        })
        .replace(',', '')
    },
  },
  {
    title: 'Actions',
    formatter: function (cell) {
      const record = cell.getRow().getData()
      return `
        <div class="flex gap-2">
          <button class="btn btn-sm btn-circle hover:bg-primaryColor/80 border-none btn-ghost edit-button">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button class="btn btn-sm btn-circle hover:bg-secondaryColor border-none btn-ghost duplicate-button">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2z" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
          <button class="btn btn-sm btn-circle hover:bg-red-400 border-none btn-ghost delete-button">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>`
    },
    headerSort: false,
    cellClick: function (e, cell) {
      const record = cell.getRow().getData()
      if (e.target.closest('.edit-button')) {
        handleEdit(record)
      } else if (e.target.closest('.delete-button')) {
        handleDelete(record)
      } else if (e.target.closest('.duplicate-button')) {
        handleDuplicate(record)
      }
    },
  },
]

// Modify initTable to use filteredRoles instead of roles directly
const initTable = async () => {
  if (tableRef.value) {
    table = new Tabulator(tableRef.value, {
      data: filteredRoles.value, // Changed from roles.value to filteredRoles.value
      columns: columns,
      layout: 'fitColumns',
      responsiveLayout: 'collapse',
      height: '100%',
      pagination: true,
      paginationSize: 10,
      paginationSizeSelector: [10, 25, 50],
      placeholder: 'No roles available',
      cssClass: 'custom-tabulator',
    })

    await table.on('tableBuilt', function () {
      isTableBuilt.value = true
    })
  }
}

// Add search function
const handleSearch = () => {
  if (!searchInput.value.trim()) {
    filteredRoles.value = roles.value
  } else {
    const searchTerm = searchInput.value.toLowerCase()
    filteredRoles.value = roles.value.filter((role) => {
      return (
        role['role name'].toLowerCase().includes(searchTerm) ||
        role.description.toLowerCase().includes(searchTerm)
      )
    })
  }

  if (table) {
    table.setData(filteredRoles.value)
  }
}

// Add refresh function
const handleRefresh = async () => {
  // Clear search input
  searchInput.value = ''
  // Reset filtered roles to all roles
  filteredRoles.value = roles.value
  // Refresh table data
  if (table) {
    await table.setData(roles.value)
  }
}

// Initialize filteredRoles with all roles
onMounted(async () => {
  filteredRoles.value = roles.value
  await initTable()
  try {
    await rolesStore.fetchRoles()
  } catch (error) {
    showNotification('Error loading roles', 'error')
  }
})

// Modify the watch to use filteredRoles
watch(
  () => roles.value,
  async (newData) => {
    filteredRoles.value = newData
    if (isTableBuilt.value && table) {
      await table.setData(filteredRoles.value)
    }
  },
  { deep: true },
)

// Clean up
onBeforeUnmount(() => {
  if (table) {
    table.destroy()
    table = null
  }
})

// Modify the handleEdit function to show confirmation first
const handleEdit = (rowData) => {
  console.log('Editing role:', rowData) // Check if permissions are present
  roleToEdit.value = rowData
  editConfirmModal.value?.showModal()
}

// Add confirmEdit function
const confirmEdit = () => {
  if (roleToEdit.value) {
    router
      .push({
        name: 'CreateRole',
        query: {
          edit: 'true',
          roleName: roleToEdit.value['role name'],
        },
      })
      .catch((err) => {
        if (err.name !== 'NavigationDuplicated') {
          console.error(err)
        }
      })
    editConfirmModal.value?.close()
    roleToEdit.value = null
  }
}

// Add cancelEdit function
const cancelEdit = () => {
  editConfirmModal.value?.close()
  roleToEdit.value = null
}

// Modify handleDelete to show confirmation modal first
const handleDelete = (rowData) => {
  roleToDelete.value = rowData
  deleteConfirmModal.value?.showModal()
}

// Add confirmDelete function that handles the actual deletion and shows toast
const confirmDelete = async () => {
  if (roleToDelete.value) {
    try {
      await rolesStore.deleteRole(roleToDelete.value.id)
      deleteConfirmModal.value?.close()
      roleToDelete.value = null
      showNotification('Role deleted successfully', 'success')
    } catch (error) {
      showNotification(error.message, 'error')
    }
  }
}

// Add cancelDelete function
const cancelDelete = () => {
  deleteConfirmModal.value?.close()
  roleToDelete.value = null
}

// Navigation function
const navigateToCreateRole = () => {
  router.push({ name: 'CreateRole' }).catch((err) => {
    if (err.name !== 'NavigationDuplicated') {
      console.error(err)
    }
  })
}

// Modify the handleSubmit function to show confirmation first
const handleSubmit = async (roleData) => {
  try {
    await rolesStore.addRole(roleData)
    showNotification('Role created successfully', 'success')
  } catch (error) {
    showNotification(error.message, 'error')
  }
}

// Add confirmUpdate function
const confirmUpdate = async () => {
  if (roleDataToUpdate.value) {
    await rolesStore.updateRole(roleDataToUpdate.value.id, roleDataToUpdate.value)
    updateConfirmModal.value?.close()
    showNotification('Role updated successfully', 'success')
  }
}

// Add function to cancel update
const cancelUpdate = () => {
  updateConfirmModal.value?.close()
  roleDataToUpdate.value = null
}

// Add this helper function in the script section
const formatPermissions = (permissions) => {
  if (!permissions || !Array.isArray(permissions)) return ''

  // Map permission IDs to their names
  const permissionNames = permissions
    .map((id) => {
      return Object.entries(permissionMap)
        .flatMap(([category, perms]) => {
          const permName = Object.entries(perms).find(([name, permId]) => permId === id)?.[0]
          return permName ? `${category}: ${permName}` : null
        })
        .filter(Boolean)
    })
    .flat() // Flatten the array

  // Group permissions by category
  const groupedPermissions = permissionNames.reduce((acc, permission) => {
    if (typeof permission === 'string') {
      const [section, perm] = permission.split(': ')
      if (!acc[section]) {
        acc[section] = []
      }
      acc[section].push(perm)
    }
    return acc
  }, {})

  // Convert to array of formatted strings
  return Object.entries(groupedPermissions)
    .map(([section, perms]) => {
      return `${section}:\n${perms.map((p) => `  • ${p}`).join('\n')}`
    })
    .join('\n\n')
}

// Add handleDuplicate function
const handleDuplicate = (rowData) => {
  roleToDuplicate.value = rowData
  duplicateConfirmModal.value?.showModal()
}

// Modify confirmDuplicate function
const confirmDuplicate = () => {
  if (roleToDuplicate.value) {
    try {
      // Create new role data with "Copy of" prefix
      const newRoleData = {
        'role name': `Copy of ${roleToDuplicate.value['role name']}`,
        description: roleToDuplicate.value.description,
        permissions: [...roleToDuplicate.value.permissions],
        'last modified': new Date().toLocaleString(),
      }

      // Add the new role
      rolesStore.addRole(newRoleData)
      duplicateConfirmModal.value?.close()
      roleToDuplicate.value = null
      showNotification('Role duplicated successfully', 'success')

      // The table will automatically update due to the watch on roles
    } catch (error) {
      showNotification(error.message, 'error')
    }
  }
}

// Add cancelDuplicate function
const cancelDuplicate = () => {
  duplicateConfirmModal.value?.close()
  roleToDuplicate.value = null
}
</script>

<template>
  <div class="container bg-white rounded-md p-5 text-black">
    <div class="title">
      <h1 class="text-[24px] font-semibold">Roles & Permission's</h1>
    </div>

    <!-- action container -->
    <div class="flex flex-col gap-2 mt-5">
      <!-- create role btn -->
      <div
        class="btn btn-sm font-thin w-35 border-none shadow-none bg-primaryColor hover:bg-primaryColor/80 cursor-pointer"
        @click="navigateToCreateRole"
      >
        <Plus /> Create Role
      </div>

      <!-- Modified search container -->
      <div class="flex items-center gap-5">
        <label class="input-search input-sm">
          <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <g
              stroke-linejoin="round"
              stroke-linecap="round"
              stroke-width="2.5"
              fill="none"
              stroke="currentColor"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </g>
          </svg>
          <input
            v-model="searchInput"
            type="search"
            placeholder="Search"
            class=""
            @input="handleSearch"
          />
        </label>
        <div
          class="border p-1 rounded-sm cursor-pointer hover:bg-gray-100"
          @click="handleRefresh"
          title="Refresh table"
        >
          <RefreshCw class="text-primaryColor w-5 h-5" />
        </div>
      </div>

      <!-- table container -->
      <div class="w-full bg-white shadow-md rounded-md">
        <div ref="tableRef"></div>
      </div>
    </div>

    <!-- Add Update Confirmation Modal -->
    <dialog ref="updateConfirmModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-lg text-black">Confirm Update</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>

        <div v-if="roleDataToUpdate" class="py-4">
          <div class="flex flex-col gap-2">
            <div class="flex flex-row">
              <div class="w-32 text-gray-500">Role Name:</div>
              <div class="text-black">{{ roleDataToUpdate['role name'] }}</div>
            </div>
            <div class="flex flex-row">
              <div class="w-32 text-gray-500">Description:</div>
              <div class="text-black">{{ roleDataToUpdate.description }}</div>
            </div>
            <div class="flex flex-col">
              <div class="text-gray-500 mb-2">Permissions:</div>
              <pre class="text-black text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded-md">{{
                formatPermissions(roleDataToUpdate.permissions)
              }}</pre>
            </div>
          </div>
        </div>

        <div class="modal-action justify-center gap-4">
          <button class="btn-primaryStyle" @click="confirmUpdate">Update</button>
          <button class="btn-secondaryStyle" @click="cancelUpdate">Cancel</button>
        </div>
      </div>
    </dialog>

    <!-- Add Edit Confirmation Modal -->
    <dialog ref="editConfirmModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-lg text-black">Confirm Edit</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>

        <div v-if="roleToEdit" class="py-4">
          <p class="text-center text-black">
            Are you sure you want to edit the role
            <span class="font-bold">{{ roleToEdit['role name'] }}</span
            >?
          </p>

          <div class="mt-4 flex flex-col gap-2">
            <div class="flex flex-row">
              <div class="w-32 text-gray-500">Description:</div>
              <div class="text-black">{{ roleToEdit.description }}</div>
            </div>
            <div class="flex flex-col">
              <div class="text-gray-500 mb-2">Permissions:</div>
              <pre class="text-black text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded-md">{{
                formatPermissions(roleToEdit.permissions)
              }}</pre>
            </div>
          </div>
        </div>

        <div class="modal-action justify-center gap-4">
          <button class="btn-primaryStyle" @click="confirmEdit">Edit</button>
          <button class="btn-secondaryStyle" @click="cancelEdit">Cancel</button>
        </div>
      </div>
    </dialog>

    <!-- Add Delete Confirmation Modal -->
    <dialog ref="deleteConfirmModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-lg text-black">Confirm Delete</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>

        <p class="py-4 text-center text-black">
          Are you sure you want to delete the role
          <span class="font-bold">{{ roleToDelete?.['role name'] }}</span
          >?
        </p>

        <div class="modal-action justify-center gap-4">
          <button class="btn-errorStyle" @click="confirmDelete">Delete</button>
          <button class="btn-secondaryStyle" @click="cancelDelete">Cancel</button>
        </div>
      </div>
    </dialog>

    <!-- Add Duplicate Confirmation Modal -->
    <dialog ref="duplicateConfirmModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-lg text-black">Confirm Duplicate</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>

        <div v-if="roleToDuplicate" class="py-4">
          <p class="text-center text-black">
            Are you sure you want to duplicate the role
            <span class="font-bold">{{ roleToDuplicate['role name'] }}</span
            >?
          </p>

          <div class="mt-4 flex flex-col gap-2">
            <div class="flex flex-row">
              <div class="w-32 text-gray-500">New Name:</div>
              <div class="text-black">Copy of {{ roleToDuplicate['role name'] }}</div>
            </div>
            <div class="flex flex-row">
              <div class="w-32 text-gray-500">Description:</div>
              <div class="text-black">{{ roleToDuplicate.description }}</div>
            </div>
            <div class="flex flex-col">
              <div class="text-gray-500 mb-2">Permissions to copy:</div>
              <pre class="text-black text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded-md">{{
                formatPermissions(roleToDuplicate.permissions)
              }}</pre>
            </div>
          </div>
        </div>

        <div class="modal-action justify-center gap-4">
          <button class="btn-primaryStyle" @click="confirmDuplicate">Duplicate</button>
          <button class="btn-secondaryStyle" @click="cancelDuplicate">Cancel</button>
        </div>
      </div>
    </dialog>

    <!-- Add Toast component -->
    <Toast :show="toast.show" :type="toast.type" :message="toast.message" />

    <!-- Add loading state -->
    <div v-if="rolesStore.loading" class="loading-overlay">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
  </div>
</template>
