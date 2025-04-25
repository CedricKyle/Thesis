<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { Plus, RefreshCw } from 'lucide-vue-next'
import { useRouter, useRoute } from 'vue-router'
import { useRolesStore } from '@/stores/Users & Role/roleStore'
import { storeToRefs } from 'pinia'
import { useNotification } from '@/composables/Admin Composables/User & Role/role/useNotification'
import { TabulatorFull as Tabulator } from 'tabulator-tables'
import Toast from '@/components/Admin Components/HR/Toast.vue'
import { getPermissionCategories } from '@/composables/Admin Composables/User & Role/role/permissions'
import {
  PERMISSION_IDS,
  permissionGroups,
} from '@/composables/Admin Composables/User & Role/role/permissionsId'

const router = useRouter()
const route = useRoute()
const rolesStore = useRolesStore()
const { roles } = storeToRefs(rolesStore)
const { showNotification } = useNotification()

// Table refs
const tableRef = ref(null)
const isTableBuilt = ref(false)
let table = null

// State
const isLoading = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('')
const searchInput = ref('')
const filteredRoles = ref([])

// Modal refs
const viewModal = ref(null)
const deleteConfirmModal = ref(null)
const roleToView = ref(null)
const roleToDelete = ref(null)

// Determine if we're in admin mode
const isAdminMode = computed(() => route.path.startsWith('/admin'))

// In UserRolesManagement.vue, add a new ref for showing archived roles
const showArchived = ref(false)

// Table configuration
const columns = [
  {
    title: 'Role Name',
    field: 'role_name',
    sorter: 'string',
    headerSort: true,
    width: 200,
  },
  {
    title: 'Description',
    field: 'description',
    sorter: 'string',
    headerSort: true,
    formatter: (cell) => {
      const value = cell.getValue() || ''
      return `<div class="truncate" title="${value}">${value}</div>`
    },
    width: 500,
  },
  {
    title: 'Last Modified',
    field: 'updated_at',
    sorter: 'date',
    headerSort: true,
    formatter: (cell) => {
      const value = cell.getValue()
      if (!value) return 'Not Modified'
      try {
        const date = new Date(value)
        return date.toLocaleString('en-PH', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'Asia/Manila',
        })
      } catch (error) {
        return 'Not Modified'
      }
    },
  },
  {
    title: 'Status',
    field: 'deleted_at',
    formatter: function (cell) {
      const isDeleted = cell.getValue() !== null
      return `<span class="badge ${isDeleted ? 'badge-error' : 'badge-success'}">${isDeleted ? 'Archived' : 'Active'}</span>`
    },
    width: 100,
  },
  {
    title: 'Actions',
    formatter: function (cell) {
      const row = cell.getRow().getData()
      const isDeleted = row.deleted_at !== null
      return `
        <div class="flex gap-2">
          ${
            isDeleted
              ? `
            <button class="btn btn-sm btn-circle hover:bg-green-500 border-none btn-ghost restore-button" title="Restore Role">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 12h18M12 3v18" />
              </svg>
            </button>
          `
              : `
            <button class="btn btn-sm btn-circle hover:bg-primaryColor/80 border-none btn-ghost view-button" title="View Permissions">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                <path d="M2 12s3-9 10-9 10 9 10 9-3 9-10 9-10-9-10-9z"/>
              </svg>
            </button>
            <button class="btn btn-sm btn-circle hover:bg-primaryColor/80 border-none btn-ghost edit-button" title="Edit Role">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button class="btn btn-sm btn-circle hover:bg-red-400 border-none btn-ghost delete-button" title="Archive Role">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          `
          }
        </div>`
    },
    cellClick: function (e, cell) {
      const record = cell.getRow().getData()
      const button = e.target.closest('button')
      if (!button) return

      if (button.classList.contains('restore-button')) handleRestore(record)
      else if (button.classList.contains('view-button')) handleView(record)
      else if (button.classList.contains('edit-button')) handleEdit(record)
      else if (button.classList.contains('delete-button')) handleDelete(record)
    },
  },
]

// Table functions
const initTable = async () => {
  if (tableRef.value) {
    table = new Tabulator(tableRef.value, {
      data: filteredRoles.value,
      columns,
      layout: 'fitColumns',
      responsiveLayout: 'collapse',
      height: '100%',
      pagination: true,
      paginationSize: 10,
      paginationSizeSelector: [10, 25, 50],
      placeholder: 'No roles available',
    })

    await table.on('tableBuilt', () => {
      isTableBuilt.value = true
    })
  }
}

const updateTableData = async (data) => {
  if (table) {
    await table.setData(data)
  }
}

// Search and filter
const handleSearch = () => {
  if (!searchInput.value.trim()) {
    filteredRoles.value = roles.value
  } else {
    const searchTerm = searchInput.value.toLowerCase()
    filteredRoles.value = roles.value.filter((role) => {
      return (
        role.role_name.toLowerCase().includes(searchTerm) ||
        (role.description?.toLowerCase() || '').includes(searchTerm)
      )
    })
  }
  updateTableData(filteredRoles.value)
}

// Toast handler
const showToastMessage = (message, type = 'success') => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// Role actions
const handleView = (rowData) => {
  // Ensure permissions is always an array
  roleToView.value = {
    ...rowData,
    permissions: Array.isArray(rowData.permissions)
      ? rowData.permissions
      : typeof rowData.permissions === 'string'
        ? JSON.parse(rowData.permissions)
        : [],
  }
  viewModal.value?.showModal()
}

const handleEdit = (rowData) => {
  const routeName = isAdminMode.value ? 'AdminEditRole' : 'EditRole'
  router.push({ name: routeName, params: { id: rowData.id } })
}

const handleDelete = (rowData) => {
  roleToDelete.value = rowData
  deleteConfirmModal.value?.showModal()
}

// Modify the refreshTableData function
const refreshTableData = async () => {
  try {
    isLoading.value = true
    await rolesStore.fetchRoles(showArchived.value)
    filteredRoles.value = roles.value
    if (table) {
      await table.clearData()
      await table.setData(filteredRoles.value)
    }
  } catch (error) {
    console.error('Error refreshing roles:', error)
    showNotification('Error refreshing roles', 'error')
  } finally {
    isLoading.value = false
  }
}

// Modify handleRefresh to use the new function
const handleRefresh = async () => {
  searchInput.value = ''
  await refreshTableData()
}

// Update confirmDelete to refresh the table
const confirmDelete = async () => {
  if (!roleToDelete.value) return

  try {
    await rolesStore.deleteRole(roleToDelete.value.id)
    deleteConfirmModal.value?.close()
    roleToDelete.value = null
    showToastMessage('Role archived successfully')
    await refreshTableData() // This will maintain the current showArchived state
  } catch (error) {
    showToastMessage('Error archiving role', 'error')
  }
}

// Navigation
const navigateToCreateRole = () => {
  const routeName = isAdminMode.value ? 'AdminCreateRole' : 'CreateRole'
  router.push({ name: routeName })
}

// Add this computed property
const formattedPermissions = computed(() => {
  if (!roleToView.value?.permissions) return []
  return roleToView.value.permissions.map((permId) => {
    for (const [key, value] of Object.entries(PERMISSION_IDS)) {
      if (value === permId) return key
    }
    return permId
  })
})

// Add these computed properties
const groupedPermissions = computed(() => {
  if (!roleToView.value?.permissions) return {}

  let permissions = roleToView.value.permissions
  if (typeof permissions === 'string') {
    try {
      permissions = JSON.parse(permissions)
    } catch (e) {
      permissions = []
    }
  }

  if (!Array.isArray(permissions)) {
    permissions = []
  }

  const groups = {}

  // Group permissions by their category
  permissions.forEach((permId) => {
    for (const [groupName, group] of Object.entries(permissionGroups)) {
      const permission = group.permissions.find((p) => p.id === permId)
      if (permission) {
        if (!groups[groupName]) {
          groups[groupName] = []
        }
        groups[groupName].push(permission)
      }
    }
  })

  return groups
})

// Add restore functionality
const handleRestore = async (rowData) => {
  try {
    await rolesStore.restoreRole(rowData.id)
    showToastMessage('Role restored successfully')
    await refreshTableData()
  } catch (error) {
    showToastMessage('Error restoring role', 'error')
  }
}

// Add a watch to handle checkbox changes
watch(showArchived, async (newValue) => {
  await refreshTableData()
})

// Lifecycle hooks
onMounted(async () => {
  try {
    await rolesStore.fetchRoles(showArchived.value) // Pass the showArchived value
    filteredRoles.value = roles.value
    await initTable()
  } catch (error) {
    console.error('Error loading roles:', error)
    showNotification('Error loading roles', 'error')
  }
})

onBeforeUnmount(() => {
  if (table) {
    table.destroy()
    table = null
  }
})
</script>

<template>
  <div class="container bg-white rounded-md p-5 text-black">
    <div class="title">
      <h1 class="text-[24px] font-semibold">Roles & Permission's</h1>
    </div>

    <div class="flex flex-col gap-2 mt-5">
      <div
        class="btn btn-sm font-thin w-35 border-none shadow-none bg-primaryColor hover:bg-primaryColor/80 cursor-pointer"
        @click="navigateToCreateRole"
      >
        <Plus /> Create Role
      </div>

      <div class="flex items-center gap-5">
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            v-model="showArchived"
            @input="refreshTableData"
            class="checkbox checkbox-sm"
          />
          <span class="text-sm">Show Archived</span>
        </label>
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

      <div class="w-full bg-white shadow-md rounded-md">
        <div ref="tableRef"></div>
      </div>
    </div>

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
          <button class="btn-secondaryStyle" @click="deleteConfirmModal?.close()">Cancel</button>
        </div>
      </div>
    </dialog>

    <div v-if="rolesStore.loading" class="loading-overlay">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <Toast :show="showToast" :message="toastMessage" :type="toastType" />

    <dialog ref="viewModal" class="modal">
      <div class="modal-box bg-white w-[500px]">
        <h3 class="font-bold text-lg text-black">Role Permissions</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>

        <div v-if="roleToView" class="py-4">
          <div class="flex flex-col gap-4">
            <div class="flex flex-col">
              <div class="flex items-center justify-between">
                <span class="font-semibold text-lg">{{ roleToView.role_name }}</span>
                <span class="text-xs text-gray-500">
                  Last Modified:
                  {{
                    roleToView.updated_at
                      ? new Date(roleToView.updated_at).toLocaleString('en-PH', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                          timeZone: 'Asia/Manila',
                        })
                      : 'Not Modified'
                  }}
                </span>
              </div>
              <p class="text-gray-600 text-sm">{{ roleToView.description }}</p>
            </div>

            <div class="bg-gray-50 p-4 rounded-md">
              <h4 class="font-semibold mb-3 text-sm">Permissions</h4>
              <div
                v-if="roleToView.permissions && roleToView.permissions.length > 0"
                class="grid gap-4 text-sm"
              >
                <template v-for="(group, groupName) in groupedPermissions" :key="groupName">
                  <div class="border-b border-gray-200 pb-4 last:border-b-0">
                    <h5 class="font-medium text-primaryColor mb-2 flex items-center gap-2">
                      <span class="w-[3px] h-4 bg-primaryColor rounded-full"></span>
                      {{ groupName }}
                    </h5>
                    <div class="grid grid-cols-2 gap-2 pl-4">
                      <div
                        v-for="permission in group"
                        :key="permission.id"
                        class="flex items-center gap-2"
                      >
                        <span class="w-2 h-2 rounded-full bg-secondaryColor"></span>
                        <span class="text-black">{{ permission.name }}</span>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
              <div v-else class="text-gray-500 text-sm">No permissions assigned</div>
            </div>
          </div>
        </div>

        <div class="modal-action justify-center">
          <button class="btn-secondaryStyle" @click="viewModal?.close()">Close</button>
        </div>
      </div>
    </dialog>
  </div>
</template>

<style scoped>
.modal {
  background: rgba(0, 0, 0, 0.5) !important;
}
.modal-box {
  background: white !important;
  position: relative;
  z-index: 1000;
}
.loading-overlay {
  z-index: 2000;
}
</style>
