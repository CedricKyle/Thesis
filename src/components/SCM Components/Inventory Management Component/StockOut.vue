<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useInventoryStore } from '@/stores/SCM Stores/scmInventoryStores.js'

const store = useInventoryStore()
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const products = computed(() => store.products)
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
  if (
    selectedProduct.value &&
    Number(form.value.quantity) > Number(selectedProduct.value.quantity)
  ) {
    errors.quantity = `Cannot stock out more than current stock (${selectedProduct.value.quantity})`
  }
  if (!form.value.date) errors.date = 'Date is required'
  if (!form.value.reason) errors.reason = 'Reason is required'
  return errors
}

const showConfirmModal = ref(false)
function handleSubmit() {
  errorMessage.value = ''
  successMessage.value = ''
  formErrors.value = validateForm()
  if (Object.keys(formErrors.value).length === 0) {
    showConfirmModal.value = true
  }
}

async function confirmStockOut() {
  try {
    isLoading.value = true
    errorMessage.value = ''
    successMessage.value = ''

    const fd = new FormData()
    fd.append('product_id', form.value.productId)
    fd.append('quantity', form.value.quantity)
    fd.append('unit', form.value.unit)
    fd.append('date', form.value.date)
    fd.append('reason', form.value.reason)
    fd.append('remarks', form.value.remarks)
    if (form.value.document) fd.append('document', form.value.document)

    await store.createStockOut(fd)
    successMessage.value = 'Stock out recorded successfully'
    showConfirmModal.value = false

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
  } catch (err) {
    errorMessage.value =
      err.response?.data?.message || 'An error occurred while recording stock out'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  store.fetchProducts()
})
</script>

<template>
  <div class="bg-white p-4 rounded-lg shadow-md text-black mx-auto">
    <h2 class="text-lg font-bold mb-4">Stock Out</h2>

    <div
      v-if="errorMessage"
      class="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4"
    >
      {{ errorMessage }}
    </div>
    <div
      v-if="successMessage"
      class="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded mb-4"
    >
      {{ successMessage }}
    </div>

    <div class="grid grid-cols-2 gap-4">
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

      <div>
        <label class="text-xs font-semibold">Current Stock</label>
        <input
          :value="selectedProduct ? selectedProduct.quantity + ' ' + selectedProduct.unit : ''"
          type="text"
          class="input w-full border-black !text-black !bg-white"
          disabled
        />
      </div>

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

      <div>
        <label class="text-xs font-semibold">Unit</label>
        <input
          v-model="form.unit"
          type="text"
          class="input w-full border-black !text-black !bg-white"
          disabled
        />
      </div>

      <div>
        <label class="text-xs font-semibold">Date <span class="text-red-500">*</span></label>
        <input
          v-model="form.date"
          type="date"
          class="input w-full border-black text-black bg-white"
        />
        <span v-if="formErrors.date" class="text-red-500 text-xs">{{ formErrors.date }}</span>
      </div>

      <div>
        <label class="text-xs font-semibold">Reason <span class="text-red-500">*</span></label>
        <select v-model="form.reason" class="select w-full border-black bg-white text-black">
          <option disabled value="">Select Reason</option>
          <option v-for="r in reasons" :key="r" :value="r">{{ r }}</option>
        </select>
        <span v-if="formErrors.reason" class="text-red-500 text-xs">{{ formErrors.reason }}</span>
      </div>

      <div class="col-span-2">
        <label class="text-xs font-semibold">Remarks</label>
        <textarea
          v-model="form.remarks"
          class="textarea w-full border-black text-black bg-white"
        ></textarea>
      </div>

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

      <div class="flex justify-end col-span-2">
        <button class="btn-primaryStyle" @click="handleSubmit" :disabled="isLoading">
          {{ isLoading ? 'Processing...' : 'Stock Out' }}
        </button>
      </div>
    </div>

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
          <button
            class="btn-secondaryStyle"
            @click="showConfirmModal = false"
            :disabled="isLoading"
          >
            Cancel
          </button>
          <button class="btn-primaryStyle" @click="confirmStockOut" :disabled="isLoading">
            {{ isLoading ? 'Processing...' : 'Confirm' }}
          </button>
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
