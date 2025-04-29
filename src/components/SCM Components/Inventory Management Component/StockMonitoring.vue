<script setup>
import { ref, computed } from 'vue'
import BaseTable from '@/components/common/BaseTable.vue'
import { useInventoryPDFGenerator } from '@/composables/SCM Composables/useInvetoryPDFGenerator'
import { useInventoryStore } from '@/stores/SCM Stores/scmInventoryStores.js'

const store = useInventoryStore()
store.fetchProducts()
const products = computed(() => store.products)

const uniqueCategories = computed(() => {
  const categories = new Set(products.value.map((p) => p.category))
  return Array.from(categories)
})

const mappedProducts = computed(() =>
  products.value.map((p) => ({
    ...p,
    maxQuantity: p.max_quantity,
    expiryDate: p.expiry_date,
    price: `₱${Number(p.price).toFixed(2)}`,
    // Add more mappings if needed
  })),
)

const search = ref('')
const selectedCategory = ref('')

const { generateInventoryPDF } = useInventoryPDFGenerator()

// State for export modal
const showExportModal = ref(false)
const exportPageCount = ref(1)

// Modal state
const showAddProductModal = ref(false)
const addProductForm = ref({
  name: '',
  category: '',
  unit: '',
  maxQuantity: '',
  expiryDate: '',
  price: '',
  image: null,
})
const addProductErrors = ref({})
const addProductImagePreview = ref(null)
const addProductIsDragging = ref(false)
const addProductFileInput = ref(null)

const backendUrl = 'http://localhost:3000' // or use import.meta.env.VITE_BACKEND_URL

// New category modal state
const showNewCategoryModal = ref(false)
const newCategory = ref('')
const newCategoryError = ref('')

// Helper to compute status
function computeStatus(product) {
  const today = new Date()
  const expiry = new Date(product.expiryDate)
  if (expiry < today) return 'Expired'
  if (product.quantity === 0) return 'Out of Stock'
  if (product.quantity < product.maxQuantity * 0.2) return 'Low Stock'
  return 'In Stock'
}

// Add status to each product for display
const filteredProducts = computed(() => {
  let filtered = mappedProducts.value
  if (search.value) {
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(search.value.toLowerCase()) ||
        p.category.toLowerCase().includes(search.value.toLowerCase()),
    )
  }
  if (selectedCategory.value) {
    filtered = filtered.filter((p) => p.category === selectedCategory.value)
  }
  // Map to add status
  return filtered.map((p) => ({
    ...p,
    status: computeStatus(p),
  }))
})

const columns = [
  {
    title: 'No.',
    field: 'no',
    headerSort: false,
    formatter: function (cell) {
      const row = cell.getRow().getData()
      let imgSrc = row.image ? row.image.replace(/\\/g, '/') : '/default-product.png'
      if (imgSrc && !imgSrc.startsWith('http')) {
        imgSrc = `${backendUrl}/${imgSrc.replace(/^\//, '')}`
      }
      return `
        <div class="flex justify-evenly items-center gap-2">
          <span>${cell.getRow().getPosition() + 1}.</span>
          <img 
            src="${imgSrc}" 
            alt="Product" 
            style="width:32px;height:32px;object-fit:cover;border-radius:4px;border:1px solid #ccc;cursor:pointer;"
            data-img-src="${imgSrc}"
            class="product-img-preview"
          >
        </div>
      `
    },
    cellClick: function (e, cell) {
      // Check if the image was clicked
      const img = e.target.closest('.product-img-preview')
      if (img) {
        previewImageSrc.value = img.getAttribute('data-img-src')
        showImageModal.value = true
      }
    },
  },
  { title: 'Product Name', field: 'name', headerSort: true },
  { title: 'Quantity', field: 'quantity', headerSort: true },
  { title: 'Price', field: 'price', headerSort: true },
  { title: 'Max Qty', field: 'maxQuantity', headerSort: true },
  { title: 'Unit', field: 'unit', headerSort: true },
  { title: 'Expiry Date', field: 'expiryDate', headerSort: true },
  { title: 'Category', field: 'category', headerSort: true },
  {
    title: 'Status',
    field: 'status',
    headerSort: true,
    formatter: function (cell) {
      const status = cell.getValue()
      let statusClass = ''
      if (status === 'In Stock') statusClass = 'bg-green-100 text-green-800'
      else if (status === 'Low Stock') statusClass = 'bg-yellow-100 text-yellow-800'
      else if (status === 'Out of Stock') statusClass = 'bg-red-100 text-red-800'
      else if (status === 'Expired') statusClass = 'bg-gray-300 text-white'
      return `<span class="px-2 py-1 text-xs font-medium rounded-full ${statusClass}">${status}</span>`
    },
  },
  {
    title: 'Action',
    field: 'action',
    headerSort: false,
    formatter: function () {
      return `
        <div class="flex gap-2">
          <button class="btn btn-xs btn-circle btn-ghost view-history-btn" title="View History">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M12 8v4l3 3"/>
              <circle cx="12" cy="12" r="10"/>
            </svg>
          </button>
          <button class="btn btn-xs btn-circle btn-ghost edit-btn" title="Edit">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="btn btn-xs btn-circle btn-ghost delete-btn" title="Delete">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
          </button>
        </div>
      `
    },
    cellClick: function (e, cell) {
      const product = cell.getRow().getData()
      if (e.target.closest('.view-history-btn')) {
        handleViewHistory(product)
      } else if (e.target.closest('.edit-btn')) {
        handleEdit(product)
      } else if (e.target.closest('.delete-btn')) {
        handleDelete(product)
      }
    },
  },
]

function rowFormatter(row) {
  const data = row.getData()
  if (data.status === 'Low Stock') {
    row.getElement().style.backgroundColor = '#FEF9C3' // light yellow
  } else if (data.status === 'Out of Stock' || data.status === 'Expired') {
    row.getElement().style.backgroundColor = '#FECACA' // light red
  } else {
    row.getElement().style.backgroundColor = '' // default
  }
}

function handleEdit(product) {
  // Open your edit modal or emit an event
  alert('Edit: ' + product.name)
}

function handleDelete(product) {
  // Open your delete confirmation modal or emit an event
  alert('Delete: ' + product.name)
}

async function handleViewHistory(product) {
  selectedProduct.value = product
  // Wait for store to be ready
  if (typeof store.fetchProductMovements === 'function') {
    movementHistory.value = await store.fetchProductMovements(product.id)
    showHistoryModal.value = true
  } else {
    alert('fetchProductMovements is not available! Restart your dev server.')
  }
}

const movementHistory = ref([])
const showHistoryModal = ref(false)
const selectedProduct = ref(null)

// PDF Export Preview Logic
async function prepareExportPreview() {
  // Dynamically import jsPDF and autoTable
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default
  const doc = new jsPDF()
  let currentY = 10

  // (Optional) Add logo and title as in your generator
  // const logoBase64 = await getBase64ImageFromUrl('/public/countryside-logo.png')
  // doc.addImage(logoBase64, 'PNG', 14, currentY, 20, 20)
  // currentY += 22

  doc.setFontSize(18)
  doc.setTextColor(70, 97, 20)
  doc.text('Inventory Stock Monitoring', 14, currentY)
  currentY += 10

  const headers = columns.filter((col) => col.field !== 'action').map((col) => col.title)
  const data = filteredProducts.value.map((row) =>
    columns.filter((col) => col.field !== 'action').map((col) => row[col.field] || '-'),
  )

  autoTable(doc, {
    head: [headers],
    body: data,
    startY: currentY,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2, halign: 'center', valign: 'middle' },
    headStyles: {
      fillColor: [70, 97, 20],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    margin: { left: 10, right: 10 },
    tableWidth: 'auto',
    setPageLimits: true,
    startX: 7.5,
  })

  exportPageCount.value = doc.internal.getNumberOfPages()
  showExportModal.value = true
}

async function confirmExportPDF() {
  // Only export the fields in columns (excluding 'action')
  const exportData = filteredProducts.value.map((row) =>
    Object.fromEntries(
      columns.filter((col) => col.field !== 'action').map((col) => [col.field, row[col.field]]),
    ),
  )
  await generateInventoryPDF(exportData)
  showExportModal.value = false
}

async function printPreviewPDF() {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default
  const doc = new jsPDF()
  let currentY = 10

  doc.setFontSize(18)
  doc.setTextColor(70, 97, 20)
  doc.text('Inventory Stock Monitoring', 14, currentY)
  currentY += 10

  const headers = columns.filter((col) => col.field !== 'action').map((col) => col.title)
  const data = filteredProducts.value.map((row) =>
    columns.filter((col) => col.field !== 'action').map((col) => row[col.field] || '-'),
  )

  autoTable(doc, {
    head: [headers],
    body: data,
    startY: currentY,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2, halign: 'center', valign: 'middle' },
    headStyles: {
      fillColor: [70, 97, 20],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    margin: { left: 10, right: 10 },
    tableWidth: 'auto',
    setPageLimits: true,
    startX: 7.5,
  })

  // Open the print dialog for the generated PDF
  window.open(doc.output('bloburl'), '_blank')
}

const baseTableRef = ref(null)

function getSelectedRows() {
  // Get selected data from Tabulator
  return baseTableRef.value?.table?.getSelectedData() || []
}

function batchDelete() {
  const selected = getSelectedRows()
  if (selected.length === 0) {
    alert('No rows selected!')
    return
  }
  if (!confirm(`Are you sure you want to delete ${selected.length} selected items?`)) {
    return
  }
  // Remove selected items from products.value
  const selectedIds = selected.map((row) => row.id)
  products.value = products.value.filter((row) => !selectedIds.includes(row.id))
  // Deselect all after deletion
  baseTableRef.value?.table?.deselectRow()
}

async function batchExportPDF() {
  const selected = getSelectedRows()
  if (selected.length === 0) {
    alert('No rows selected!')
    return
  }
  await generateInventoryPDF(selected)
  // Optionally, deselect after export
  baseTableRef.value?.table?.deselectRow()
}

function openAddProductModal() {
  showAddProductModal.value = true
  // Reset form
  addProductForm.value = {
    name: '',
    category: '',
    unit: '',
    maxQuantity: '',
    expiryDate: '',
    price: '',
    image: null,
  }
  addProductErrors.value = {}
  addProductImagePreview.value = null
}

function handleAddProductFileUpload(e) {
  const file = e.target.files[0]
  addProductForm.value.image = file
  if (file && file.type.startsWith('image/')) {
    addProductImagePreview.value = URL.createObjectURL(file)
  } else {
    addProductImagePreview.value = null
  }
}

function removeAddProductImage() {
  addProductForm.value.image = null
  addProductImagePreview.value = null
}

function handleAddProductDrop(e) {
  e.preventDefault()
  addProductIsDragging.value = false
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    handleAddProductFileUpload({ target: { files: e.dataTransfer.files } })
  }
}
function handleAddProductDragOver(e) {
  e.preventDefault()
  addProductIsDragging.value = true
}
function handleAddProductDragLeave(e) {
  e.preventDefault()
  addProductIsDragging.value = false
}
function openAddProductFileDialog() {
  if (addProductFileInput.value) addProductFileInput.value.click()
}

function validateAddProductForm() {
  const errors = {}
  if (!addProductForm.value.name) errors.name = 'Product name is required'
  if (!addProductForm.value.category) errors.category = 'Category is required'
  if (!addProductForm.value.unit) errors.unit = 'Unit is required'
  if (
    !addProductForm.value.price ||
    isNaN(addProductForm.value.price) ||
    Number(addProductForm.value.price) <= 0
  )
    errors.price = 'Valid price is required'
  if (
    !addProductForm.value.maxQuantity ||
    isNaN(addProductForm.value.maxQuantity) ||
    Number(addProductForm.value.maxQuantity) <= 0
  )
    errors.maxQuantity = 'Valid max quantity is required'
  if (!addProductForm.value.expiryDate) errors.expiryDate = 'Expiry date is required'
  return errors
}

function submitAddProduct() {
  addProductErrors.value = validateAddProductForm()
  if (Object.keys(addProductErrors.value).length > 0) return

  // Add to products (mock, replace with store/API later)
  products.value.push({
    id: products.value.length + 1,
    name: addProductForm.value.name,
    category: addProductForm.value.category,
    quantity: 0,
    unit: addProductForm.value.unit,
    price: Number(addProductForm.value.price).toFixed(2),
    maxQuantity: Number(addProductForm.value.maxQuantity),
    dateCreated: new Date().toISOString().split('T')[0],
    expiryDate: addProductForm.value.expiryDate,
    image: addProductForm.value.image ? addProductImagePreview.value : null,
  })
  showAddProductModal.value = false
}

const showImageModal = ref(false)
const previewImageSrc = ref('')

function addNewCategory() {
  if (!newCategory.value.trim()) {
    newCategoryError.value = 'Category name is required'
    return
  }

  // Check if category already exists
  if (uniqueCategories.value.includes(newCategory.value.trim())) {
    newCategoryError.value = 'Category already exists'
    return
  }

  // Add to store/backend later
  store.addCategory(newCategory.value.trim())

  // Set the new category as selected
  addProductForm.value.category = newCategory.value.trim()

  // Reset and close modal
  newCategory.value = ''
  newCategoryError.value = ''
  showNewCategoryModal.value = false
}
</script>

<template>
  <div class="bg-white rounded shadow p-4">
    <div class="flex justify-between items-center mb-2">
      <h2 class="text-lg font-bold text-black">Stock Monitoring</h2>
      <button class="btn-primaryStyle" @click="openAddProductModal">+ Add Product</button>
    </div>
    <div class="flex gap-2">
      <div class="w-full">
        <input
          v-model="search"
          type="text"
          placeholder="Search product or category"
          class="input-search input-sm"
        />
      </div>
      <div class="">
        <select
          v-model="selectedCategory"
          class="select !input-search bg-white text-black border border-black input-sm outline-none"
        >
          <option disabled selected>Select Category</option>
          <option value="">All Categories</option>
          <option v-for="category in uniqueCategories" :key="category" :value="category">
            {{ category }}
          </option>
        </select>
      </div>
    </div>

    <!-- Export PDF Button -->

    <!-- Confirmation Modal -->
    <dialog v-if="showExportModal" open class="modal text-black">
      <div class="modal-box bg-white w-[480px] p-6 rounded-lg shadow-lg">
        <div class="flex flex-col gap-4">
          <h2 class="text-2xl font-bold text-center text-primaryColor mb-2">
            Export Inventory as PDF
          </h2>
          <div class="bg-gray-50 rounded p-4 text-center">
            <p class="mb-2 text-sm">You are about to export the current inventory list as a PDF.</p>
            <div class="flex justify-center gap-8 text-sm mt-2">
              <div>
                <span class="text-sm mr-1">Rows:</span>
                <span>{{ filteredProducts.length }}</span>
              </div>
              <div>
                <span class="text-sm">Estimated Pages:</span>
                <span>{{ exportPageCount }}</span>
              </div>
            </div>
            <!-- Mini Table Preview -->
            <div class="overflow-x-auto mt-4 max-h-48 border rounded">
              <table class="w-full text-xs">
                <thead>
                  <tr>
                    <th
                      v-for="col in columns.filter((c) => c.field !== 'action')"
                      :key="col.field"
                      class="p-1 border-b"
                    >
                      {{ col.title }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in filteredProducts.slice(0, 5)" :key="row.id">
                    <td
                      v-for="col in columns.filter((c) => c.field !== 'action')"
                      :key="col.field"
                      class="p-1 border-b"
                    >
                      {{ row[col.field] || '-' }}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-if="filteredProducts.length > 5" class="text-xs text-gray-500 mt-1">
                ...and {{ filteredProducts.length - 5 }} more rows
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-2 mt-4">
            <button class="btn-secondaryStyle px-6" @click="showExportModal = false">Cancel</button>
            <button class="btn-primaryStyle px-6" @click="confirmExportPDF">Export PDF</button>
          </div>
        </div>
      </div>
    </dialog>

    <BaseTable
      ref="baseTableRef"
      :title="'Inventory List'"
      :data="filteredProducts"
      :columns="columns"
      :showExport="false"
      :rowFormatter="rowFormatter"
    />
    <div class="flex justify-end mt-4">
      <button class="btn-secondaryStyle" @click="prepareExportPreview">Export as PDF</button>
    </div>

    <!-- Stock Movement History Modal -->
    <dialog v-if="showHistoryModal" open class="modal text-black">
      <div class="modal-box bg-white w-full max-w-2xl p-6 rounded-xl shadow-2xl">
        <div class="flex justify-between items-center border-b pb-4 mb-4">
          <h3 class="text-xl font-bold text-gray-900">Stock Movement History</h3>
          <button
            class="btn btn-xs btn-circle hover:bg-red-400 btn-ghost hover:border-red-400"
            @click="showHistoryModal = false"
          >
            ✕
          </button>
        </div>
        <div class="mb-4">
          <span class="font-semibold text-gray-700 text-sm mr-2">Product:</span>
          <span class="font-bold text-primaryColor text-sm">{{ selectedProduct?.name }}</span>
        </div>
        <div class="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table class="min-w-full text-sm text-left">
            <thead class="bg-primaryColor/90 text-white">
              <tr>
                <th class="px-4 py-2 font-semibold">Date</th>
                <th class="px-4 py-2 font-semibold">Type</th>
                <th class="px-4 py-2 font-semibold">Quantity</th>
                <th class="px-4 py-2 font-semibold">Remarks</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(entry, idx) in movementHistory"
                :key="idx"
                :class="idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'"
              >
                <td class="px-4 py-2 border-b">{{ entry.date }}</td>
                <td class="px-4 py-2 border-b">
                  <span
                    :class="[
                      'inline-block px-2 py-1 rounded-full text-xs',
                      entry.type === 'Stock In'
                        ? 'badge badge-success badge-outline'
                        : entry.type === 'Stock Out'
                          ? 'badge badge-error badge-outline'
                          : 'badge badge-info badge-outline',
                    ]"
                  >
                    {{ entry.type }}
                  </span>
                </td>
                <td
                  class="border-b font-mono text-center"
                  :class="[
                    Number(entry.quantity) > 0
                      ? 'text-green-600'
                      : Number(entry.quantity) < 0
                        ? 'text-red-600'
                        : 'text-gray-500',
                  ]"
                >
                  {{ Number(entry.quantity).toFixed(2) }}
                </td>
                <td class="px-4 py-2 border-b text-gray-700">{{ entry.remarks }}</td>
              </tr>
              <tr v-if="!movementHistory.length">
                <td colspan="4" class="text-center py-6 text-gray-400">
                  No movement history found.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="flex justify-end mt-6">
          <button class="btn-secondaryStyle" @click="showHistoryModal = false">Close</button>
        </div>
      </div>
    </dialog>

    <!-- Add Product Modal -->
    <dialog v-if="showAddProductModal" open class="modal text-black">
      <div class="modal-box bg-white w-[420px] p-6 rounded-lg shadow-lg">
        <h3 class="text-lg font-bold mb-4">Add New Product</h3>
        <div class="flex flex-col gap-3">
          <div>
            <label class="text-xs font-semibold"
              >Product Name <span class="text-red-500">*</span></label
            >
            <input
              v-model="addProductForm.name"
              type="text"
              class="input w-full border-black text-black bg-white"
            />
            <span v-if="addProductErrors.name" class="text-red-500 text-xs">{{
              addProductErrors.name
            }}</span>
          </div>
          <div>
            <label class="text-xs font-semibold">Price <span class="text-red-500">*</span></label>
            <input
              v-model="addProductForm.price"
              type="number"
              step="0.01"
              min="0"
              class="input w-full border-black text-black bg-white"
            />
            <span v-if="addProductErrors.price" class="text-red-500 text-xs">
              {{ addProductErrors.price }}
            </span>
          </div>
          <div>
            <label class="text-xs font-semibold"
              >Category <span class="text-red-500">*</span></label
            >
            <select
              v-model="addProductForm.category"
              class="select w-full border-black text-black bg-white"
            >
              <option disabled value="">Select Category</option>
              <option v-for="category in uniqueCategories" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
          </div>
          <div>
            <label class="text-xs font-semibold">Unit <span class="text-red-500">*</span></label>
            <input
              v-model="addProductForm.unit"
              type="text"
              class="input w-full border-black text-black bg-white"
            />
            <span v-if="addProductErrors.unit" class="text-red-500 text-xs">{{
              addProductErrors.unit
            }}</span>
          </div>
          <div>
            <label class="text-xs font-semibold"
              >Max Quantity <span class="text-red-500">*</span></label
            >
            <input
              v-model="addProductForm.maxQuantity"
              type="text"
              class="input w-full border-black text-black bg-white"
            />
            <span v-if="addProductErrors.maxQuantity" class="text-red-500 text-xs">{{
              addProductErrors.maxQuantity
            }}</span>
          </div>
          <div>
            <label class="text-xs font-semibold"
              >Expiry Date <span class="text-red-500">*</span></label
            >
            <input
              v-model="addProductForm.expiryDate"
              type="date"
              class="input w-full border-black text-black bg-white"
            />
            <span v-if="addProductErrors.expiryDate" class="text-red-500 text-xs">{{
              addProductErrors.expiryDate
            }}</span>
          </div>
          <div>
            <label class="text-xs font-semibold block mb-1">Product Image</label>
            <div
              class="relative flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 transition-colors"
              :class="{
                'border-primaryColor bg-primaryColor/10': addProductIsDragging,
                'border-gray-300 bg-gray-50': !addProductIsDragging,
              }"
              @dragover="handleAddProductDragOver"
              @dragleave="handleAddProductDragLeave"
              @drop="handleAddProductDrop"
              @click="openAddProductFileDialog"
              style="cursor: pointer; min-height: 120px"
            >
              <button
                v-if="addProductForm.image"
                @click.stop="removeAddProductImage"
                class="absolute top-2 right-2 text-red-500 hover:text-red-600 text-md cursor-pointer"
                title="Remove file"
              >
                ×
              </button>
              <input
                ref="addProductFileInput"
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleAddProductFileUpload"
              />
              <template v-if="!addProductForm.image">
                <span class="text-gray-400 text-center text-xs">
                  Click to browse or<br />drag and drop product image
                </span>
              </template>
              <template v-else>
                <span class="text-xs text-gray-500 mb-2">{{ addProductForm.image.name }}</span>
                <div v-if="addProductImagePreview" class="mt-2">
                  <img :src="addProductImagePreview" class="max-h-24 rounded border" />
                </div>
              </template>
            </div>
            <p class="text-xs text-gray-500 mt-1">* Image files only, max 5MB</p>
          </div>
          <div class="flex justify-end gap-2 mt-4">
            <button class="btn-secondaryStyle px-6" @click="showAddProductModal = false">
              Cancel
            </button>
            <button class="btn-primaryStyle px-6" @click="submitAddProduct">Add Product</button>
          </div>
        </div>
      </div>
    </dialog>

    <!-- Image Preview Modal -->
    <dialog
      v-if="showImageModal"
      open
      class="modal text-black"
      @click.self="showImageModal = false"
    >
      <div class="modal-box bg-white p-4 rounded-lg shadow-lg flex flex-col items-center">
        <img
          :src="previewImageSrc"
          alt="Product Preview"
          class="max-h-96 max-w-full rounded border mb-4"
        />
        <button class="btn-secondaryStyle" @click="showImageModal = false">Close</button>
      </div>
    </dialog>
  </div>
</template>
