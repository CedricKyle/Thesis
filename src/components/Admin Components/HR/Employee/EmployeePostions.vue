<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import BaseTable from '@/components/common/BaseTable.vue'
import { DEPARTMENTS } from '@/composables/Admin Composables/User & Role/role/permissionsId'
import { usePositionStore } from '@/stores/HR Management/positionStore' // <-- Pinia store for positions
import { useToast } from '@/composables/Admin Composables/Human Resource/useToast'

// Exclude Admin Department
const departments = Object.values(DEPARTMENTS).filter((dept) => dept !== DEPARTMENTS.ADMIN)

const positionStore = usePositionStore()
const showArchived = ref(false)
const restoreModal = ref(null)
const positionToRestore = ref(null)

// Toast
const { showToast, toastMessage, toastType, showToastMessage } = useToast()

const tableData = computed(() =>
  showArchived.value ? positionStore.archivedPositions : positionStore.positions,
)

onMounted(async () => {
  await positionStore.loadPositions()
})

watch(showArchived, async (val) => {
  if (val) {
    await positionStore.loadAllPositions()
  } else {
    await positionStore.loadPositions()
  }
})

// Watch for successful restore
watch(
  () => positionStore.archivedPositions,
  (newVal, oldVal) => {
    if (oldVal && newVal && oldVal.length > newVal.length) {
      showToastMessage('Position restored successfully!', 'success')
    }
  },
)

// Watch for successful create/update/delete
watch(
  () => positionStore.positions,
  (newVal, oldVal) => {
    if (!oldVal) return
    if (newVal.length > oldVal.length) {
      showToastMessage('New position created successfully!', 'success')
    } else if (newVal.length < oldVal.length) {
      showToastMessage('Position deleted successfully!', 'success')
    } else if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
      showToastMessage('Position updated successfully!', 'success')
    }
  },
)

// Table columns
const columns = computed(() => [
  { title: 'Position Title', field: 'position_title', sorter: 'string' },
  { title: 'Department', field: 'department', sorter: 'string' },
  { title: 'Branch', field: 'branch', sorter: 'string' },
  {
    title: 'Rate per Hour',
    field: 'rate_per_hour',
    sorter: 'number',
    hozAlign: 'right',
    formatter: (cell) =>
      `₱ ${cell.getValue().toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  },
  {
    title: 'Actions',
    field: 'actions',
    formatter: (cell) => {
      const row = cell.getRow().getData()
      // If archived, only show restore
      if (showArchived.value && row.deleted_at) {
        return `
          <div class="flex gap-2">
            <button class="btn btn-sm btn-circle hover:bg-green-500 border-none btn-ghost restore-button" title="Restore">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 14l-4-4 4-4"/>
                <path d="M5 10h11a4 4 0 1 1 0 8h-1"/>
              </svg>
            </button>
          </div>
        `
      }
      // If not archived, show edit/delete
      if (!row.deleted_at) {
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
      }
      return ''
    },
    headerSort: false,
    hozAlign: 'center',
    width: 120,
    cellClick: (e, cell) => {
      const row = cell.getRow().getData()
      if (showArchived.value && row.deleted_at && e.target.closest('.restore-button')) {
        openRestoreModal(row)
      } else if (!showArchived.value) {
        if (e.target.closest('.edit-button')) {
          openEditModal(row)
        } else if (e.target.closest('.delete-button')) {
          openDeleteModal(row)
        }
      }
    },
  },
])

// Modal logic
const createModal = ref(null)
const editModal = ref(null)
const deleteModal = ref(null)
const confirmModal = ref(null)

const newPosition = ref({
  position_title: '',
  department: '',
  branch: 'Main Office',
  rate_per_hour: '',
})

const editPosition = ref({
  id: null,
  position_title: '',
  department: '',
  branch: 'Main Office',
  rate_per_hour: '',
})

const positionToDelete = ref(null)
const confirmActionType = ref('') // 'create', 'edit', 'delete'

// --- CREATE ---
const openCreateModal = () => {
  newPosition.value = {
    position_title: '',
    department: '',
    branch: 'Main Office',
    rate_per_hour: '',
  }
  createModal.value?.showModal()
}
const closeCreateModal = () => createModal.value?.close()
const confirmCreate = () => {
  confirmActionType.value = 'create'
  confirmModal.value?.showModal()
}
const doCreate = async () => {
  await positionStore.createPosition({ ...newPosition.value })
  closeCreateModal()
  confirmModal.value?.close()
}

// --- EDIT ---
const openEditModal = (row) => {
  editPosition.value = { ...row }
  editModal.value?.showModal()
}
const closeEditModal = () => editModal.value?.close()
const confirmEdit = () => {
  confirmActionType.value = 'edit'
  confirmModal.value?.showModal()
}
const doEdit = async () => {
  await positionStore.updatePosition(editPosition.value.id, { ...editPosition.value })
  closeEditModal()
  confirmModal.value?.close()
}

// --- DELETE ---
const openDeleteModal = (row) => {
  positionToDelete.value = row
  deleteModal.value?.showModal()
}
const closeDeleteModal = () => deleteModal.value?.close()
const doDelete = async () => {
  await positionStore.deletePosition(positionToDelete.value.id)
  closeDeleteModal()
}

// --- RESTORE ---
const openRestoreModal = (row) => {
  positionToRestore.value = row
  restoreModal.value?.showModal()
}
const closeRestoreModal = () => restoreModal.value?.close()
const doRestore = async () => {
  await positionStore.restorePosition(positionToRestore.value.id)
  closeRestoreModal()
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
      <button class="btn-primaryStyle" @click="openCreateModal" v-if="!showArchived">
        Add Position
      </button>
    </div>

    <!-- Table -->
    <BaseTable :columns="columns" :data="tableData" :showExport="false" />
    <div class="flex justify-end gap-2 mt-4">
      <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" v-model="showArchived" />
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
            <input v-model="newPosition.position_title" type="text" class="input-search" required />
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
                v-model="newPosition.rate_per_hour"
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
            <input
              v-model="editPosition.position_title"
              type="text"
              class="input-search"
              required
            />
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
                v-model="editPosition.rate_per_hour"
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
          <span class="font-bold">{{ positionToDelete?.position_title }}</span
          >?
        </p>
        <div class="modal-action justify-center gap-4">
          <button class="btn-errorStyle" @click="doDelete">Delete</button>
          <button class="btn-secondaryStyle" @click="closeDeleteModal">Cancel</button>
        </div>
      </div>
    </dialog>

    <!-- Restore Position Modal (only one confirmation) -->
    <dialog ref="restoreModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-md text-black">Confirm Restore</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>
        <p class="py-4 text-center text-black text-sm">
          Are you sure you want to restore position
          <span class="font-bold">{{ positionToRestore?.position_title }}</span
          >?
        </p>
        <div class="modal-action justify-center gap-4">
          <button class="btn-primaryStyle" @click="doRestore">Restore</button>
          <button class="btn-secondaryStyle" @click="closeRestoreModal">Cancel</button>
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

    <!-- Add this Toast component at the end of your template -->
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
