<script setup>
import { ref, onMounted } from 'vue'
import { Plus, RefreshCw, Pencil, Trash2 } from 'lucide-vue-next'
import { TabulatorFull as Tabulator } from 'tabulator-tables'
import { useRouter } from 'vue-router'

const router = useRouter()

// Sample data for the table
const tableData = ref([
  {
    'role name': 'Admin',
    description: 'Full system access',
    'last modified': '2024-03-20',
  },
  {
    'role name': 'User',
    description: 'Limited access',
    'last modified': '2024-03-19',
  },
])

const tableColums = [
  {
    title: 'Role Name',
    field: 'role name',
    width: 300,
  },
  {
    title: 'Description',
    field: 'description',
    width: 400,
  },
  {
    title: 'Last Modified',
    field: 'last modified',
    width: 250,
  },
  {
    title: 'Actions',
    field: 'actions',

    formatter: function (cell) {
      // Create wrapper div
      const wrapper = document.createElement('div')
      wrapper.className = 'flex gap-1 justify-start'

      // Create edit button
      const editBtn = document.createElement('button')
      editBtn.className =
        'btn btn-sm btn-circle hover:bg-primaryColor/80 border-none btn-ghost edit-button'
      editBtn.innerHTML = `
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
      `
      editBtn.onclick = () => handleEdit(cell.getRow().getData())

      // Create delete button
      const deleteBtn = document.createElement('button')
      deleteBtn.className =
        'btn btn-sm btn-circle hover:bg-red-400 border-none btn-ghost delete-button'
      deleteBtn.innerHTML = `
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
      `
      deleteBtn.onclick = () => handleDelete(cell.getRow().getData())

      wrapper.appendChild(editBtn)
      wrapper.appendChild(deleteBtn)
      return wrapper
    },
    hozAlign: 'center',
  },
]

// Table reference
const tableRef = ref(null)

// Initialize table
onMounted(() => {
  tableRef.value = new Tabulator('#rolesTable', {
    data: tableData.value,
    columns: tableColums,
    layout: 'fitColumns',
    pagination: true,
    paginationSize: 10,
  })
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
const navigateToCreateRole = () => {
  console.log('Navigating to create role...')
  router.push({ name: 'CreateRole' }).catch((err) => {
    console.log('Navigation error:', err)
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
          <input type="search" required placeholder="Search" class="" />
        </label>
        <div class="border p-1 rounded-sm cursor-pointer">
          <RefreshCw class="text-primaryColor w-5 h-5" />
        </div>
      </div>

      <!-- table container -->
      <div id="rolesTable" class="mt-4"></div>
    </div>
  </div>
</template>
