<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import BaseTable from '@/components/common/BaseTable.vue'
import { useSupplierStore } from '@/stores/SCM Stores/suppplierStore' // make sure the filename is correct!
import Toast from '@/components/Admin Components/HR/Toast.vue'

const supplierStore = useSupplierStore()

const showArchived = ref(false)
const showAddForm = ref(false)
const newSupplier = ref({
  full_name: '',
  contact_number: '',
  supply_type: '',
})

const showViewModal = ref(false)
const showEditModal = ref(false)
const showArchiveModal = ref(false)
const showRestoreModal = ref(false)
const selectedSupplier = ref(null)
const supplierToRestore = ref(null)

const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// Table columns
const columns = [
  { title: 'Full Name', field: 'full_name', headerSort: false },
  { title: 'Contact Number', field: 'contact_number', headerSort: false },
  { title: 'Supply Type/Description', field: 'supply_type', headerSort: false },
  {
    title: 'Actions',
    field: 'actions',
    headerSort: false,
    formatter: (cell) => {
      const row = cell.getRow().getData()
      if (row.deletedAt) {
        return `<button class="btn-primaryStyle btn-xs" data-action="restore">Restore</button>`
      }
      return `
        <button class="btn-secondaryStyle btn-xs mr-1" data-action="view">View</button>
        <button class="btn-primaryStyle btn-xs mr-1" data-action="edit">Edit</button>
        <button class="btn-errorStyle btn-xs" data-action="archive">Archive</button>
      `
    },
    cellClick: function (e, cell) {
      const action = e.target.getAttribute('data-action')
      const rowData = cell.getRow().getData()
      if (action === 'view') viewSupplier(rowData)
      if (action === 'edit') editSupplier(rowData)
      if (action === 'archive') archiveSupplier(rowData)
      if (action === 'restore') {
        supplierToRestore.value = rowData
        showRestoreModal.value = true
      }
    },
    width: 180,
    hozAlign: 'center',
  },
]

// Filtered suppliers based on showArchived
const filteredSuppliers = computed(() => supplierStore.suppliers)

function showToastMessage(message, type = 'success') {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 2500)
}

function isValidPHNumber(number) {
  // Only numbers, starts with 09, and exactly 11 digits
  return /^09\d{9}$/.test(number)
}

async function addSupplier() {
  if (
    !newSupplier.value.full_name.trim() ||
    !newSupplier.value.contact_number.trim() ||
    !newSupplier.value.supply_type.trim()
  ) {
    showToastMessage('Please fill in all fields.', 'error')
    return
  }
  if (!isValidPHNumber(newSupplier.value.contact_number)) {
    showToastMessage('Invalid PH contact number format.', 'error')
    return
  }
  await supplierStore.createSupplier({ ...newSupplier.value })
  showToastMessage('Supplier added successfully!')
  newSupplier.value.full_name = ''
  newSupplier.value.contact_number = ''
  newSupplier.value.supply_type = ''
  showAddForm.value = false
}

function viewSupplier(supplier) {
  selectedSupplier.value = supplier
  showViewModal.value = true
}

function editSupplier(supplier) {
  selectedSupplier.value = { ...supplier }
  showEditModal.value = true
}

async function saveEdit() {
  await supplierStore.updateSupplier(selectedSupplier.value.id, {
    full_name: selectedSupplier.value.full_name,
    contact_number: selectedSupplier.value.contact_number,
    supply_type: selectedSupplier.value.supply_type,
  })
  showToastMessage('Supplier updated successfully!')
  showEditModal.value = false
  selectedSupplier.value = null
}

function archiveSupplier(supplier) {
  selectedSupplier.value = supplier
  showArchiveModal.value = true
}

async function confirmArchive() {
  await supplierStore.archiveSupplier(selectedSupplier.value.id)
  await supplierStore.fetchSuppliers({ archived: showArchived.value })
  showToastMessage('Supplier archived successfully!')
  showArchiveModal.value = false
  selectedSupplier.value = null
}

async function confirmRestore() {
  if (!supplierToRestore.value) return
  await supplierStore.restoreSupplier(supplierToRestore.value.id)
  await supplierStore.fetchSuppliers({ archived: showArchived.value })
  showToastMessage('Supplier restored successfully!')
  showRestoreModal.value = false
  supplierToRestore.value = null
}

onMounted(() => {
  supplierStore.fetchSuppliers({ archived: showArchived.value })
  console.log(supplierStore.suppliers)
})

watch(showArchived, (val) => {
  supplierStore.fetchSuppliers({ archived: val })
})

watch(
  () => supplierStore.suppliers,
  (val) => {
    console.log('Suppliers from store:', val)
  },
  { immediate: true },
)
</script>

<template>
  <div>
    <h1 class="text-xl font-bold mb-4 text-black">Supplier Management</h1>

    <!-- Add Supplier Button and Show Archived Checkbox -->
    <div class="mb-4 flex items-center gap-4">
      <button class="btn-primaryStyle btn-sm" @click="showAddForm = !showAddForm">
        {{ showAddForm ? 'Close' : 'Add New Supplier' }}
      </button>
      <label class="flex items-center gap-2 ml-auto">
        <input
          type="checkbox"
          v-model="showArchived"
          class="checkbox checkbox-xs checkbox-neutral"
        />
        <span class="text-sm cursor-pointer hover:text-gray-500">Show Archived</span>
      </label>
    </div>

    <!-- Add Supplier Form -->
    <div v-if="showAddForm" class="mb-6 p-4 border rounded bg-gray-50">
      <div class="flex flex-col md:flex-row gap-4">
        <input
          v-model="newSupplier.full_name"
          type="text"
          class="input-search input-sm border border-gray-300"
          placeholder="Full Name"
        />
        <input
          v-model="newSupplier.contact_number"
          type="text"
          class="input-search input-sm border border-gray-300"
          placeholder="Contact Number"
          maxlength="11"
          @input="(e) => (newSupplier.contact_number = e.target.value.replace(/[^0-9]/g, ''))"
        />
        <input
          v-model="newSupplier.supply_type"
          type="text"
          class="input-search input-sm border border-gray-300"
          placeholder="Supply Type/Description"
        />
        <button class="btn-primaryStyle btn-sm" @click="addSupplier">Add</button>
      </div>
    </div>

    <!-- Supplier Table -->
    <BaseTable
      :title="'Supplier List'"
      :data="filteredSuppliers"
      :columns="columns"
      :showExport="false"
    />

    <!-- View Modal -->
    <dialog :open="showViewModal && selectedSupplier" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-lg text-black">View Supplier</h3>
        <div class="py-2 text-black">
          <p><b>Full Name:</b> {{ selectedSupplier ? selectedSupplier.full_name : '' }}</p>
          <p>
            <b>Contact Number:</b> {{ selectedSupplier ? selectedSupplier.contact_number : '' }}
          </p>
          <p><b>Supply Type:</b> {{ selectedSupplier ? selectedSupplier.supply_type : '' }}</p>
        </div>
        <div class="modal-action justify-center">
          <button class="btn-secondaryStyle" @click="showViewModal = false">Close</button>
        </div>
      </div>
    </dialog>

    <!-- Edit Modal -->
    <dialog :open="showEditModal" class="modal">
      <div class="modal-box bg-white w-96">
        <div v-if="selectedSupplier">
          <h3 class="font-bold text-lg text-black">Edit Supplier</h3>
          <div class="flex flex-col gap-2 py-2">
            <input
              v-model="selectedSupplier.full_name"
              class="input-search input-sm border border-gray-300"
              placeholder="Full Name"
            />
            <input
              v-model="selectedSupplier.contact_number"
              class="input-search input-sm border border-gray-300"
              placeholder="Contact Number"
              maxlength="11"
              @input="
                (e) => (selectedSupplier.contact_number = e.target.value.replace(/[^0-9]/g, ''))
              "
            />
            <input
              v-model="selectedSupplier.supply_type"
              class="input-search input-sm border border-gray-300"
              placeholder="Supply Type/Description"
            />
          </div>
          <div class="modal-action justify-center gap-2">
            <button class="btn-primaryStyle" @click="saveEdit">Save</button>
            <button
              class="btn-secondaryStyle"
              @click="
                () => {
                  showEditModal = false
                  selectedSupplier = null
                }
              "
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </dialog>

    <!-- Archive Modal -->
    <dialog :open="showArchiveModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-lg text-black">Archive Supplier</h3>
        <div class="divider"></div>
        <p class="py-4 text-center text-black">
          Are you sure you want to archive
          <span class="font-bold">{{ selectedSupplier ? selectedSupplier.full_name : '' }}</span
          >?
        </p>
        <div class="modal-action justify-center gap-2">
          <button class="btn-errorStyle" @click="confirmArchive">Archive</button>
          <button class="btn-secondaryStyle" @click="showArchiveModal = false">Cancel</button>
        </div>
      </div>
    </dialog>

    <!-- Restore Modal -->
    <dialog :open="showRestoreModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-lg text-black">Restore Supplier</h3>
        <div class="divider"></div>
        <p class="py-4 text-center text-black">
          Are you sure you want to restore
          <span class="font-bold">{{ supplierToRestore ? supplierToRestore.full_name : '' }}</span
          >?
        </p>
        <div class="modal-action justify-center gap-2">
          <button class="btn-primaryStyle" @click="confirmRestore">Restore</button>
          <button class="btn-secondaryStyle" @click="showRestoreModal = false">Cancel</button>
        </div>
      </div>
    </dialog>

    <Toast :show="showToast" :message="toastMessage" :type="toastType" />
  </div>
</template>
