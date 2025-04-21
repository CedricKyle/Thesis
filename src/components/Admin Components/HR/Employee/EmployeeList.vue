<script setup>
import { ref, onMounted, watch } from 'vue'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'
import BaseTable from '@/components/common/BaseTable.vue'
import EmployeeView from './EmployeeView.vue'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/Admin Composables/Human Resource/useToast'
import Toast from '@/components/Admin Components/HR/Toast.vue'

const router = useRouter()
const store = useEmployeeStore()
const { showToast, toastMessage, toastType, showToastMessage } = useToast()

// Modal refs
const deleteConfirmModal = ref(null)
const employeeToDelete = ref(null)

// Define columns for Tabulator
const columns = [
  {
    title: 'Employee ID',
    field: 'employee_id',
    sorter: 'string',
  },
  {
    title: 'Full Name',
    field: 'full_name',
    sorter: 'string',
  },
  {
    title: 'Department',
    field: 'department',
    sorter: 'string',
  },
  {
    title: 'Job Title',
    field: 'job_title',
    sorter: 'string',
  },
  {
    title: 'Email Address',
    field: 'email',
    sorter: 'string',
  },
  {
    title: 'Contact Number',
    field: 'contact_number',
    sorter: 'string',
  },
  {
    title: 'Actions',
    formatter: function (cell) {
      return `
        <div class="flex gap-2">
          <button class="btn btn-sm btn-circle hover:bg-primaryColor/80 border-none btn-ghost view-button" title='View Employee'>
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
          <button class="btn btn-sm btn-circle hover:bg-primaryColor/80 border-none btn-ghost edit-button" title='Edit Employee'>
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button class="btn btn-sm btn-circle hover:bg-red-400 border-none btn-ghost delete-button" title='Delete Employee'>
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>`
    },
    headerSort: false,
    cellClick: function (e, cell) {
      const record = cell.getRow().getData()
      if (e.target.closest('.view-button')) {
        handleView(record)
      } else if (e.target.closest('.edit-button')) {
        handleEdit(record)
      } else if (e.target.closest('.delete-button')) {
        handleDelete(record)
      }
    },
    hozAlign: 'center',
    width: 150,
  },
]

// Table options
const tableOptions = {
  pagination: true,
  paginationSize: 10,
  initialSort: [{ column: 'employee_id', dir: 'asc' }],
}

// Add search functionality
const searchQuery = ref('')
const filteredEmployees = ref([])

const filterEmployees = () => {
  if (!searchQuery.value) {
    filteredEmployees.value = store.employees
    return
  }

  const query = searchQuery.value.toLowerCase()
  filteredEmployees.value = store.employees.filter(
    (employee) =>
      employee.employee_id.toLowerCase().includes(query) ||
      employee.full_name.toLowerCase().includes(query) ||
      employee.department.toLowerCase().includes(query) ||
      employee.job_title.toLowerCase().includes(query) ||
      employee.email.toLowerCase().includes(query) ||
      employee.contact_number.toLowerCase().includes(query),
  )
}

// Watch for changes in search query
watch(searchQuery, () => {
  filterEmployees()
})

// Watch for changes in store.employees
watch(
  () => store.employees,
  () => {
    filterEmployees()
  },
  { deep: true },
)

// Action handlers
const handleView = (employee) => {
  store.setSelectedEmployee(employee)
}

const handleEdit = (employee) => {
  const isAdmin = router.currentRoute.value.path.startsWith('/admin')
  router.push({
    name: isAdmin ? 'AdminEditEmployee' : 'EditEmployee',
    params: { id: employee.employee_id },
  })
}

const handleDelete = (employee) => {
  employeeToDelete.value = employee
  deleteConfirmModal.value?.showModal()
}

const confirmDelete = async () => {
  if (employeeToDelete.value) {
    try {
      await store.deleteEmployee(employeeToDelete.value.employee_id)
      deleteConfirmModal.value?.close()
      employeeToDelete.value = null
      showToastMessage('Employee deleted successfully', 'success')
    } catch (error) {
      showToastMessage(error.message || 'Error deleting employee', 'error')
    }
  }
}

const cancelDelete = () => {
  deleteConfirmModal.value?.close()
  employeeToDelete.value = null
}

onMounted(async () => {
  try {
    await store.loadEmployees()
    filterEmployees() // Initialize filtered employees
  } catch (error) {
    console.error('Error loading employees:', error)
    showToastMessage('Error loading employees', 'error')
  }
})
</script>

<template>
  <div class="flex flex-col mt-4">
    <!-- Add search input -->
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
        @input="filterEmployees"
      />
    </label>

    <!-- Update BaseTable to use filteredEmployees -->
    <BaseTable :data="filteredEmployees" :columns="columns" :options="tableOptions" />

    <!-- Delete Confirmation Modal -->
    <dialog ref="deleteConfirmModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-md text-black">Confirm Delete</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>

        <p class="py-4 text-center text-black text-sm">
          Are you sure you want to delete employee
          <span class="font-bold">{{ employeeToDelete?.full_name }}</span
          >?
        </p>

        <div class="modal-action justify-center gap-4">
          <button class="btn-errorStyle" @click="confirmDelete">Delete</button>
          <button class="btn-secondaryStyle" @click="cancelDelete">Cancel</button>
        </div>
      </div>
    </dialog>

    <!-- Employee View Modal -->
    <EmployeeView />

    <!-- Toast Notification -->
    <Toast :show="showToast" :message="toastMessage" :type="toastType" />
  </div>
</template>

<style scoped>
/* Add smooth transition for search input */
input {
  transition: all 0.3s ease;
}

input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.1);
}
</style>
