<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { Plus, RefreshCw } from 'lucide-vue-next'
import { useRouter, useRoute } from 'vue-router'
import { useRolesStore } from '@/stores/Users & Role/roleStore'
import { storeToRefs } from 'pinia'
import { useNotification } from '@/composables/Admin Composables/User & Role/role/useNotification'
import { TabulatorFull as Tabulator } from 'tabulator-tables'
import Toast from '@/components/Admin Components/HR/Toast.vue'
import { getPermissionCategories } from '@/composables/Admin Composables/User & Role/role/permissions'

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
const duplicateConfirmModal = ref(null)
const roleToView = ref(null)
const roleToDelete = ref(null)
const roleToDuplicate = ref(null)

// Determine if we're in admin mode
const isAdminMode = computed(() => route.path.startsWith('/admin'))

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
    field: 'last_modified',
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
      return `
        <div class="flex gap-2">
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
          <button class="btn btn-sm btn-circle hover:bg-secondaryColor border-none btn-ghost duplicate-button" title="Duplicate Role">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2z" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
          <button class="btn btn-sm btn-circle hover:bg-red-400 border-none btn-ghost delete-button" title="Delete Role">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>`
    },
    headerSort: false,
    cellClick: function (e, cell) {
      const record = cell.getRow().getData()
      const button = e.target.closest('button')
      if (!button) return

      if (button.classList.contains('view-button')) handleView(record)
      else if (button.classList.contains('edit-button')) handleEdit(record)
      else if (button.classList.contains('delete-button')) handleDelete(record)
      else if (button.classList.contains('duplicate-button')) handleDuplicate(record)
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
  roleToView.value = rowData
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

const handleDuplicate = (rowData) => {
  roleToDuplicate.value = rowData
  duplicateConfirmModal.value?.showModal()
}

// Update the handleRefresh function to be reusable
const refreshTableData = async () => {
  try {
    isLoading.value = true
    await rolesStore.fetchRoles()
    filteredRoles.value = roles.value
    await updateTableData(filteredRoles.value)
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
    showToastMessage('Role deleted successfully')
    await refreshTableData()
  } catch (error) {
    showToastMessage('Error deleting role', 'error')
  }
}

// Update confirmDuplicate to refresh the table
const confirmDuplicate = async () => {
  if (!roleToDuplicate.value) return

  try {
    const newRoleData = {
      role_name: `Copy of ${roleToDuplicate.value.role_name}`,
      description: roleToDuplicate.value.description || '',
      permissions: roleToDuplicate.value.permissions || [],
    }
    await rolesStore.addRole(newRoleData)
    duplicateConfirmModal.value?.close()
    roleToDuplicate.value = null
    showToastMessage('Role duplicated successfully')
    await refreshTableData()
  } catch (error) {
    showToastMessage('Error duplicating role', 'error')
  }
}

// Navigation
const navigateToCreateRole = () => {
  const routeName = isAdminMode.value ? 'AdminCreateRole' : 'CreateRole'
  router.push({ name: routeName })
}

// Add this function after the other function definitions but before the lifecycle hooks
const formatPermissions = (permissions) => {
  if (!permissions || !Array.isArray(permissions)) return 'No permissions'

  const categories = getPermissionCategories(permissions)
  let formattedText = ''

  for (const [category, perms] of Object.entries(categories)) {
    formattedText += `${category}:\n`
    for (const [permName] of Object.entries(perms)) {
      formattedText += `  • ${permName}\n`
    }
    formattedText += '\n'
  }

  return formattedText.trim()
}

// Lifecycle hooks
onMounted(async () => {
  try {
    await rolesStore.fetchRoles()
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

    <!-- Duplicate Confirmation Modal -->
    <dialog ref="duplicateConfirmModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-lg text-black">Confirm Duplicate</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>

        <div v-if="roleToDuplicate" class="py-4">
          <p class="text-center text-black">
            Are you sure you want to duplicate the role
            <span class="font-bold">{{ roleToDuplicate.role_name }}</span
            >?
          </p>

          <div class="mt-4 flex flex-col gap-2">
            <div class="flex flex-row">
              <div class="w-32 text-gray-500">New Name:</div>
              <div class="text-black">Copy of {{ roleToDuplicate.role_name }}</div>
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
          <button class="btn-secondaryStyle" @click="duplicateConfirmModal?.close()">Cancel</button>
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
                    new Date(roleToView.last_modified).toLocaleString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    })
                  }}
                </span>
              </div>
              <p class="text-gray-600 text-sm">{{ roleToView.description }}</p>
            </div>

            <div class="bg-gray-50 p-4 rounded-md">
              <h4 class="font-semibold mb-3 text-sm">Permissions</h4>
              <div class="grid gap-4 text-sm">
                <template
                  v-for="(categoryPerms, category) in getPermissionCategories(
                    roleToView.permissions,
                  )"
                  :key="category"
                >
                  <div class="border-b border-gray-200 pb-4 last:border-b-0">
                    <h5 class="font-medium text-primaryColor mb-2 flex items-center gap-2">
                      <span class="w-[3px] h-4 bg-primaryColor rounded-full"></span>
                      {{ category }}
                    </h5>
                    <div class="grid grid-cols-2 gap-2 pl-4 text-sm">
                      <template v-for="(permId, permName) in categoryPerms" :key="permId">
                        <div class="flex items-center gap-2">
                          <span class="w-2 h-2 rounded-full bg-secondaryColor"></span>
                          <span class="text-black">{{ permName }}</span>
                        </div>
                      </template>
                    </div>
                  </div>
                </template>
              </div>
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
