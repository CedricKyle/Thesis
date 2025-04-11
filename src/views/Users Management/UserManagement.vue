<script setup>
import { ref, onMounted, watch, onUnmounted, computed } from 'vue'
import { Plus, RefreshCw, Pencil, Trash2, Search, X } from 'lucide-vue-next'
import { TabulatorFull as Tabulator } from 'tabulator-tables'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/Users & Role/userStore'
import { useRolesStore } from '@/stores/Users & Role/roleStore'
import { storeToRefs } from 'pinia'
import Toast from '@/components/Admin Components/HR/Toast.vue'

const router = useRouter()
const userStore = useUserStore()
const rolesStore = useRolesStore()
const { users } = storeToRefs(userStore)

// Define columns for Tabulator
const columns = [
  {
    title: 'Full Name',
    field: 'full_name',
    sorter: 'string',
    headerSort: true,
  },
  {
    title: 'Email',
    field: 'email',
    sorter: 'string',
    headerSort: true,
  },
  {
    title: 'Role',
    field: 'role_name',
    sorter: 'string',
    headerSort: true,
  },
  {
    title: 'Status',
    field: 'status',
    sorter: 'string',
    headerSort: true,
  },
  {
    title: 'Created At',
    field: 'created_at',
    sorter: 'date',
    headerSort: true,
    formatter: (cell) => {
      const value = cell.getValue()
      if (!value) return '' // Return empty string if no date

      try {
        const date = new Date(value)
        if (isNaN(date.getTime())) return '' // Return empty string if invalid date

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
      } catch (error) {
        return '' // Return empty string if any error occurs
      }
    },
  },
  {
    title: 'Last Modified',
    field: 'last_modified',
    sorter: 'date',
    headerSort: true,
    formatter: (cell) => {
      const value = cell.getValue()
      if (!value) return '' // Return empty string if no date

      try {
        const date = new Date(value)
        if (isNaN(date.getTime())) return '' // Return empty string if invalid date

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
      } catch (error) {
        return '' // Return empty string if any error occurs
      }
    },
  },
  {
    title: 'Actions',
    formatter: function (cell) {
      const record = cell.getRow().getData()
      return `
        <div class="flex gap-2">
          <button class="btn btn-sm btn-circle hover:bg-primaryColor/80 border-none btn-ghost view-button" data-action="view">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
          <button class="btn btn-sm btn-circle hover:bg-secondaryColor/80 border-none btn-ghost edit-button" data-action="edit">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button class="btn btn-sm btn-circle hover:bg-red-400 border-none btn-ghost delete-button" data-action="delete">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>`
    },
    headerSort: false,
    cellClick: function (e, cell) {
      // Get the clicked element
      const clickedElement = e.target.closest('button')
      if (!clickedElement) return

      const action = clickedElement.getAttribute('data-action')
      const record = cell.getRow().getData()

      switch (action) {
        case 'view':
          handleView(record)
          break
        case 'edit':
          handleEdit(record)
          break
        case 'delete':
          handleDelete(record)
          break
      }
    },
  },
]

// Table reference
const tableRef = ref(null)

// Original data for refresh
const originalData = ref([...users.value])

// Table instance
let tableInstance = null

// Initialize table
const initTable = async () => {
  if (tableRef.value) {
    tableInstance = new Tabulator(tableRef.value, {
      data: users.value,
      columns: columns,
      layout: 'fitColumns',
      responsiveLayout: 'collapse',
      height: '100%',
      pagination: true,
      paginationSize: 10,
      paginationSizeSelector: [10, 25, 50],
      placeholder: 'No users available',
      cssClass: 'custom-tabulator',
    })
  }
}

onMounted(async () => {
  try {
    await rolesStore.fetchRoles()
    await userStore.fetchUsers()
    console.log('Users data structure:', users.value[0])

    // Destroy existing table instance if it exists
    if (tableInstance) {
      tableInstance.destroy()
    }

    // Initialize new table
    initTable()
  } catch (error) {
    console.error('Error fetching roles and users:', error)
  }
})

// Add onUnmounted to clean up the table
onUnmounted(() => {
  if (tableInstance) {
    tableInstance.destroy()
  }
})

// Handle edit action
const handleEdit = (rowData) => {
  router.push({
    name: 'EditUser',
    params: { id: rowData.id },
  })
}

// Add these refs
const deleteModal = ref(null)
const selectedUser = ref(null)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('')

// Add toast function
const showToastMessage = (message, type) => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// Update handle delete
const handleDelete = (rowData) => {
  selectedUser.value = rowData
  deleteModal.value?.showModal()
}

// Add confirm and cancel delete functions
const confirmDelete = async () => {
  try {
    await userStore.deleteUser(selectedUser.value.id)
    deleteModal.value?.close()
    showToastMessage('User deleted successfully', 'success')

    // Refresh table data
    await userStore.fetchUsers()
  } catch (error) {
    showToastMessage(error.message || 'Error deleting user', 'error')
  }
}

const cancelDelete = () => {
  deleteModal.value?.close()
  selectedUser.value = null
}

// Add handleView function
const viewModal = ref(null)

const handleView = (rowData) => {
  selectedUser.value = rowData
  viewModal.value?.showModal()
}

const closeViewModal = () => {
  viewModal.value?.close()
  selectedUser.value = null
}

// Add date formatter
const formatDate = (date) => {
  if (!date) return ''
  try {
    return new Date(date)
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
  } catch (error) {
    return ''
  }
}

// Remove all modal-related code and keep only the navigation function
const navigateToCreateUser = () => {
  console.log('Navigating to create user...')
  router.push({ name: 'CreateUser' }).catch((err) => {
    console.log('Navigation error:', err)
    if (err.name !== 'NavigationDuplicated') {
      console.error(err)
    }
  })
}

// Add these refs
const searchQuery = ref('')
const isSearching = ref(false)
const searchTimeout = ref(null)

// Add debounced search function
const handleSearch = (event) => {
  const query = event.target.value
  searchQuery.value = query

  // Clear previous timeout
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }

  // Set new timeout
  searchTimeout.value = setTimeout(async () => {
    isSearching.value = true
    try {
      if (query.trim() === '') {
        // If search is empty, reset to original data
        await userStore.fetchUsers()
      } else {
        // Search in multiple fields
        const filteredData = users.value.filter((user) => {
          const searchFields = [
            user.full_name,
            user.email,
            user.contact_number,
            user.role_name,
            user.status,
          ].map((field) => (field || '').toLowerCase())

          const searchTerms = query.toLowerCase().split(' ')

          return searchTerms.every((term) => searchFields.some((field) => field.includes(term)))
        })

        if (tableInstance) {
          tableInstance.replaceData(filteredData)
        }
      }
    } catch (error) {
      showToastMessage('Error performing search', 'error')
    } finally {
      isSearching.value = false
    }
  }, 300) // 300ms delay
}

// Add clear search function
const clearSearch = () => {
  searchQuery.value = ''
  userStore.fetchUsers()
}

// Refresh function
const handleRefresh = async () => {
  searchQuery.value = ''
  try {
    await userStore.fetchUsers()
    if (tableInstance) {
      tableInstance.replaceData(users.value)
    }
  } catch (error) {
    showToastMessage('Error refreshing data', 'error')
  }
}

watch(users, (newUsers) => {
  if (tableInstance) {
    tableInstance.replaceData(newUsers)
  }
})
</script>

<template>
  <div class="container bg-white rounded-md p-5 text-black">
    <div class="title">
      <h1 class="text-[24px] font-semibold">User Lists</h1>
    </div>

    <!-- action container -->
    <div class="flex flex-col gap-2 mt-5">
      <!-- create role btn -->
      <div
        class="btn btn-sm font-thin w-35 border-none shadow-none bg-primaryColor hover:bg-primaryColor/80 cursor-pointer"
        @click="navigateToCreateUser"
      >
        <Plus /> Create User
      </div>

      <!-- search container -->
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
            v-model="searchQuery"
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
      <div ref="tableRef" class="mt-4"></div>
    </div>
  </div>

  <!-- Add this at the bottom of your template -->
  <dialog ref="deleteModal" class="modal">
    <div class="modal-box bg-white w-[400px]">
      <h3 class="font-bold text-lg text-black">Confirm Delete User</h3>
      <div
        class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
      ></div>

      <div class="py-4">
        <p class="text-black mb-4">Are you sure you want to delete this user?</p>

        <div class="bg-gray-50 p-4 rounded-md">
          <div class="grid gap-3 text-sm">
            <div class="flex items-center">
              <span class="text-gray-500 w-24">Full Name:</span>
              <span class="text-black">{{ selectedUser?.full_name }}</span>
            </div>
            <div class="flex items-center">
              <span class="text-gray-500 w-24">Email:</span>
              <span class="text-black">{{ selectedUser?.email }}</span>
            </div>
            <div class="flex items-center">
              <span class="text-gray-500 w-24">Role:</span>
              <span class="text-black">{{ selectedUser?.role_name }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-action flex justify-center gap-3">
        <button class="btn-primaryStyle bg-red-500 hover:bg-red-600" @click="confirmDelete">
          Delete
        </button>
        <button class="btn-secondaryStyle" @click="cancelDelete">Cancel</button>
      </div>
    </div>
  </dialog>

  <!-- Add Toast component -->
  <Toast :show="showToast" :message="toastMessage" :type="toastType" />

  <dialog ref="viewModal" class="modal">
    <div class="modal-box bg-white w-[500px]">
      <h3 class="font-bold text-lg text-black">User Details</h3>
      <div
        class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
      ></div>

      <div class="py-4">
        <div class="bg-gray-50 p-4 rounded-md">
          <div class="grid gap-3">
            <div class="flex items-center">
              <span class="text-gray-500 w-32">Full Name:</span>
              <span class="text-black">{{ selectedUser?.full_name }}</span>
            </div>
            <div class="flex items-center">
              <span class="text-gray-500 w-32">Email:</span>
              <span class="text-black">{{ selectedUser?.email }}</span>
            </div>
            <div class="flex items-center">
              <span class="text-gray-500 w-32">Contact Number:</span>
              <span class="text-black">{{ selectedUser?.contact_number }}</span>
            </div>
            <div class="flex items-center">
              <span class="text-gray-500 w-32">Gender:</span>
              <span class="text-black">{{ selectedUser?.gender }}</span>
            </div>
            <div class="flex items-center">
              <span class="text-gray-500 w-32">Role:</span>
              <span class="text-black">{{ selectedUser?.role_name }}</span>
            </div>
            <div class="flex items-center">
              <span class="text-gray-500 w-32">Status:</span>
              <span class="text-black">{{ selectedUser?.status }}</span>
            </div>
            <div class="flex items-center">
              <span class="text-gray-500 w-32">Created At:</span>
              <span class="text-black">{{ formatDate(selectedUser?.created_at) }}</span>
            </div>
            <div class="flex items-center">
              <span class="text-gray-500 w-32">Last Modified:</span>
              <span class="text-black">{{ formatDate(selectedUser?.last_modified) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-action flex justify-center">
        <button class="btn-secondaryStyle" @click="closeViewModal">Close</button>
      </div>
    </div>
  </dialog>
</template>

<!-- <style scoped>
.input-bordered {
  @apply border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20;
}

.input {
  @apply transition-all duration-200;
}
</style> -->
