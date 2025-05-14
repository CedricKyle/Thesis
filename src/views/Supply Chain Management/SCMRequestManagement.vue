<script setup>
import BaseTable from '@/components/common/BaseTable.vue'
import Toast from '@/components/Admin Components/HR/Toast.vue'
import { ref } from 'vue'

const columns = [
  { title: 'Request ID', field: 'request_id' },
  { title: 'Description', field: 'description' },
  { title: 'Request Date', field: 'request_date' },
  {
    title: 'Request Status',
    field: 'request_status',
    formatter: (cell) => {
      const status = cell.getValue()
      const badgeClasses = {
        Pending: 'badge badge-outline badge-warning text-xs badge-sm',
        Approved: 'badge badge-outline badge-success text-xs badge-sm',
        Rejected: 'badge badge-outline badge-error text-xs badge-sm',
      }
      return `<span class="${badgeClasses[status] || 'badge badge-outline badge-neutral text-xs badge-sm'}">${status}</span>`
    },
  },
  {
    title: 'Action',
    field: 'action',
    formatter: (cell) => {
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
          <button class="btn btn-sm btn-circle hover:bg-red-400 border-none btn-ghost cancelRequest-button" title="Cancel Request">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      `
    },
  },
]

//sample data
const data = ref([
  {
    request_id: '3547823',
    description: 'Request 1',
    request_date: '2025-05-14',
    request_status: 'Pending',
    action: 'View',
  },
])

// Add request modal functionality
const showAddRequestModal = ref(false)
const newRequest = ref({
  item_name: '',
  quantity: '',
  product_description: '',
  unit_price: '',
  amount: '',
})

const openAddRequestModal = () => {
  showAddRequestModal.value = true
}

const closeAddRequestModal = () => {
  showAddRequestModal.value = false
  resetForm()
}

const resetForm = () => {
  newRequest.value = {
    item_name: '',
    quantity: '',
    product_description: '',
    unit_price: '',
    amount: '',
  }
}

const submitRequest = () => {
  // Here you would handle the submission logic
  // For now, we'll just close the modal
  closeAddRequestModal()
}

// Calculate amount when quantity or unit price changes
const calculateAmount = () => {
  if (newRequest.value.quantity && newRequest.value.unit_price) {
    newRequest.value.amount = (
      parseFloat(newRequest.value.quantity) * parseFloat(newRequest.value.unit_price)
    ).toFixed(2)
  } else {
    newRequest.value.amount = ''
  }
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <input class="input-search input-sm" placeholder="Search Request" />
      <div class="flex gap-2">
        <button class="btn-primaryStyle btn-sm" @click="openAddRequestModal">+ Add Request</button>
      </div>
    </div>
    <BaseTable :columns="columns" :data="data" />
    <div class="flex justify-end gap-2 mt-4">
      <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
      <span class="text-sm cursor-pointer hover:text-gray-500 text-black">
        Show Archived Requests
      </span>
    </div>

    <!-- Add Request Modal -->
    <dialog :open="showAddRequestModal" class="modal">
      <div class="modal-box bg-white max-w-7xl p-6 rounded-lg shadow-lg">
        <h3 class="font-bold text-lg text-black">Add New Request</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>

        <form @submit.prevent="submitRequest" class="py-4">
          <div class="grid grid-cols-12 gap-4">
            <!-- Item No. - narrower width -->
            <div class="form-control col-span-1">
              <label class="label">
                <span class="text-xs font-bold text-black">Item No.</span>
              </label>
              <span class="text-xs font-bold text-black">1</span>
            </div>

            <!-- Item Name - adjusted width -->
            <div class="form-control col-span-3">
              <label class="label">
                <span class="text-xs font-bold text-black">Item Name</span>
              </label>
              <input
                type="text"
                v-model="newRequest.item_name"
                class="input-search input-sm text-black"
                placeholder="Enter item name"
                required
              />
            </div>

            <!-- Quantity - adjusted width -->
            <div class="form-control col-span-2">
              <label class="label">
                <span class="text-xs font-bold text-black">Quantity</span>
              </label>
              <input
                type="number"
                v-model="newRequest.quantity"
                @input="calculateAmount"
                class="input-search input-sm text-black"
                placeholder="Enter quantity"
                min="1"
                required
              />
            </div>

            <!-- Unit Price - adjusted width -->
            <div class="form-control col-span-3">
              <label class="label">
                <span class="text-xs font-bold text-black">Unit Price</span>
              </label>
              <input
                type="number"
                v-model="newRequest.unit_price"
                @input="calculateAmount"
                class="input-search input-sm text-black"
                placeholder="Enter unit price"
                min="0"
                step="0.01"
                required
              />
            </div>

            <!-- Amount (auto-calculated) - adjusted width -->
            <div class="form-control col-span-3">
              <label class="label">
                <span class="text-xs font-bold text-black">Amount</span>
              </label>
              <input
                type="text"
                v-model="newRequest.amount"
                class="input-search input-sm text-black"
                placeholder="0.00"
                readonly
              />
            </div>
            <div class="form-control col-span-12 flex justify-end">
              <button class="btn-primaryStyle btn-sm">+ Add Item</button>
            </div>
          </div>

          <div class="modal-action justify-end gap-4 mt-6">
            <button type="submit" class="btn-primaryStyle">Submit Request</button>
            <button type="button" class="btn-secondaryStyle" @click="closeAddRequestModal">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </dialog>
  </div>
</template>
