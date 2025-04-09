<script setup>
import { ref, onMounted, watch } from 'vue'
import { Plus, RefreshCw, Pencil, Trash2 } from 'lucide-vue-next'
import { TabulatorFull as Tabulator } from 'tabulator-tables'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/Users & Role/userStore'
import { storeToRefs } from 'pinia'

const router = useRouter()
const userStore = useUserStore()
const { users } = storeToRefs(userStore)

// Define columns for Tabulator
const columns = [
  {
    title: 'Full Name',
    field: 'fullName',
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
    field: 'role',
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
    field: 'createdAt',
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
    title: 'Last Modified',
    field: 'lastModified',
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
          <button class="btn btn-sm btn-circle hover:bg-primaryColor/80 border-none btn-ghost view-button">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
          <button class="btn btn-sm btn-circle hover:bg-secondaryColor/80 border-none btn-ghost edit-button">
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

onMounted(() => {
  initTable()
  console.log(users.value) // Check the structure of the users array
})

// Handle edit action
const handleEdit = (rowData) => {
  console.log('Edit role:', rowData)
  // Implement edit logic here
}

// Handle delete action
const handleDelete = (rowData) => {
  console.log('Delete role:', rowData)
  // Implement delete logic here
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

// Search function
const handleSearch = (event) => {
  const query = event.target.value.toLowerCase()
  const filteredData = originalData.value.filter((user) =>
    Object.values(user).some((val) => String(val).toLowerCase().includes(query)),
  )
  if (tableInstance) {
    tableInstance.replaceData(filteredData)
  }
}

// Refresh function
const handleRefresh = () => {
  if (tableInstance) {
    tableInstance.replaceData(originalData.value)
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
          <input type="search" required placeholder="Search" @input="handleSearch" class="" />
        </label>
        <div class="border p-1 rounded-sm cursor-pointer" @click="handleRefresh">
          <RefreshCw class="text-primaryColor w-5 h-5" />
        </div>
      </div>

      <!-- table container -->
      <div ref="tableRef" class="mt-4"></div>
    </div>
  </div>
</template>
