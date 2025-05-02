<script setup>
import { ref, onMounted, computed } from 'vue'
import BaseTable from '@/components/common/BaseTable.vue'
import { useLeavesStore } from '@/stores/HR Management/LeavesStore'
import { storeToRefs } from 'pinia'
import { useToast } from '@/composables/Admin Composables/Human Resource/useToast'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'

const store = useLeavesStore()
const { leaves, loading, error } = storeToRefs(store)
const { showToast, toastMessage, toastType, showToastMessage } = useToast()
const employeeStore = useEmployeeStore()
const { employees } = storeToRefs(employeeStore)
const departments = [
  'HR Department',
  'Finance Department',
  'Sales Department',
  'Supply Chain Department',
  'CRM Department',
]

const columns = [
  {
    title: 'Employee Name',
    field: 'full_name',
    sorter: 'string',
    formatter: (cell) => {
      const record = cell.getRow().getData()
      if (record.employee?.full_name) return record.employee.full_name
      const emp = employees.value.find((e) => e.employee_id === record.employee_id)
      return emp?.full_name || record.employee_id
    },
    width: 200,
  },
  { title: 'Date From', field: 'date_from', sorter: 'date' },
  { title: 'Date To', field: 'date_to', sorter: 'date' },
  { title: 'Type', field: 'type', sorter: 'string' },
  {
    title: 'Paid?',
    field: 'is_paid',
    formatter: (cell) => (cell.getValue() ? 'Yes' : 'No'),
    width: 100,
  },
  {
    title: 'Status',
    field: 'status',
    formatter: (cell) => {
      const status = cell.getValue()
      if (status === 'Approved') {
        return `<span class="badge badge-outline badge-success h-5 text-xs">Approved</span>`
      } else if (status === 'Rejected') {
        return `<span class="badge badge-outline badge-error h-5 text-xs">Rejected</span>`
      } else if (status === 'Pending') {
        return `<span class="badge badge-outline badge-warning h-5 text-xs">Pending</span>`
      }
      return `<span class="badge badge-outline h-5 text-xs">${status}</span>`
    },
    hozAlign: 'center',
  },
  {
    title: 'Actions',
    field: 'actions',
    formatter: (cell) => {
      const record = cell.getRow().getData()
      if (record.status === 'Pending') {
        return `
          <div class="flex gap-2">
            <button class="btn btn-xs btn-circle hover:bg-primaryColor/80 border-none btn-ghost approve-btn" title="Approve">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <button class="btn btn-xs btn-circle hover:bg-red-400 border-none btn-ghost reject-btn" title="Reject">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        `
      }
      return ''
    },
    cellClick: (e, cell) => {
      const record = cell.getRow().getData()
      if (e.target.closest('.approve-btn')) {
        handleApprove(record.id)
      } else if (e.target.closest('.reject-btn')) {
        handleReject(record.id)
      }
    },
    hozAlign: 'center',
    width: 120,
    headerSort: false,
  },
]

const handleApprove = async (id) => {
  try {
    await store.approveLeave(id)
    showToastMessage('Leave approved!', 'success')
  } catch (error) {
    showToastMessage(error.response?.data?.message || error.message, 'error')
  }
}

const handleReject = async (id) => {
  try {
    await store.rejectLeave(id)
    showToastMessage('Leave rejected!', 'success')
  } catch (error) {
    showToastMessage(error.response?.data?.message || error.message, 'error')
  }
}

const createModal = ref(null)
const leaveForm = ref({
  department: '',
  employee_id: '',
  date_from: '',
  date_to: '',
  type: '',
  is_paid: true,
  remarks: '',
})

const filteredEmployees = computed(() => {
  if (!leaveForm.value.department) return []
  return employees.value.filter(
    (emp) =>
      (leaveForm.value.department === 'ALL_DEPARTMENTS' ||
        emp.department === leaveForm.value.department) &&
      !emp.deleted_at &&
      emp.role_name !== 'Super Admin',
  )
})

const openCreateModal = () => {
  leaveForm.value = {
    department: '',
    employee_id: '',
    date_from: '',
    date_to: '',
    type: '',
    is_paid: true,
    remarks: '',
  }
  createModal.value?.showModal()
}

const closeCreateModal = () => {
  createModal.value?.close()
}

const handleCreateLeave = async () => {
  try {
    await store.createLeave({ ...leaveForm.value })
    showToastMessage('Leave created!', 'success')
    closeCreateModal()
  } catch (error) {
    showToastMessage(error.response?.data?.message || error.message, 'error')
  }
}

onMounted(async () => {
  await employeeStore.loadEmployees()
  store.fetchLeaves()
})
</script>

<template>
  <div class="flex flex-col mt-4">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold text-black">Employee Leave Management</h2>
      <button class="btn-primaryStyle" @click="openCreateModal">Add Leave</button>
    </div>
    <div v-if="loading" class="flex justify-center items-center py-4">
      <span class="loading loading-spinner loading-md"></span>
    </div>
    <BaseTable v-else :columns="columns" :data="leaves" :showExport="false" />

    <!-- Leave Creation Modal -->
    <dialog ref="createModal" class="modal">
      <div class="modal-box bg-white">
        <h3 class="font-bold text-md text-black">Add Leave</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>
        <form @submit.prevent="handleCreateLeave" class="flex flex-col gap-4 mt-2">
          <div class="flex gap-4">
            <div>
              <label class="block text-black text-xs">Department</label>
              <select
                v-model="leaveForm.department"
                class="input-search"
                required
                @change="leaveForm.employee_id = ''"
              >
                <option value="">Select Department</option>
                <option value="ALL_DEPARTMENTS">All Departments</option>
                <option v-for="dept in departments" :key="dept">{{ dept }}</option>
              </select>
            </div>
            <div>
              <label class="block text-black text-xs">Employee</label>
              <select
                v-model="leaveForm.employee_id"
                class="input-search"
                :disabled="!leaveForm.department"
                required
              >
                <option value="">Select Employee</option>
                <option
                  v-for="emp in filteredEmployees"
                  :key="emp.employee_id"
                  :value="emp.employee_id"
                >
                  {{ emp.full_name }}
                </option>
              </select>
            </div>
          </div>
          <div class="flex gap-4">
            <div class="flex flex-col w-full">
              <label class="block text-black text-xs">Date From</label>
              <input v-model="leaveForm.date_from" type="date" class="input-search" required />
            </div>
            <div class="flex flex-col w-full">
              <label class="block text-black text-xs">Date To</label>
              <input v-model="leaveForm.date_to" type="date" class="input-search" required />
            </div>
          </div>
          <div>
            <label class="block text-black text-xs">Type</label>
            <input v-model="leaveForm.type" type="text" class="input-search" required />
          </div>
          <div>
            <label class="block text-black text-xs">Paid?</label>
            <select v-model="leaveForm.is_paid" class="input-search" required>
              <option :value="true">Yes</option>
              <option :value="false">No</option>
            </select>
          </div>
          <div>
            <label class="block text-black text-xs">Remarks</label>
            <textarea v-model="leaveForm.remarks" class="input-search"></textarea>
          </div>
          <div class="modal-action justify-center gap-4 mt-2">
            <button type="submit" class="btn-primaryStyle">Add</button>
            <button type="button" class="btn-secondaryStyle" @click="closeCreateModal">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </dialog>

    <!-- Toast -->
    <div
      v-if="showToast"
      :class="{
        'fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300': true,
        'bg-green-500': toastType === 'success',
        'bg-red-500': toastType === 'error',
        'bg-yellow-500': toastType === 'warning',
        'bg-blue-500': toastType === 'info',
      }"
    >
      <p class="text-white">{{ toastMessage }}</p>
    </div>
  </div>
</template>
