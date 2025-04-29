<script setup>
import { ref, computed } from 'vue'

// Mock products (replace with Pinia store/API later)
const products = ref([
  { id: 1, name: 'Beef Steak', unit: 'kg', stock: 50 },
  { id: 2, name: 'Potatoes', unit: 'kg', stock: 100 },
  { id: 3, name: 'Soy Sauce', unit: 'L', stock: 20 },
])

// Mock adjustment history (replace with Pinia store/API later)
const adjustmentHistory = ref([
  {
    id: 1,
    product: 'Beef Steak',
    type: 'add',
    quantity: 5,
    unit: 'kg',
    date: '2024-06-01',
    reason: 'Inventory audit',
    remarks: 'Physical count matched',
    user: 'Admin',
    fileName: '',
  },
  {
    id: 2,
    product: 'Potatoes',
    type: 'set',
    quantity: 80,
    unit: 'kg',
    date: '2024-06-02',
    reason: 'Correction',
    remarks: 'Set to actual count',
    user: 'Kyle',
    fileName: '',
  },
])

const form = ref({
  productId: '',
  adjustmentType: 'add', // 'add', 'subtract', 'set'
  quantity: '',
  date: '',
  reason: '',
  remarks: '',
  user: '',
  file: null,
})

const formErrors = ref({})
const selectedProduct = computed(() =>
  products.value.find((p) => p.id === Number(form.value.productId)),
)

const filePreview = ref(null)
function handleFileUpload(e) {
  const file = e.target.files[0]
  form.value.file = file
  if (file && file.type.startsWith('image/')) {
    filePreview.value = URL.createObjectURL(file)
  } else {
    filePreview.value = null
  }
}
function removeFile() {
  form.value.file = null
  filePreview.value = null
}

const isDragging = ref(false)
const fileInput = ref(null)
function openFileDialog() {
  if (fileInput.value) fileInput.value.click()
}
function handleDrop(e) {
  e.preventDefault()
  isDragging.value = false
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    handleFileUpload({ target: { files: e.dataTransfer.files } })
  }
}
function handleDragOver(e) {
  e.preventDefault()
  isDragging.value = true
}
function handleDragLeave(e) {
  e.preventDefault()
  isDragging.value = false
}

function validateForm() {
  const errors = {}
  if (!form.value.productId) errors.productId = 'Product is required'
  if (!form.value.quantity || isNaN(form.value.quantity) || Number(form.value.quantity) < 0)
    errors.quantity = 'Valid quantity is required'
  if (!form.value.date) errors.date = 'Date is required'
  if (!form.value.reason) errors.reason = 'Reason is required'
  if (!form.value.user) errors.user = 'User/Encoder is required'
  return errors
}

const showConfirmModal = ref(false)
function handleSubmit() {
  formErrors.value = validateForm()
  if (Object.keys(formErrors.value).length === 0) {
    showConfirmModal.value = true
  }
}
function confirmAdjustment() {
  // Compute new stock for display (mock logic)
  let newStock = selectedProduct.value?.stock ?? 0
  const qty = Number(form.value.quantity)
  if (form.value.adjustmentType === 'add') newStock += qty
  else if (form.value.adjustmentType === 'subtract') newStock -= qty
  else if (form.value.adjustmentType === 'set') newStock = qty

  // Add to adjustment history (mock, replace with API/store)
  adjustmentHistory.value.unshift({
    id: Date.now(),
    product: selectedProduct.value?.name,
    type: form.value.adjustmentType,
    quantity: qty,
    unit: selectedProduct.value?.unit,
    date: form.value.date,
    reason: form.value.reason,
    remarks: form.value.remarks,
    user: form.value.user,
    fileName: form.value.file ? form.value.file.name : '',
  })

  // Reset form
  showConfirmModal.value = false
  form.value = {
    productId: '',
    adjustmentType: 'add',
    quantity: '',
    date: '',
    reason: '',
    remarks: '',
    user: '',
    file: null,
  }
  filePreview.value = null
}
</script>

<template>
  <div class="bg-white p-4 rounded-lg shadow-md text-black mx-auto">
    <h2 class="text-lg font-bold mb-4">Stock Adjustment</h2>
    <div class="grid grid-cols-2 gap-4">
      <!-- Product -->
      <div>
        <label class="text-xs font-semibold">Product <span class="text-red-500">*</span></label>
        <select v-model="form.productId" class="select w-full border-black bg-white text-black">
          <option disabled value="">Select Product</option>
          <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
        <span v-if="formErrors.productId" class="text-red-500 text-xs">{{
          formErrors.productId
        }}</span>
      </div>
      <!-- Current Stock (optional) -->
      <div>
        <label class="text-xs font-semibold">Current Stock</label>
        <input
          :value="selectedProduct ? selectedProduct.stock + ' ' + selectedProduct.unit : ''"
          type="text"
          class="input w-full border-black !text-black !bg-white"
          disabled
        />
      </div>
      <!-- Adjustment Type -->
      <div>
        <label class="text-xs font-semibold"
          >Adjustment Type <span class="text-red-500">*</span></label
        >
        <select
          v-model="form.adjustmentType"
          class="select w-full border-black bg-white text-black"
        >
          <option value="add">Add (+)</option>
          <option value="subtract">Subtract (–)</option>
          <option value="set">Set to (direct quantity)</option>
        </select>
      </div>
      <!-- Quantity -->
      <div>
        <label class="text-xs font-semibold">
          {{ form.adjustmentType === 'set' ? 'Set Stock To' : 'Quantity' }}
          <span class="text-red-500">*</span>
        </label>
        <input
          v-model="form.quantity"
          type="number"
          min="0"
          class="input w-full border-black text-black bg-white"
        />
        <span v-if="formErrors.quantity" class="text-red-500 text-xs">{{
          formErrors.quantity
        }}</span>
      </div>
      <!-- Date -->
      <div>
        <label class="text-xs font-semibold">Date <span class="text-red-500">*</span></label>
        <input
          v-model="form.date"
          type="date"
          class="input w-full border-black text-black bg-white"
        />
        <span v-if="formErrors.date" class="text-red-500 text-xs">{{ formErrors.date }}</span>
      </div>
      <!-- Reason -->
      <div>
        <label class="text-xs font-semibold">Reason <span class="text-red-500">*</span></label>
        <input
          v-model="form.reason"
          type="text"
          class="input w-full border-black text-black bg-white"
          placeholder="e.g. Inventory audit, correction, etc."
        />
        <span v-if="formErrors.reason" class="text-red-500 text-xs">{{ formErrors.reason }}</span>
      </div>
      <!-- User/Encoder -->
      <div>
        <label class="text-xs font-semibold"
          >User/Encoder <span class="text-red-500">*</span></label
        >
        <input
          v-model="form.user"
          type="text"
          class="input w-full border-black text-black bg-white"
          placeholder="Enter your name"
        />
        <span v-if="formErrors.user" class="text-red-500 text-xs">{{ formErrors.user }}</span>
      </div>
      <!-- File Upload -->
      <div class="col-span-2">
        <label class="text-xs font-semibold block mb-1">Upload Proof/Audit Photo</label>
        <div
          class="relative flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 transition-colors"
          :class="{
            'border-primaryColor bg-primaryColor/10': isDragging,
            'border-gray-300 bg-gray-50': !isDragging,
          }"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
          @drop="handleDrop"
          @click="openFileDialog"
          style="cursor: pointer; min-height: 120px"
        >
          <button
            v-if="form.file"
            @click.stop="removeFile"
            class="absolute top-2 right-2 text-red-500 hover:text-red-600 text-md cursor-pointer"
            title="Remove file"
          >
            ×
          </button>
          <input
            ref="fileInput"
            type="file"
            accept=".pdf,image/*"
            class="hidden"
            @change="handleFileUpload"
          />
          <template v-if="!form.file">
            <span class="text-gray-400 text-center">
              Click to browse or<br />drag and drop your files
            </span>
          </template>
          <template v-else>
            <span class="text-xs text-gray-500 mb-2">{{ form.file.name }}</span>
            <div v-if="filePreview" class="mt-2">
              <img :src="filePreview" class="max-h-24 rounded border" />
            </div>
          </template>
        </div>
        <p class="text-xs text-gray-500 mt-1">* PDF or image files, max 5MB</p>
      </div>
      <!-- Remarks -->
      <div class="col-span-2">
        <label class="text-xs font-semibold">Remarks</label>
        <textarea
          v-model="form.remarks"
          class="textarea w-full border-black text-black bg-white"
        ></textarea>
      </div>
      <!-- Submit Button -->
      <div class="flex justify-end col-span-2">
        <button class="btn-primaryStyle" @click="handleSubmit">Adjust Stock</button>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <dialog v-if="showConfirmModal" open class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-lg text-black">Confirm Stock Adjustment</h3>
        <div class="divider"></div>
        <div class="py-4 text-black">
          <p>
            Are you sure you want to
            <b>
              {{
                form.adjustmentType === 'add'
                  ? 'add'
                  : form.adjustmentType === 'subtract'
                    ? 'subtract'
                    : 'set'
              }}
            </b>
            <b>{{ form.quantity }}</b>
            <b>{{ selectedProduct?.unit }}</b>
            to
            <b>{{ selectedProduct?.name }}</b
            >?
          </p>
          <p v-if="form.reason">Reason: {{ form.reason }}</p>
          <p v-if="form.remarks">Remarks: {{ form.remarks }}</p>
          <p v-if="form.user">User: {{ form.user }}</p>
          <p v-if="form.file">File: {{ form.file.name }}</p>
        </div>
        <div class="modal-action flex justify-end gap-2">
          <button class="btn-secondaryStyle" @click="showConfirmModal = false">Cancel</button>
          <button class="btn-primaryStyle" @click="confirmAdjustment">Confirm</button>
        </div>
      </div>
    </dialog>

    <!-- Adjustment History Table -->
    <div class="mt-8">
      <h3 class="font-semibold mb-2">Adjustment History</h3>
      <table class="w-full text-xs border">
        <thead>
          <tr class="bg-gray-100">
            <th class="p-2 border">Date</th>
            <th class="p-2 border">Product</th>
            <th class="p-2 border">Type</th>
            <th class="p-2 border">Qty</th>
            <th class="p-2 border">Unit</th>
            <th class="p-2 border">Reason</th>
            <th class="p-2 border">Remarks</th>
            <th class="p-2 border">User</th>
            <th class="p-2 border">File</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="adj in adjustmentHistory" :key="adj.id">
            <td class="p-2 border">{{ adj.date }}</td>
            <td class="p-2 border">{{ adj.product }}</td>
            <td class="p-2 border">{{ adj.type }}</td>
            <td class="p-2 border">{{ adj.quantity }}</td>
            <td class="p-2 border">{{ adj.unit }}</td>
            <td class="p-2 border">{{ adj.reason }}</td>
            <td class="p-2 border">{{ adj.remarks }}</td>
            <td class="p-2 border">{{ adj.user }}</td>
            <td class="p-2 border">
              <span v-if="adj.fileName">{{ adj.fileName }}</span>
              <span v-else>-</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.border-primaryColor {
  border-color: #466114 !important;
}
.bg-primaryColor\/10 {
  background-color: rgba(70, 97, 20, 0.1) !important;
}
</style>
