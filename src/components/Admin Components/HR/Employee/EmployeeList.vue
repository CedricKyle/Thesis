<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'
import BaseTable from '@/components/common/BaseTable.vue'
import EmployeeView from './EmployeeView.vue'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/Admin Composables/Human Resource/useToast'
import Toast from '@/components/Admin Components/HR/Toast.vue'
import { useAuthStore } from '@/stores/Authentication/authStore'
import { UndoDot } from 'lucide-vue-next'
import { DEPARTMENTS } from '@/composables/Admin Composables/User & Role/role/permissionsId'

const router = useRouter()
const store = useEmployeeStore()
const { showToast, toastMessage, toastType, showToastMessage } = useToast()
const authStore = useAuthStore()

// Modal refs
const deleteConfirmModal = ref(null)
const restoreConfirmModal = ref(null)
const employeeToDelete = ref(null)
const employeeToRestore = ref(null)

// Add search functionality and archive toggle
const searchQuery = ref('')
const showArchived = ref(false)

const selectedDepartment = ref('All')
const selectedBranch = ref('All')

// For now, static branch list; you can update this later to be dynamic
const branchOptions = ['All', 'Main Branch', 'Branch 1', 'Branch 2']

// Add this computed property to check if current user is Super Admin
const isSuperAdmin = computed(() => {
  return authStore.currentUser?.role === 'Super Admin'
})

// Updated filtered employees computed property
const filteredEmployees = computed(() => {
  if (!store.employees) return []

  let employees = [...store.employees]

  // Always filter out Super Admin users
  employees = employees.filter((emp) => emp.roleInfo?.role_name !== 'Super Admin')

  // Department filter
  if (selectedDepartment.value !== 'All') {
    employees = employees.filter((emp) => emp.department === selectedDepartment.value)
  }

  // Branch filter (future-proof, assuming employee.branch exists)
  if (selectedBranch.value !== 'All') {
    employees = employees.filter((emp) => emp.branch === selectedBranch.value)
  }

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    employees = employees.filter(
      (employee) =>
        employee.employee_id.toLowerCase().includes(query) ||
        employee.full_name.toLowerCase().includes(query) ||
        employee.department.toLowerCase().includes(query) ||
        (employee.positionInfo?.position_title || '').toLowerCase().includes(query) ||
        employee.email.toLowerCase().includes(query) ||
        employee.contact_number.toLowerCase().includes(query),
    )
  }

  // Archived filter
  if (!showArchived.value) {
    employees = employees.filter((emp) => !emp.deleted_at)
  }

  return employees
})

// Define columns for Tabulator
const columns = [
  // {
  //   title: 'Employee ID',
  //   field: 'employee_id',
  //   sorter: 'string',
  // },
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
    field: 'position_title',
    sorter: 'string',
    formatter: function (cell) {
      const employee = cell.getRow().getData()
      return employee.positionInfo?.position_title || ''
    },
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
    title: 'Status',
    field: 'deleted_at',
    formatter: function (cell) {
      const deleted_at = cell.getValue()
      return deleted_at
        ? `<span class="badge badge-outline badge-error h-5  text-xs">Archived</span>`
        : `<span class="badge badge-outline badge-success h-5 text-xs">Active</span>`
    },
    width: 100,
  },
  {
    title: 'Actions',
    formatter: function (cell) {
      const employee = cell.getRow().getData()
      const isArchived = employee.deleted_at

      if (isArchived) {
        return `
          <div class="flex gap-2">
            <button class="btn btn-sm btn-circle hover:bg-primaryColor/80 border-none btn-ghost view-button" title='View Employee'>
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
            <button class="btn btn-sm btn-circle hover:bg-green-500 border-none btn-ghost restore-button" title='Restore Employee'>
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 14l-4-4 4-4"/>
                <path d="M5 10h11a4 4 0 1 1 0 8h-1"/>
              </svg>
            </button>
          </div>`
      }

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
          <button class="btn btn-sm btn-circle hover:bg-red-400 border-none btn-ghost delete-button" title='Archive Employee'>
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
      } else if (e.target.closest('.restore-button')) {
        handleRestore(record)
      }
    },
    hozAlign: 'center',
    width: 150,
  },
]

// Table options with row formatting
const tableOptions = {
  pagination: true,
  paginationSize: 10,
  initialSort: [{ column: 'employee_id', dir: 'asc' }],
  rowFormatter: function (row) {
    if (row.getData().deleted_at) {
      row.getElement().classList.add('archived-row')
    }
  },
}

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

const handleRestore = (employee) => {
  employeeToRestore.value = employee
  restoreConfirmModal.value?.showModal()
}

const confirmDelete = async () => {
  if (employeeToDelete.value) {
    try {
      await store.deleteEmployee(employeeToDelete.value.employee_id)
      await store.loadEmployees()
      deleteConfirmModal.value?.close()
      employeeToDelete.value = null
      showToastMessage('Employee archived successfully', 'success')
    } catch (error) {
      showToastMessage(error.message || 'Error archiving employee', 'error')
    }
  }
}

const confirmRestore = async () => {
  if (employeeToRestore.value) {
    try {
      await store.restoreEmployee(employeeToRestore.value.employee_id)
      await store.loadEmployees()
      if (!showArchived.value) {
        showArchived.value = true
      }
      restoreConfirmModal.value?.close()
      employeeToRestore.value = null
      showToastMessage('Employee restored successfully', 'success')
    } catch (error) {
      showToastMessage(error.message || 'Error restoring employee', 'error')
    }
  }
}

const cancelDelete = () => {
  deleteConfirmModal.value?.close()
  employeeToDelete.value = null
}

const cancelRestore = () => {
  restoreConfirmModal.value?.close()
  employeeToRestore.value = null
}

onMounted(() => {
  store.loadEmployees()
})

// Add a watch for authentication state
watch(
  () => authStore.isAuthenticated,
  async (isAuthenticated) => {
    if (isAuthenticated) {
      try {
        await store.loadEmployees()
      } catch (error) {
        console.error('Error loading employees:', error)
        showToastMessage('Error loading employees', 'error')
      }
    }
  },
)

// Watch for changes in store.employees
watch(
  () => store.employees,
  () => {},
  { deep: true },
)
</script>

<template>
  <div class="flex flex-col mt-4">
    <!-- Add archive toggle and search bar container -->
    <div class="flex flex-wrap gap-4 justify-between items-center mb-4">
      <!-- Filters -->
      <div class="flex gap-4">
        <!-- Department Filter -->
        <label class="flex items-center gap-2">
          <span class="text-sm text-black">Department:</span>
          <select
            v-model="selectedDepartment"
            class="select select-sm border border-black bg-white text-black"
          >
            <option value="All">All</option>
            <option
              v-for="(dept, key) in Object.values(DEPARTMENTS).filter(
                (d) => d !== 'Admin Department',
              )"
              :key="key"
              :value="dept"
            >
              {{ dept }}
            </option>
          </select>
        </label>
        <!-- Branch Filter -->
        <label class="flex items-center gap-2">
          <span class="text-sm text-black">Branch:</span>
          <select
            v-model="selectedBranch"
            class="select select-sm border border-black bg-white text-black"
          >
            <option v-for="branch in branchOptions" :key="branch" :value="branch">
              {{ branch }}
            </option>
          </select>
        </label>
      </div>
      <!-- Search input -->
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
        <input v-model="searchQuery" type="search" placeholder="Search" class="" />
      </label>
    </div>

    <!-- Table -->
    <BaseTable :data="filteredEmployees" :columns="columns" :options="tableOptions" />

    <div class="flex justify-end mt-4">
      <label class="cursor-pointer flex items-center gap-2">
        <input
          type="checkbox"
          v-model="showArchived"
          class="checkbox checkbox-xs checkbox-neutral"
        />
        <span class="text-sm cursor-pointer hover:text-gray-500 text-black"
          >Show Archived Employees</span
        >
      </label>
    </div>

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

    <!-- Restore Confirmation Modal -->
    <dialog ref="restoreConfirmModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-md text-black">Confirm Restore</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>

        <p class="py-4 text-center text-black text-sm">
          Are you sure you want to restore employee
          <span class="font-bold">{{ employeeToRestore?.full_name }}</span
          >?
        </p>

        <div class="modal-action justify-center gap-4">
          <button class="btn-primaryStyle" @click="confirmRestore">Restore</button>
          <button class="btn-secondaryStyle" @click="cancelRestore">Cancel</button>
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

/* Archived row styling */
.archived-row {
  background-color: rgba(0, 0, 0, 0.05);
}

.archived-row:hover {
  background-color: rgba(0, 0, 0, 0.08) !important;
}
</style>
