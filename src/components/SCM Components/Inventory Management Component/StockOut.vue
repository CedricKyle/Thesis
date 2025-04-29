<script setup>
import { ref, computed, watch } from 'vue'

// Mock data for products and reasons (replace with Pinia store/API later)
const products = ref([
  { id: 1, name: 'Beef Steak', unit: 'kg' },
  { id: 2, name: 'Potatoes', unit: 'kg' },
  { id: 3, name: 'Soy Sauce', unit: 'L' },
])
const reasons = ref(['Sales', 'Branch Transfer', 'Spoilage', 'Lost', 'Other'])

const form = ref({
  productId: '',
  quantity: '',
  unit: '',
  date: '',
  reason: '',
  remarks: '',
  document: null,
})

const formErrors = ref({})
const selectedProduct = computed(() =>
  products.value.find((p) => p.id === Number(form.value.productId)),
)

watch(
  () => form.value.productId,
  (val) => {
    if (val) {
      form.value.unit = selectedProduct.value?.unit || ''
    } else {
      form.value.unit = ''
    }
  },
)

const documentPreview = ref(null)
function handleFileUpload(e) {
  const file = e.target.files[0]
  form.value.document = file
  if (file && file.type.startsWith('image/')) {
    documentPreview.value = URL.createObjectURL(file)
  } else {
    documentPreview.value = null
  }
}
function removeDocument() {
  form.value.document = null
  documentPreview.value = null
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
  if (!form.value.quantity || isNaN(form.value.quantity) || Number(form.value.quantity) <= 0)
    errors.quantity = 'Valid quantity is required'
  if (!form.value.date) errors.date = 'Date is required'
  if (!form.value.reason) errors.reason = 'Reason is required'
  return errors
}

const showConfirmModal = ref(false)
function handleSubmit() {
  formErrors.value = validateForm()
  if (Object.keys(formErrors.value).length === 0) {
    showConfirmModal.value = true
  }
}
function confirmStockOut() {
  // TODO: Save to backend or Pinia store
  alert('Stock Out successful!\n' + JSON.stringify(form.value, null, 2))
  showConfirmModal.value = false
  // Reset form
  form.value = {
    productId: '',
    quantity: '',
    unit: '',
    date: '',
    reason: '',
    remarks: '',
    document: null,
  }
  documentPreview.value = null
}
</script>

<template>
  <div class="bg-white p-4 rounded-lg shadow-md text-black mx-auto">
    <h2 class="text-lg font-bold mb-4">Stock Out</h2>
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
      <!-- Quantity -->
      <div>
        <label class="text-xs font-semibold">Quantity <span class="text-red-500">*</span></label>
        <input
          v-model="form.quantity"
          type="number"
          min="1"
          class="input w-full border-black text-black bg-white"
        />
        <span v-if="formErrors.quantity" class="text-red-500 text-xs">{{
          formErrors.quantity
        }}</span>
      </div>
      <!-- Unit (auto-filled) -->
      <div>
        <label class="text-xs font-semibold">Unit</label>
        <input
          v-model="form.unit"
          type="text"
          class="input w-full border-black !text-black !bg-white"
          disabled
        />
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
        <select v-model="form.reason" class="select w-full border-black bg-white text-black">
          <option disabled value="">Select Reason</option>
          <option v-for="r in reasons" :key="r" :value="r">{{ r }}</option>
        </select>
        <span v-if="formErrors.reason" class="text-red-500 text-xs">{{ formErrors.reason }}</span>
      </div>
      <!-- Remarks -->
      <div class="col-span-2">
        <label class="text-xs font-semibold">Remarks</label>
        <textarea
          v-model="form.remarks"
          class="textarea w-full border-black text-black bg-white"
        ></textarea>
      </div>
      <!-- Upload Document (Consistent UI) -->
      <div class="col-span-2">
        <label class="text-xs font-semibold block mb-1">Upload Supporting Document</label>
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
          style="cursor: pointer; min-height: 150px"
        >
          <button
            v-if="form.document"
            @click.stop="removeDocument"
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
          <template v-if="!form.document">
            <span class="text-gray-400 text-center">
              Click to browse or<br />drag and drop your files
            </span>
          </template>
          <template v-else>
            <span class="text-xs text-gray-500 mb-2">{{ form.document.name }}</span>
            <div v-if="documentPreview" class="mt-2">
              <img :src="documentPreview" class="max-h-32 rounded border" />
            </div>
          </template>
        </div>
        <p class="text-xs text-gray-500 mt-1">* PDF or image files, max 5MB</p>
      </div>
      <!-- Submit Button -->
      <div class="flex justify-end col-span-2">
        <button class="btn-primaryStyle" @click="handleSubmit">Stock Out</button>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <dialog v-if="showConfirmModal" open class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-lg text-black">Confirm Stock Out</h3>
        <div class="divider"></div>
        <div class="py-4 text-black">
          <p>
            Are you sure you want to stock out <b>{{ form.quantity }}</b> {{ form.unit }} of
            <b>{{ selectedProduct?.name }}</b
            >?
          </p>
          <p v-if="form.reason">Reason: {{ form.reason }}</p>
          <p v-if="form.remarks">Remarks: {{ form.remarks }}</p>
        </div>
        <div class="modal-action flex justify-end gap-2">
          <button class="btn-secondaryStyle" @click="showConfirmModal = false">Cancel</button>
          <button class="btn-primaryStyle" @click="confirmStockOut">Confirm</button>
        </div>
      </div>
    </dialog>
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
