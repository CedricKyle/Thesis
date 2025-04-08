<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import { Plus, RefreshCw } from 'lucide-vue-next'
import { TabulatorFull as Tabulator } from 'tabulator-tables'
import { useRouter } from 'vue-router'
import { useRolesStore } from '@/stores/Users & Role/roleStore'
import { storeToRefs } from 'pinia'

const router = useRouter()
const rolesStore = useRolesStore()
const { roles } = storeToRefs(rolesStore)

const tableRef = ref(null)
const isTableBuilt = ref(false)
let table = null

// Add these new refs
const searchInput = ref('')
const filteredRoles = ref([])

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
    sorter: 'string',
    headerSort: true,
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

// Handle edit action
const handleEdit = (rowData) => {
  router
    .push({
      name: 'CreateRole',
      query: {
        edit: 'true',
        roleName: rowData['role name'],
      },
    })
    .catch((err) => {
      if (err.name !== 'NavigationDuplicated') {
        console.error(err)
      }
    })
}

// Handle delete action
const handleDelete = (rowData) => {
  rolesStore.deleteRole(rowData['role name'])
}

// Navigation function
const navigateToCreateRole = () => {
  router.push({ name: 'CreateRole' }).catch((err) => {
    if (err.name !== 'NavigationDuplicated') {
      console.error(err)
    }
  })
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
  </div>
</template>
