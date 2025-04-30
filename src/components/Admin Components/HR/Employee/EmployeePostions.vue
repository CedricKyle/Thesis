<script setup>
import { ref } from 'vue'
import BaseTable from '@/components/common/BaseTable.vue'
import { DEPARTMENTS } from '@/composables/Admin Composables/User & Role/role/permissionsId'

// Exclude Admin Department
const departments = Object.values(DEPARTMENTS).filter((dept) => dept !== DEPARTMENTS.ADMIN)

// Table columns
const columns = [
  { title: 'Position Title', field: 'positionTitle', sorter: 'string' },
  { title: 'Department', field: 'department', sorter: 'string' },
  { title: 'Branch', field: 'branch', sorter: 'string' },
  {
    title: 'Rate per Hour',
    field: 'ratePerHour',
    sorter: 'number',
    hozAlign: 'right',
    formatter: (cell) =>
      `₱ ${cell.getValue().toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  },
  {
    title: 'Actions',
    field: 'actions',
    formatter: (cell) => {
      return `
        <div class="flex gap-2">
          <button class="btn btn-sm btn-circle hover:bg-primaryColor/80 border-none btn-ghost edit-button" title="Edit">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button class="btn btn-sm btn-circle hover:bg-red-400 border-none btn-ghost delete-button" title="Delete">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      `
    },
    headerSort: false,
    hozAlign: 'center',
    width: 120,
    cellClick: (e, cell) => {
      const row = cell.getRow().getData()
      if (e.target.closest('.edit-button')) {
        openEditModal(row)
      } else if (e.target.closest('.delete-button')) {
        openDeleteModal(row)
      }
    },
  },
]

// Example data
const positions = ref([
  {
    positionTitle: 'Software Engineer',
    department: 'IT Department',
    branch: 'Main Office',
    ratePerHour: 40.0,
  },
  {
    positionTitle: 'HR Manager',
    department: 'HR Department',
    branch: 'Main Office',
    ratePerHour: 35.0,
  },
  {
    positionTitle: 'Accountant',
    department: 'Finance Department',
    branch: 'Main Office',
    ratePerHour: 30.0,
  },
])

// Modal logic
const createModal = ref(null)
const editModal = ref(null)
const deleteModal = ref(null)
const confirmModal = ref(null)

const newPosition = ref({
  positionTitle: '',
  department: '',
  branch: 'Main Office',
  ratePerHour: '',
})

const editPosition = ref({
  positionTitle: '',
  department: '',
  branch: 'Main Office',
  ratePerHour: '',
  index: null,
})

const positionToDelete = ref(null)
const confirmActionType = ref('') // 'create', 'edit', 'delete'

// --- CREATE ---
const openCreateModal = () => {
  newPosition.value = { positionTitle: '', department: '', branch: 'Main Office', ratePerHour: '' }
  createModal.value?.showModal()
}
const closeCreateModal = () => createModal.value?.close()
const confirmCreate = () => {
  confirmActionType.value = 'create'
  confirmModal.value?.showModal()
}
const doCreate = () => {
  positions.value.push({ ...newPosition.value })
  closeCreateModal()
  confirmModal.value?.close()
}

// --- EDIT ---
const openEditModal = (row) => {
  editPosition.value = { ...row, index: positions.value.findIndex((p) => p === row) }
  editModal.value?.showModal()
}
const closeEditModal = () => editModal.value?.close()
const confirmEdit = () => {
  confirmActionType.value = 'edit'
  confirmModal.value?.showModal()
}
const doEdit = () => {
  if (editPosition.value.index !== null) {
    positions.value[editPosition.value.index] = {
      positionTitle: editPosition.value.positionTitle,
      department: editPosition.value.department,
      branch: editPosition.value.branch,
      ratePerHour: editPosition.value.ratePerHour,
    }
  }
  closeEditModal()
  confirmModal.value?.close()
}

// --- DELETE ---
const openDeleteModal = (row) => {
  positionToDelete.value = row
  deleteModal.value?.showModal()
}
const closeDeleteModal = () => deleteModal.value?.close()
const doDelete = () => {
  positions.value = positions.value.filter((p) => p !== positionToDelete.value)
  closeDeleteModal()
}

const closeConfirmModal = () => confirmModal.value?.close()
const confirmAction = () => {
  if (confirmActionType.value === 'create') doCreate()
  else if (confirmActionType.value === 'edit') doEdit()
}
</script>

<template>
  <div class="flex flex-col mt-4">
    <!-- Header and Create Button -->
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold text-black">Employee Positions</h2>
      <button class="btn-primaryStyle" @click="openCreateModal">Add Position</button>
    </div>

    <!-- Table -->
    <BaseTable :columns="columns" :data="positions" :showExport="false" />
    <div class="flex justify-end gap-2 mt-4">
      <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
      <span class="text-sm cursor-pointer hover:text-gray-500 text-black"
        >Show Archived Positions</span
      >
    </div>

    <!-- Create Position Modal -->
    <dialog ref="createModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-md text-black">Create Position</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>
        <form @submit.prevent="confirmCreate" class="flex flex-col gap-4 mt-2">
          <div>
            <label class="block text-sm text-black mb-1">Position Title</label>
            <input v-model="newPosition.positionTitle" type="text" class="input-search" required />
          </div>
          <div>
            <label class="block text-sm text-black mb-1">Department</label>
            <select v-model="newPosition.department" class="input-search" required>
              <option disabled value="">Select Department</option>
              <option v-for="dept in departments" :key="dept" :value="dept">{{ dept }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-black mb-1">Branch (for future use)</label>
            <input v-model="newPosition.branch" type="text" class="input-search" disabled />
          </div>
          <div>
            <label class="block text-sm text-black mb-1">Rate per Hour</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >₱</span
              >
              <input
                v-model="newPosition.ratePerHour"
                type="number"
                min="0"
                step="0.01"
                class="input-search pl-7"
                placeholder="0.00"
                required
              />
            </div>
          </div>
          <div class="modal-action justify-center gap-4 mt-2">
            <button type="submit" class="btn-primaryStyle">Create</button>
            <button type="button" class="btn-secondaryStyle" @click="closeCreateModal">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </dialog>

    <!-- Edit Position Modal -->
    <dialog ref="editModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-md text-black">Edit Position</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>
        <form @submit.prevent="confirmEdit" class="flex flex-col gap-4 mt-2">
          <div>
            <label class="block text-sm text-black mb-1">Position Title</label>
            <input v-model="editPosition.positionTitle" type="text" class="input-search" required />
          </div>
          <div>
            <label class="block text-sm text-black mb-1">Department</label>
            <select v-model="editPosition.department" class="input-search" required>
              <option disabled value="">Select Department</option>
              <option v-for="dept in departments" :key="dept" :value="dept">{{ dept }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-black mb-1">Branch (for future use)</label>
            <input v-model="editPosition.branch" type="text" class="input-search" disabled />
          </div>
          <div>
            <label class="block text-sm text-black mb-1">Rate per Hour</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >₱</span
              >
              <input
                v-model="editPosition.ratePerHour"
                type="number"
                min="0"
                step="0.01"
                class="input-search pl-7"
                placeholder="0.00"
                required
              />
            </div>
          </div>
          <div class="modal-action justify-center gap-4 mt-2">
            <button type="submit" class="btn-primaryStyle">Save</button>
            <button type="button" class="btn-secondaryStyle" @click="closeEditModal">Cancel</button>
          </div>
        </form>
      </div>
    </dialog>

    <!-- Delete Position Modal (only one confirmation) -->
    <dialog ref="deleteModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-md text-black">Confirm Delete</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>
        <p class="py-4 text-center text-black text-sm">
          Are you sure you want to delete position
          <span class="font-bold">{{ positionToDelete?.positionTitle }}</span
          >?
        </p>
        <div class="modal-action justify-center gap-4">
          <button class="btn-errorStyle" @click="doDelete">Delete</button>
          <button class="btn-secondaryStyle" @click="closeDeleteModal">Cancel</button>
        </div>
      </div>
    </dialog>

    <!-- Confirmation Modal (for all actions) -->
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
                  : 'delete'
            }}
          </span>
          this position?
        </p>
        <div class="modal-action justify-center gap-4">
          <button class="btn-primaryStyle" @click="confirmAction">Yes</button>
          <button class="btn-secondaryStyle" @click="closeConfirmModal">Cancel</button>
        </div>
      </div>
    </dialog>
  </div>
</template>

<style scoped>
.relative {
  position: relative;
  display: inline-block;
  width: 100%;
}
</style>
