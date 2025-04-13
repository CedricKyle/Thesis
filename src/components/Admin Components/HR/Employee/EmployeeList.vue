<script setup>
import { ref, onMounted } from 'vue'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'
import BaseTable from '@/components/common/BaseTable.vue'
import EmployeeView from './EmployeeView.vue'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/Admin Composables/Human Resource/useToast'

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
    field: 'id',
    sorter: 'number',
  },
  {
    title: 'Full Name',
    field: 'fullName',
    sorter: 'string',
  },
  {
    title: 'Department',
    field: 'department',
    sorter: 'string',
  },
  {
    title: 'Job Title',
    field: 'jobTitle',
  },
  {
    title: 'Email Address',
    field: 'email',
  },
  {
    title: 'Contact Number',
    field: 'contactNumber',
  },
  {
    title: 'Actions',
    formatter: function (cell) {
      return `
        <div class="flex gap-2">
          <button class="btn btn-sm btn-circle hover:bg-primaryColor/80 border-none btn-ghost view-button">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
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
  initialSort: [{ column: 'id', dir: 'asc' }],
}

// Action handlers
const handleView = (employee) => {
  store.setSelectedEmployee(employee)
}

const handleEdit = (employee) => {
  router.push({
    name: 'EditEmployee',
    params: { id: employee.id },
  })
}

const handleDelete = (employee) => {
  employeeToDelete.value = employee
  deleteConfirmModal.value?.showModal()
}

const confirmDelete = async () => {
  if (employeeToDelete.value) {
    try {
      await store.deleteEmployee(employeeToDelete.value.id)
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
</script>

<template>
  <div class="flex flex-col gap-8 mt-4">
    <BaseTable
      title="Employee List"
      :data="store.employees"
      :columns="columns"
      :options="tableOptions"
    />

    <!-- Delete Confirmation Modal -->
    <dialog ref="deleteConfirmModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-lg text-black">Confirm Delete</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>

        <p class="py-4 text-center text-black">
          Are you sure you want to delete employee
          <span class="font-bold">{{ employeeToDelete?.fullName }}</span
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
