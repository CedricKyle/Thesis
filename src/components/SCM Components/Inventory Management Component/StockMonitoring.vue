<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import BaseTable from '@/components/common/BaseTable.vue'
import { useInventoryPDFGenerator } from '@/composables/SCM Composables/useInvetoryPDFGenerator'
import { useInventoryStore } from '@/stores/SCM Stores/scmInventoryStores.js'

// First declare all your refs
const store = useInventoryStore()
const showArchived = ref(false)
const search = ref('')
const selectedCategory = ref('')
const products = computed(() => store.products)

// Then do the initial fetch
// store.fetchProducts(showArchived.value)

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

// Add these with your other refs
const showDeleteModal = ref(false)
const productToDelete = ref(null)
const showEditModal = ref(false)
const editProductForm = ref({
  name: '',
  category: '',
  unit: '',
  maxQuantity: '',
  expiryDate: '',
  price: '',
  image: null,
  changed_by: 'Admin', // You might want to get this from your auth system
  reason: '',
})
const editProductErrors = ref({})
const editProductImagePreview = ref(null)
const productToEdit = ref(null)

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

  // Apply search filter
  if (search.value) {
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(search.value.toLowerCase()) ||
        p.category.toLowerCase().includes(search.value.toLowerCase()),
    )
  }

  // Apply category filter
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
    title: 'Archive Status',
    field: 'deleted_at',
    formatter: function (cell) {
      const isDeleted = cell.getValue() !== null
      return `<span class="badge ${isDeleted ? 'badge-outline badge-error h-5 text-xs' : 'badge-outline badge-success h-5 text-xs'}">${isDeleted ? 'Archived' : 'Active'}</span>`
    },
    width: 100,
  },
  {
    title: 'Action',
    field: 'action',
    headerSort: false,
    formatter: function (cell) {
      const row = cell.getRow().getData()
      const isDeleted = row.deleted_at !== null
      return `
        <div class="flex gap-2">
          ${
            isDeleted
              ? `
            <button class="btn btn-xs btn-circle hover:bg-green-500 border-none btn-ghost restore-button" title="Restore Product">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 14l-4-4 4-4"/>
                <path d="M5 10h11a4 4 0 1 1 0 8h-1"/>
              </svg>
            </button>
          `
              : `
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
            <button class="btn btn-xs btn-circle hover:bg-red-400 border-none btn-ghost delete-button" title="Archive Product">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              </svg>
            </button>
          `
          }
        </div>`
    },
    cellClick: function (e, cell) {
      const product = cell.getRow().getData()
      if (e.target.closest('.view-history-btn')) {
        handleViewHistory(product)
      } else if (e.target.closest('.edit-btn')) {
        handleEdit(product)
      } else if (e.target.closest('.delete-button')) {
        handleDelete(product)
      } else if (e.target.closest('.restore-button')) {
        handleRestore(product)
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
  productToEdit.value = product
  editProductForm.value = {
    name: product.name,
    category: product.category,
    unit: product.unit,
    maxQuantity: product.maxQuantity,
    expiryDate: product.expiryDate,
    price: product.price.replace('₱', ''), // Remove the peso sign
    image: null, // Reset image
    changed_by: 'Admin',
    reason: '',
  }

  // Set the image preview
  if (product.image) {
    editProductImagePreview.value = product.image.startsWith('http')
      ? product.image
      : `${backendUrl}/${product.image.replace(/^\//, '')}`
  } else {
    editProductImagePreview.value = null
  }

  showEditModal.value = true
}

function handleDelete(product) {
  productToDelete.value = product
  showDeleteModal.value = true
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

async function confirmDelete() {
  if (!productToDelete.value) return

  try {
    await store.deleteProduct(productToDelete.value.id)
    showDeleteModal.value = false
    productToDelete.value = null
    await refreshProducts()
  } catch (error) {
    console.error('Error archiving product:', error)
  }
}

async function handleRestore(product) {
  try {
    await store.restoreProduct(product.id)
    await refreshProducts()
  } catch (error) {
    console.error('Error restoring product:', error)
  }
}

// Add this function to handle refresh
const refreshProducts = async () => {
  try {
    await store.fetchProducts(showArchived.value)
  } catch (error) {
    console.error('Error fetching products:', error)
  }
}

// Update your watch
watch(showArchived, refreshProducts)

// Update your onMounted
onMounted(async () => {
  await refreshProducts()
})

function validateEditProductForm() {
  const errors = {}
  if (!editProductForm.value.name) errors.name = 'Product name is required'
  if (!editProductForm.value.category) errors.category = 'Category is required'
  if (!editProductForm.value.unit) errors.unit = 'Unit is required'
  if (
    !editProductForm.value.price ||
    isNaN(editProductForm.value.price) ||
    Number(editProductForm.value.price) <= 0
  )
    errors.price = 'Valid price is required'
  if (
    !editProductForm.value.maxQuantity ||
    isNaN(editProductForm.value.maxQuantity) ||
    Number(editProductForm.value.maxQuantity) <= 0
  )
    errors.maxQuantity = 'Valid max quantity is required'
  if (!editProductForm.value.expiryDate) errors.expiryDate = 'Expiry date is required'
  if (!editProductForm.value.reason) errors.reason = 'Reason for update is required'
  return errors
}

function handleEditProductFileUpload(e) {
  const file = e.target.files[0]
  if (file && file.type.startsWith('image/')) {
    editProductForm.value.image = file
    editProductImagePreview.value = URL.createObjectURL(file)
  }
}

async function submitEditProduct() {
  editProductErrors.value = validateEditProductForm()
  if (Object.keys(editProductErrors.value).length > 0) return

  try {
    const formData = new FormData()

    // Append all form fields
    formData.append('name', editProductForm.value.name)
    formData.append('category', editProductForm.value.category)
    formData.append('unit', editProductForm.value.unit)
    formData.append('max_quantity', editProductForm.value.maxQuantity)
    formData.append('expiry_date', editProductForm.value.expiryDate)
    formData.append('price', editProductForm.value.price)
    formData.append('changed_by', editProductForm.value.changed_by)
    formData.append('reason', editProductForm.value.reason)

    // Only append image if a new one was selected
    if (editProductForm.value.image instanceof File) {
      formData.append('image', editProductForm.value.image)
    }

    await store.updateProduct(productToEdit.value.id, formData)
    showEditModal.value = false
    await refreshProducts()
  } catch (error) {
    console.error('Error updating product:', error)
  }
}
</script>

<template>
  <div class="bg-white rounded shadow p-4">
    <div class="flex justify-between items-center mb-2">
      <h2 class="text-lg font-bold text-black">Stock Monitoring</h2>
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
      <div class="flex gap-2 flex-row-reverse w-full">
        <div class="">
          <button class="btn-primaryStyle" @click="openAddProductModal">+ Add Product</button>
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
    <div class="flex justify-end mt-4 gap-4">
      <label class="flex items-center gap-2">
        <input
          type="checkbox"
          v-model="showArchived"
          class="checkbox checkbox-xs checkbox-neutral"
        />
        <span class="text-sm cursor-pointer hover:text-gray-500 text-black">Show Archived</span>
      </label>
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

    <!-- Delete Confirmation Modal -->
    <dialog v-if="showDeleteModal" open class="modal text-black">
      <div class="modal-box bg-white w-[420px] p-6 rounded-lg shadow-lg">
        <h3 class="font-bold text-lg text-black">Archive Product</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>

        <p class="py-4 text-center text-black">
          Are you sure you want to archive the product
          <span class="font-bold">{{ productToDelete?.name }}</span
          >?
        </p>

        <div class="modal-action justify-center gap-4">
          <button class="btn-errorStyle" @click="confirmDelete">Archive</button>
          <button class="btn-secondaryStyle" @click="showDeleteModal = false">Cancel</button>
        </div>
      </div>
    </dialog>

    <!-- Edit Product Modal -->
    <dialog v-if="showEditModal" open class="modal text-black">
      <div class="modal-box bg-white w-[420px] p-6 rounded-lg shadow-lg">
        <h3 class="text-lg font-bold mb-4">Edit Product</h3>
        <div class="flex flex-col gap-3">
          <div>
            <label class="text-xs font-semibold"
              >Product Name <span class="text-red-500">*</span></label
            >
            <input
              v-model="editProductForm.name"
              type="text"
              class="input w-full border-black text-black bg-white"
            />
            <span v-if="editProductErrors.name" class="text-red-500 text-xs">{{
              editProductErrors.name
            }}</span>
          </div>
          <div>
            <label class="text-xs font-semibold">Price <span class="text-red-500">*</span></label>
            <input
              v-model="editProductForm.price"
              type="number"
              step="0.01"
              min="0"
              class="input w-full border-black text-black bg-white"
            />
            <span v-if="editProductErrors.price" class="text-red-500 text-xs">{{
              editProductErrors.price
            }}</span>
          </div>
          <div>
            <label class="text-xs font-semibold"
              >Category <span class="text-red-500">*</span></label
            >
            <select
              v-model="editProductForm.category"
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
              v-model="editProductForm.unit"
              type="text"
              class="input w-full border-black text-black bg-white"
            />
            <span v-if="editProductErrors.unit" class="text-red-500 text-xs">{{
              editProductErrors.unit
            }}</span>
          </div>
          <div>
            <label class="text-xs font-semibold"
              >Max Quantity <span class="text-red-500">*</span></label
            >
            <input
              v-model="editProductForm.maxQuantity"
              type="number"
              min="0"
              class="input w-full border-black text-black bg-white"
            />
            <span v-if="editProductErrors.maxQuantity" class="text-red-500 text-xs">{{
              editProductErrors.maxQuantity
            }}</span>
          </div>
          <div>
            <label class="text-xs font-semibold"
              >Expiry Date <span class="text-red-500">*</span></label
            >
            <input
              v-model="editProductForm.expiryDate"
              type="date"
              class="input w-full border-black text-black bg-white"
            />
            <span v-if="editProductErrors.expiryDate" class="text-red-500 text-xs">{{
              editProductErrors.expiryDate
            }}</span>
          </div>
          <div>
            <label class="text-xs font-semibold"
              >Reason for Update <span class="text-red-500">*</span></label
            >
            <textarea
              v-model="editProductForm.reason"
              class="textarea w-full border-black text-black bg-white"
              rows="2"
            ></textarea>
            <span v-if="editProductErrors.reason" class="text-red-500 text-xs">{{
              editProductErrors.reason
            }}</span>
          </div>
          <div>
            <label class="text-xs font-semibold block mb-1">Product Image</label>
            <div class="flex items-center gap-4">
              <img
                v-if="editProductImagePreview"
                :src="editProductImagePreview"
                class="w-20 h-20 object-cover rounded border"
              />
              <input
                type="file"
                accept="image/*"
                @change="handleEditProductFileUpload"
                class="file-input file-input-bordered w-full max-w-xs"
              />
            </div>
          </div>
          <div class="flex justify-end gap-2 mt-4">
            <button class="btn-secondaryStyle px-6" @click="showEditModal = false">Cancel</button>
            <button class="btn-primaryStyle px-6" @click="submitEditProduct">Update Product</button>
          </div>
        </div>
      </div>
    </dialog>
  </div>
</template>
