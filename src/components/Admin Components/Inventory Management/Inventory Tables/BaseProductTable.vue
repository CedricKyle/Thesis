<script setup>
import { ref, onMounted, watch } from 'vue'
import { TabulatorFull as Tabulator } from 'tabulator-tables'
import { SquarePen, Trash2 } from 'lucide-vue-next'

const props = defineProps({
  products: {
    type: Array,
    required: true,
    default: () => [],
  },
})

const emit = defineEmits(['edit-product', 'delete-product'])
const tableRef = ref(null)
const deleteModal = ref(null)
const productToDelete = ref(null)
let table = null

const handleEdit = (product) => {
  emit('edit-product', product)
}

const handleDelete = (product) => {
  productToDelete.value = product
  deleteModal.value?.showModal()
}

const confirmDelete = () => {
  if (productToDelete.value) {
    emit('delete-product', productToDelete.value)
    deleteModal.value?.close()
    productToDelete.value = null
  }
}

// Define columns for Tabulator
const columns = [
  {
    title: 'Id',
    field: 'id',
    width: 150,
    formatter: function (cell) {
      const product = cell.getRow().getData()
      return `
        <div class="flex justify-between items-center">
          <div>${product.id}</div>
          <div class="w-10 h-10 rounded-sm overflow-hidden">
            ${
              product.img
                ? `<img src="${product.img}" class="w-full h-full object-cover" alt="${product.name}"/>`
                : `<div class="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span class="text-gray-400 text-xs">No image</span>
                </div>`
            }
          </div>
        </div>`
    },
    headerSort: true,
  },
  {
    title: 'Product Name',
    field: 'name',
    width: 200,
    headerSort: true,
  },
  {
    title: 'Price',
    field: 'price',
    formatter: (cell) => `₱${cell.getValue()}`,
    headerSort: true,
  },
  {
    title: 'Quantity',
    field: 'quantity',
    formatter: (cell) => `<span class="font-bold">${cell.getValue()}</span>`,
    headerSort: true,
  },
  {
    title: 'Expiry Date',
    field: 'dateExpiry',
    headerSort: true,
  },
  {
    title: 'Max Qty',
    field: 'maxQty',
    formatter: (cell) => `<span class="font-bold">${cell.getValue()}</span>`,
    headerSort: true,
  },
  {
    title: 'Status',
    field: 'quantity',
    formatter: function (cell) {
      const quantity = Number(cell.getValue())
      const maxQty = Number(cell.getRow().getData().maxQty)

      let status, className
      if (quantity >= maxQty * 0.5) {
        status = 'In Stock'
        className = 'badge badge-success'
      } else if (quantity > 0) {
        status = 'Low Stock'
        className = 'badge badge-warning'
      } else {
        status = 'No Stock'
        className = 'badge badge-error'
      }

      return `<span class="${className}">${status}</span>`
    },
    headerSort: true,
  },
  {
    title: 'Action',
    formatter: function () {
      return `
        <div class="flex gap-2">
          <button class="btn btn-sm btn-circle hover:bg-primaryColor/80 border-none btn-ghost edit-button">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
              <path d="m15 5 4 4"/>
            </svg>
          </button>
          <button class="btn btn-sm btn-circle hover:bg-red-400 border-none btn-ghost delete-button">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
          </button>
        </div>`
    },
    cellClick: function (e, cell) {
      const product = cell.getRow().getData()
      if (e.target.closest('.edit-button')) {
        handleEdit(product)
      } else if (e.target.closest('.delete-button')) {
        handleDelete(product)
      }
    },
    headerSort: false,
  },
]

onMounted(() => {
  table = new Tabulator(tableRef.value, {
    data: props.products,
    columns: columns,
    layout: 'fitColumns',
    responsiveLayout: 'collapse',
    height: '100%',
    pagination: true,
    paginationSize: 10,
    paginationSizeSelector: [10, 25, 50],
    placeholder: 'No products available',
    cssClass: 'custom-tabulator',
  })
})

// Watch for data changes
watch(
  () => props.products,
  (newData) => {
    if (table) {
      table.setData(newData)
    }
  },
  { deep: true },
)
</script>

<template>
  <div class="w-full bg-white shadow-md rounded-md">
    <div ref="tableRef"></div>
  </div>

  <!-- Delete Confirmation Modal -->
  <dialog ref="deleteModal" class="modal">
    <div class="modal-box bg-white w-96">
      <p class="py-4 text-center text-black text-lg">
        Are you sure you want to delete {{ productToDelete?.name }}?
      </p>
      <div class="modal-action justify-center gap-4">
        <button class="btn btn-error" @click="confirmDelete">Delete</button>
        <button class="btn" @click="deleteModal?.close()">Cancel</button>
      </div>
    </div>
  </dialog>
</template>
