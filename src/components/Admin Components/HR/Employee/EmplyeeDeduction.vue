<script setup>
import { ref, onMounted, watch } from 'vue'
import BaseTable from '@/components/common/BaseTable.vue'
import { useMandatoryDeductionStore } from '@/stores/HR Management/mandatoryDeductionStore'
import { storeToRefs } from 'pinia'
import axios from 'axios'
import { useToast } from '@/composables/Admin Composables/Human Resource/useToast'

const store = useMandatoryDeductionStore()
const { deductions, loading } = storeToRefs(store)
const { showToast, toastMessage, toastType, showToastMessage } = useToast()

// Table columns
const columns = [
  { title: 'Description', field: 'description', sorter: 'string' },
  {
    title: 'Type',
    field: 'deduction_type',
    sorter: 'string',
  },
  {
    title: 'Salary Range',
    field: 'salary_range',
    formatter: (cell) => {
      const from = Number(cell.getData().salary_range_from).toLocaleString('en-PH')
      const to = Number(cell.getData().salary_range_to).toLocaleString('en-PH')
      return `₱${from} - ₱${to}`
    },
  },
  {
    title: 'Total Rate',
    field: 'percentage_rate',
    formatter: (cell) => `${cell.getValue()}%`,
  },
  {
    title: 'Employee Share',
    field: 'employee_share',
    formatter: (cell) => `${cell.getValue()}%`,
  },
  {
    title: 'Employer Share',
    field: 'employer_share',
    formatter: (cell) => `${cell.getValue()}%`,
  },
  {
    title: 'Status',
    field: 'status',
    formatter: (cell) => {
      const status = cell.getValue()
      let badgeClass = 'badge-success badge-outline'
      if (status === 'Archived') {
        badgeClass = 'badge-error badge-outline'
      } else if (status === 'Inactive') {
        badgeClass = 'badge-warning badge-outline'
      }
      return `<span class="badge ${badgeClass}">${status}</span>`
    },
    hozAlign: 'center',
  },
  {
    title: 'Actions',
    field: 'actions',
    formatter: (cell) => {
      const record = cell.getRow().getData()
      const isArchived = record.status === 'Archived'

      if (isArchived) {
        return `
          <div class="flex gap-2">
            <button class="btn btn-sm btn-circle hover:bg-primaryColor/80 border-none btn-ghost view-button" title="View">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
            <button class="btn btn-sm btn-circle hover:bg-green-500 border-none btn-ghost restore-button" title="Restore">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M3 12a9 9 0 0 1 9-9 9 9 0 0 1 6.36 2.64l2.14-2.14M21 12a9 9 0 0 1-9 9 9 9 0 0 1-6.36-2.64l-2.14 2.14"/>
              </svg>
            </button>
          </div>
        `
      }

      return `
        <div class="flex gap-2">
          <button class="btn btn-sm btn-circle hover:bg-primaryColor/80 border-none btn-ghost view-button" title="View">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
          <button class="btn btn-sm btn-circle hover:bg-primaryColor/80 border-none btn-ghost edit-button" title="Edit">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button class="btn btn-sm btn-circle hover:bg-red-400 border-none btn-ghost" title="Delete">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      `
    },
    headerSort: false,
    hozAlign: 'center',
    width: 150,
    cellClick: (e, cell) => {
      const record = cell.getRow().getData()
      if (e.target.closest('.view-button')) {
        openViewModal(record)
      } else if (e.target.closest('.edit-button')) {
        openEditModal(record)
      } else if (e.target.closest('.restore-button')) {
        handleRestore(record.id)
      } else if (e.target.closest('[title="Delete"]')) {
        handleDelete(record.id)
      }
    },
  },
]

// Modal logic
const createModal = ref(null)
const viewModal = ref(null)
const editModal = ref(null)
const showArchived = ref(false)

const newDeduction = ref({
  description: '',
  deduction_type: 'SSS',
  salary_range_from: '',
  salary_range_to: '',
  percentage_rate: '',
  employer_share: '',
  employee_share: '',
  minimum_contribution: '',
  maximum_contribution: '',
  effective_date: new Date().toISOString().split('T')[0],
})

const selectedDeduction = ref(null)

const deductionTypes = [
  { value: 'SSS', label: 'SSS' },
  { value: 'PHILHEALTH', label: 'PhilHealth' },
  { value: 'PAGIBIG', label: 'Pag-IBIG' },
]

const openCreateModal = () => {
  newDeduction.value = {
    description: '',
    deduction_type: 'SSS',
    salary_range_from: '',
    salary_range_to: '',
    percentage_rate: '',
    employer_share: '',
    employee_share: '',
    minimum_contribution: '',
    maximum_contribution: '',
    effective_date: new Date().toISOString().split('T')[0],
  }
  createModal.value?.showModal()
}

const closeCreateModal = () => {
  createModal.value?.close()
}

const validateForm = (deduction) => {
  const errors = []

  if (!deduction.description) errors.push('Description is required')
  if (!deduction.deduction_type) errors.push('Deduction type is required')
  if (!deduction.salary_range_from) errors.push('Salary range from is required')
  if (!deduction.salary_range_to) errors.push('Salary range to is required')
  if (!deduction.percentage_rate) errors.push('Total rate is required')
  if (!deduction.employer_share) errors.push('Employer share is required')
  if (!deduction.employee_share) errors.push('Employee share is required')

  // Validate percentage totals
  const totalShare = parseFloat(deduction.employer_share) + parseFloat(deduction.employee_share)
  if (totalShare !== parseFloat(deduction.percentage_rate)) {
    errors.push('Employer share + Employee share must equal Total rate')
  }

  // Validate salary range
  if (parseFloat(deduction.salary_range_from) >= parseFloat(deduction.salary_range_to)) {
    errors.push('Salary range from must be less than Salary range to')
  }

  return errors
}

const confirmModal = ref(null)
const confirmActionType = ref('') // 'create', 'edit', 'delete', 'restore'
const closeConfirmModal = () => confirmModal.value?.close()

const addDeduction = async () => {
  try {
    const errors = validateForm(newDeduction.value)
    if (errors.length > 0) {
      showToastMessage(errors.join('\n'), 'error')
      return
    }
    confirmActionType.value = 'create'
    confirmModal.value?.showModal()
  } catch (error) {
    showToastMessage(error.response?.data?.message || error.message, 'error')
  }
}

const confirmAction = async () => {
  try {
    switch (confirmActionType.value) {
      case 'create':
        await store.createDeduction(newDeduction.value)
        closeCreateModal()
        break
      case 'edit':
        console.log('Sending to store for update:', selectedDeduction.value)
        console.log('Full data being sent:', JSON.stringify(selectedDeduction.value, null, 2))
        await store.updateDeduction(selectedDeduction.value.id, selectedDeduction.value)
        closeEditModal()
        break
      case 'delete':
        await store.deleteDeduction(selectedDeduction.value.id)
        break
      case 'restore':
        await store.restoreDeduction(selectedDeduction.value.id)
        break
    }
    closeConfirmModal()
    showToastMessage(
      `Deduction ${
        confirmActionType.value === 'create'
          ? 'created'
          : confirmActionType.value === 'edit'
            ? 'updated'
            : confirmActionType.value === 'delete'
              ? 'deleted'
              : 'restored'
      } successfully!`,
      'success',
    )
  } catch (error) {
    console.error('Error in confirmAction:', error)
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      errors: error.response?.data?.errors,
      validationErrors: error.response?.data?.errors || [],
    })
    showToastMessage(
      error.response?.data?.errors?.[0] || error.response?.data?.message || error.message,
      'error',
    )
  }
}

const openEditModal = (deduction) => {
  console.log('Original deduction data:', deduction)

  // Format the date to YYYY-MM-DD for the input field
  const formattedDeduction = {
    ...deduction,
    // Just get the date part
    effective_date: deduction.effective_date.split('T')[0],
    salary_range_from: String(deduction.salary_range_from),
    salary_range_to: String(deduction.salary_range_to),
    percentage_rate: String(deduction.percentage_rate),
    employer_share: String(deduction.employer_share),
    employee_share: String(deduction.employee_share),
    minimum_contribution: deduction.minimum_contribution
      ? String(deduction.minimum_contribution)
      : '',
    maximum_contribution: deduction.maximum_contribution
      ? String(deduction.maximum_contribution)
      : '',
  }

  console.log('Formatted deduction data:', formattedDeduction)
  selectedDeduction.value = formattedDeduction
  editModal.value?.showModal()
}

const closeEditModal = () => {
  editModal.value?.close()
  selectedDeduction.value = null
}

const updateDeduction = async () => {
  try {
    const errors = validateForm(selectedDeduction.value)
    if (errors.length > 0) {
      showToastMessage(errors.join('\n'), 'error')
      return
    }

    // Format the data before sending
    const formattedData = {
      ...selectedDeduction.value,
      salary_range_from: parseFloat(selectedDeduction.value.salary_range_from),
      salary_range_to: parseFloat(selectedDeduction.value.salary_range_to),
      percentage_rate: parseFloat(selectedDeduction.value.percentage_rate),
      employer_share: parseFloat(selectedDeduction.value.employer_share),
      employee_share: parseFloat(selectedDeduction.value.employee_share),
      minimum_contribution: selectedDeduction.value.minimum_contribution
        ? parseFloat(selectedDeduction.value.minimum_contribution)
        : null,
      maximum_contribution: selectedDeduction.value.maximum_contribution
        ? parseFloat(selectedDeduction.value.maximum_contribution)
        : null,
      // Keep the date as is - it's already in YYYY-MM-DD format from the input
      effective_date: selectedDeduction.value.effective_date,
    }

    console.log('After formatting - formattedData:', formattedData)
    selectedDeduction.value = formattedData
    confirmActionType.value = 'edit'
    confirmModal.value?.showModal()
  } catch (error) {
    console.error('Error in updateDeduction:', error)
    showToastMessage(error.response?.data?.message || error.message, 'error')
  }
}

const handleDelete = async (id) => {
  try {
    selectedDeduction.value = deductions.value.find((d) => d.id === id)
    confirmActionType.value = 'delete'
    confirmModal.value?.showModal()
  } catch (error) {
    showToastMessage(error.response?.data?.message || error.message, 'error')
  }
}

const openViewModal = (deduction) => {
  selectedDeduction.value = deduction
  viewModal.value?.showModal()
}

const closeViewModal = () => {
  viewModal.value?.close()
  selectedDeduction.value = null
}

// Calculator functionality
const testSalary = ref('')
const calculationResults = ref(null)

const calculateDeductions = async () => {
  if (!testSalary.value) return
  try {
    const response = await axios.get(
      `/api/employee-deductions/calculate?salary=${testSalary.value}`,
    )
    calculationResults.value = response.data
  } catch (error) {
    console.error('Error calculating deductions:', error)
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    })
    showToastMessage(
      error.response?.data?.message || 'Error calculating deductions. Please try again.',
      'error',
    )
  }
}

// Watch for archived toggle
watch(showArchived, async (newValue) => {
  console.log('Show archived changed to:', newValue)
  await store.fetchDeductions({ show_inactive: newValue })
})

const handleRestore = async (id) => {
  try {
    selectedDeduction.value = deductions.value.find((d) => d.id === id)
    confirmActionType.value = 'restore'
    confirmModal.value?.showModal()
  } catch (error) {
    showToastMessage(error.response?.data?.message || error.message, 'error')
  }
}

// Add watchers for actions
watch(
  () => deductions.value,
  (newVal, oldVal) => {
    if (!oldVal) return
    if (newVal.length > oldVal.length) {
      showToastMessage('New deduction created successfully!', 'success')
    } else if (newVal.length < oldVal.length) {
      showToastMessage('Deduction deleted successfully!', 'success')
    } else if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
      showToastMessage('Deduction updated successfully!', 'success')
    }
  },
)

// Add watcher for restore
watch(
  () => showArchived.value,
  (newVal, oldVal) => {
    if (oldVal && !newVal) {
      showToastMessage('Deduction restored successfully!', 'success')
    }
  },
)

onMounted(async () => {
  console.log('Component mounted, fetching initial deductions')
  await store.fetchDeductions()
})
</script>

<template>
  <div class="flex flex-col mt-4">
    <!-- Header and Create Button -->
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold text-black">Employee Mandatory Deduction</h2>
      <button class="btn-primaryStyle" @click="openCreateModal">Add Deduction</button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center py-4">
      <span class="loading loading-spinner loading-md"></span>
    </div>

    <!-- Table -->
    <BaseTable v-else :columns="columns" :data="deductions" :showExport="false" />

    <!-- Archive toggle -->
    <div class="flex justify-end gap-2 mt-4">
      <input
        type="checkbox"
        v-model="showArchived"
        class="checkbox checkbox-xs checkbox-neutral"
        id="showArchived"
      />
      <label for="showArchived" class="text-sm cursor-pointer hover:text-gray-500 text-black">
        Show Archived Deductions
      </label>
    </div>

    <!-- Create Modal -->
    <dialog ref="createModal" class="modal">
      <div class="modal-box bg-white">
        <h3 class="font-bold text-md text-black">Add Mandatory Deduction</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>
        <form @submit.prevent="addDeduction" class="flex flex-col gap-4 mt-2">
          <div>
            <label class="block text-black text-xs">Description</label>
            <input v-model="newDeduction.description" type="text" class="input-search" required />
          </div>

          <div>
            <label class="block text-black text-xs">Deduction Type</label>
            <select v-model="newDeduction.deduction_type" class="input-search" required>
              <option v-for="type in deductionTypes" :key="type.value" :value="type.value">
                {{ type.label }}
              </option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-black text-xs">Salary Range From</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 transform -translate-y-1/2">₱</span>
                <input
                  v-model="newDeduction.salary_range_from"
                  type="number"
                  min="0"
                  class="input-search pl-7"
                  required
                />
              </div>
            </div>
            <div>
              <label class="block text-black text-xs">Salary Range To</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 transform -translate-y-1/2">₱</span>
                <input
                  v-model="newDeduction.salary_range_to"
                  type="number"
                  min="0"
                  class="input-search pl-7"
                  required
                />
              </div>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-black text-xs">Total Rate (%)</label>
              <input
                v-model="newDeduction.percentage_rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                class="input-search"
                required
              />
            </div>
            <div>
              <label class="block text-black text-xs">Employee Share (%)</label>
              <input
                v-model="newDeduction.employee_share"
                type="number"
                min="0"
                max="100"
                step="0.01"
                class="input-search"
                required
              />
            </div>
            <div>
              <label class="block text-black text-xs">Employer Share (%)</label>
              <input
                v-model="newDeduction.employer_share"
                type="number"
                min="0"
                max="100"
                step="0.01"
                class="input-search"
                required
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-black text-xs">Minimum Contribution</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 transform -translate-y-1/2">₱</span>
                <input
                  v-model="newDeduction.minimum_contribution"
                  type="number"
                  min="0"
                  step="0.01"
                  class="input-search pl-7"
                />
              </div>
            </div>
            <div>
              <label class="block text-black text-xs">Maximum Contribution</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 transform -translate-y-1/2">₱</span>
                <input
                  v-model="newDeduction.maximum_contribution"
                  type="number"
                  min="0"
                  step="0.01"
                  class="input-search pl-7"
                />
              </div>
            </div>
          </div>

          <div>
            <label class="block text-black text-xs">Effective Date</label>
            <input
              v-model="newDeduction.effective_date"
              type="date"
              class="input-search"
              required
            />
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

    <!-- View Modal -->
    <dialog ref="viewModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-md text-black">Deduction Details</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>
        <div v-if="selectedDeduction" class="flex flex-col gap-2 mt-2 text-black">
          <div class="grid gap-2">
            <div class="flex justify-between">
              <span class="text-sm text-gray-500">Description:</span>
              <span class="text-sm">{{ selectedDeduction.description }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-500">Type:</span>
              <span class="text-sm">{{ selectedDeduction.deduction_type }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-500">Salary Range:</span>
              <span class="text-sm">
                ₱{{ Number(selectedDeduction.salary_range_from).toLocaleString('en-PH') }} - ₱{{
                  Number(selectedDeduction.salary_range_to).toLocaleString('en-PH')
                }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-500">Total Rate:</span>
              <span class="text-sm">{{ selectedDeduction.percentage_rate }}%</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-500">Employee Share:</span>
              <span class="text-sm">{{ selectedDeduction.employee_share }}%</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-500">Employer Share:</span>
              <span class="text-sm">{{ selectedDeduction.employer_share }}%</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-500">Status:</span>
              <span class="text-sm">{{ selectedDeduction.status }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-500">Active Period:</span>
              <span class="text-sm">{{ selectedDeduction.active_period }}</span>
            </div>
          </div>
        </div>
        <div class="modal-action justify-end gap-4 mt-5">
          <button type="button" class="btn-secondaryStyle" @click="closeViewModal">Close</button>
        </div>
      </div>
    </dialog>

    <!-- Edit Modal -->
    <dialog ref="editModal" class="modal">
      <div class="modal-box bg-white">
        <h3 class="font-bold text-md text-black">Edit Mandatory Deduction</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>
        <form
          v-if="selectedDeduction"
          @submit.prevent="updateDeduction"
          class="flex flex-col gap-4 mt-2"
        >
          <div>
            <label class="block text-black text-xs">Description</label>
            <input
              v-model="selectedDeduction.description"
              type="text"
              class="input-search"
              required
            />
          </div>

          <div>
            <label class="block text-black text-xs">Deduction Type</label>
            <select v-model="selectedDeduction.deduction_type" class="input-search" required>
              <option v-for="type in deductionTypes" :key="type.value" :value="type.value">
                {{ type.label }}
              </option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-black text-xs">Salary Range From</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 transform -translate-y-1/2">₱</span>
                <input
                  v-model="selectedDeduction.salary_range_from"
                  type="number"
                  min="0"
                  class="input-search pl-7"
                  required
                />
              </div>
            </div>
            <div>
              <label class="block text-black text-xs">Salary Range To</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 transform -translate-y-1/2">₱</span>
                <input
                  v-model="selectedDeduction.salary_range_to"
                  type="number"
                  min="0"
                  class="input-search pl-7"
                  required
                />
              </div>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-black text-xs">Total Rate (%)</label>
              <input
                v-model="selectedDeduction.percentage_rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                class="input-search"
                required
              />
            </div>
            <div>
              <label class="block text-black text-xs">Employee Share (%)</label>
              <input
                v-model="selectedDeduction.employee_share"
                type="number"
                min="0"
                max="100"
                step="0.01"
                class="input-search"
                required
              />
            </div>
            <div>
              <label class="block text-black text-xs">Employer Share (%)</label>
              <input
                v-model="selectedDeduction.employer_share"
                type="number"
                min="0"
                max="100"
                step="0.01"
                class="input-search"
                required
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-black text-xs">Minimum Contribution</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 transform -translate-y-1/2">₱</span>
                <input
                  v-model="selectedDeduction.minimum_contribution"
                  type="number"
                  min="0"
                  step="0.01"
                  class="input-search pl-7"
                />
              </div>
            </div>
            <div>
              <label class="block text-black text-xs">Maximum Contribution</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 transform -translate-y-1/2">₱</span>
                <input
                  v-model="selectedDeduction.maximum_contribution"
                  type="number"
                  min="0"
                  step="0.01"
                  class="input-search pl-7"
                />
              </div>
            </div>
          </div>

          <div>
            <label class="block text-black text-xs">Effective Date</label>
            <input
              v-model="selectedDeduction.effective_date"
              type="date"
              class="input-search"
              required
            />
          </div>

          <div class="modal-action justify-center gap-4 mt-2">
            <button type="submit" class="btn-primaryStyle">Save Changes</button>
            <button type="button" class="btn-secondaryStyle" @click="closeEditModal">Cancel</button>
          </div>
        </form>
      </div>
    </dialog>

    <!-- Calculator Section -->
    <div class="mt-4 p-4 border rounded-lg text-black">
      <h3 class="font-semibold mb-2">Deduction Calculator</h3>
      <div class="flex gap-4 items-end">
        <div>
          <label class="block text-sm mb-1">Enter Monthly Salary</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 transform -translate-y-1/2">₱</span>
            <input
              v-model="testSalary"
              type="number"
              class="input-search pl-7 input-sm"
              placeholder="Enter salary"
            />
          </div>
        </div>
        <button @click="calculateDeductions" class="btn-primaryStyle">Calculate</button>
      </div>

      <!-- Calculation Results -->
      <div v-if="calculationResults" class="mt-4">
        <div class="grid gap-2">
          <div class="font-semibold">Calculation Results:</div>
          <div>
            Basic Salary: ₱{{ Number(calculationResults.basic_salary).toLocaleString('en-PH') }}
          </div>

          <div class="grid gap-1">
            <div class="font-medium">Deduction Breakdown:</div>
            <div
              v-for="deduction in calculationResults.deductions"
              :key="deduction.description"
              class="pl-4"
            >
              <div class="flex justify-between">
                <span>{{ deduction.description }} ({{ deduction.type }}):</span>
                <span>₱{{ Number(deduction.total_contribution).toLocaleString('en-PH') }}</span>
              </div>
              <div class="text-sm text-gray-500 pl-4">
                <div>
                  Employee Share: ₱{{ Number(deduction.employee_share).toLocaleString('en-PH') }}
                </div>
                <div>
                  Employer Share: ₱{{ Number(deduction.employer_share).toLocaleString('en-PH') }}
                </div>
              </div>
            </div>
          </div>

          <div class="font-semibold mt-2">
            Total Employee Deductions: ₱{{
              Number(calculationResults.total_employee_deductions).toLocaleString('en-PH')
            }}
          </div>
          <div class="font-semibold text-green-600">
            Net Salary: ₱{{ Number(calculationResults.net_salary).toLocaleString('en-PH') }}
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <dialog ref="confirmModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-md text-black">Confirm Action</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>
        <p class="py-4 text-center text-black text-sm">
          Are you sure you want to
          <span class="font-bold">
            {{
              confirmActionType === 'create'
                ? 'create'
                : confirmActionType === 'edit'
                  ? 'save changes to'
                  : confirmActionType === 'delete'
                    ? 'delete'
                    : 'restore'
            }}
          </span>
          this deduction?
        </p>
        <div class="modal-action justify-center gap-4">
          <button
            class="btn-primaryStyle"
            :class="{ 'btn-errorStyle': confirmActionType === 'delete' }"
            @click="confirmAction"
          >
            Yes
          </button>
          <button class="btn-secondaryStyle" @click="closeConfirmModal">Cancel</button>
        </div>
      </div>
    </dialog>

    <!-- Toast Component -->
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

<style scoped>
.relative {
  position: relative;
  display: inline-block;
  width: 100%;
}
</style>
