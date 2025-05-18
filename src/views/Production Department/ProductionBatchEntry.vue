<script setup>
import { ref, computed, onMounted } from 'vue'
import { useProductionBatchStore } from '@/stores/Production Store/productionBatchStore'
import Toast from '@/components/Admin Components/HR/Toast.vue'
import axios from 'axios'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'
import { storeToRefs } from 'pinia'
import {
  PERMISSION_IDS,
  DEPARTMENTS,
} from '@/composables/Admin Composables/User & Role/role/permissionsId'

// Stepper state
const step = ref(1)
const totalSteps = 4

const productionBatchStore = useProductionBatchStore()
const rawMaterials = ref([])
const finishedGoods = ref([
  // Example: { item_name: '', produced_qty: 0, unit: '', batch_no: '', expiry_date: '' }
])

// Step 3: Production Details
const productionDetails = ref({
  production_date: new Date().toISOString().split('T')[0],
  production_manager: '',
  remarks: '',
})

const toast = ref({
  show: false,
  message: '',
  type: 'info',
  customClass: '',
})

const finishedGoodsTouched = ref(false)
const showConfirmation = ref(false)

const employeeStore = useEmployeeStore()
const { employees } = storeToRefs(employeeStore)

const productionManagers = computed(() =>
  employees.value.filter(
    (emp) =>
      emp.department === DEPARTMENTS.PRODUCTION &&
      Array.isArray(emp.permissions) &&
      emp.permissions.includes(PERMISSION_IDS.PRODUCTION_FULL_ACCESS) &&
      !emp.deleted_at,
  ),
)

const existingFinishedGoods = ref([])

function showToast(message, type = 'info', customClass = '') {
  toast.value = { show: true, message, type, customClass }
  setTimeout(() => {
    toast.value.show = false
  }, 2500)
}

// Fetch raw materials from SCM inventory on mount
onMounted(async () => {
  try {
    const materials = await productionBatchStore.fetchRawMaterials()
    rawMaterials.value = materials.map((rm) => ({
      ...rm,
      used_qty: 0,
      available_qty: rm.quantity,
    }))
  } catch (e) {
    // Optionally handle error
  }
  await employeeStore.loadEmployees()
  // Fetch existing finished goods from your backend using the store
  try {
    const finishedGoodsList = await productionBatchStore.fetchFinishedGoods()
    existingFinishedGoods.value = finishedGoodsList.data
  } catch (e) {
    showToast('Failed to load finished goods list', 'error')
  }
})

// Step 4: Review (computed)
const reviewData = computed(() => ({
  rawMaterials: rawMaterials.value.filter((rm) => rm.used_qty > 0),
  finishedGoods: finishedGoods.value.filter((fg) => fg.produced_qty > 0),
  productionDetails: productionDetails.value,
}))

const hasInvalidQty = computed(() =>
  rawMaterials.value.some((rm) => rm.used_qty > rm.available_qty),
)

const hasInvalidFinishedGoods = computed(() =>
  finishedGoods.value.some(
    (fg) =>
      !fg.item_name ||
      !fg.produced_qty ||
      fg.produced_qty <= 0 ||
      (!fg.unit && fg.type !== 'Restock') ||
      (!fg.expiry_date && fg.type !== 'Restock') ||
      (!fg.image && fg.type !== 'Restock'),
  ),
)

// Add these new computed properties for step validation
const isStep1Valid = computed(() => {
  return rawMaterials.value.some((rm) => rm.used_qty > 0)
})

const isStep2Valid = computed(() => {
  return finishedGoods.value.length > 0 && !hasInvalidFinishedGoods.value
})

const isStep3Valid = computed(() => {
  return productionDetails.value.production_date && productionDetails.value.production_manager
})

function resetForm() {
  step.value = 1
  rawMaterials.value.forEach((rm) => (rm.used_qty = 0))
  finishedGoods.value = []
  productionDetails.value = {
    production_date: new Date().toISOString().split('T')[0],
    production_manager: '',
    remarks: '',
  }
  finishedGoodsTouched.value = false
}

function nextStep() {
  console.log('nextStep called, current step:', step.value)
  // Validate current step before proceeding
  if (step.value === 1 && !isStep1Valid.value) {
    showToast('Please select at least one raw material to use.', 'error')
    return
  }

  if (step.value === 2) {
    if (hasInvalidFinishedGoods.value) {
      finishedGoodsTouched.value = true
      showToast('Please fill in all required fields for finished goods (including image).', 'error')
      return
    }
    if (finishedGoods.value.length === 0) {
      showToast('Please add at least one finished good.', 'error')
      return
    }
  }

  if (step.value === 3 && !isStep3Valid.value) {
    showToast('Please fill in all required production details.', 'error')
    return
  }

  if (step.value < totalSteps) step.value++
}

function prevStep() {
  if (step.value > 1) step.value--
}

async function submitProductionBatch() {
  finishedGoodsTouched.value = true
  if (hasInvalidFinishedGoods.value) {
    showToast('Please fill in all required fields for finished goods (including image).', 'error')
    return
  }

  // Calculate batch-level primary/secondary stock
  let batchPrimaryStock = 0
  let batchSecondaryStock = 0

  // Build finished goods payload with FIFO logic
  const finishedGoodsPayload = finishedGoods.value.map((fg) => {
    const restock = fg.type === 'Restock'
    let expiryToUse = fg.expiry_date

    // If restock and no expiry provided, use earliest expiry from existing finished goods
    if (restock && !fg.expiry_date) {
      const existing = existingFinishedGoods.value.find((item) => item.item_name === fg.item_name)
      if (existing && existing.expiry_date) {
        expiryToUse = existing.expiry_date
      }
    }

    // Sum up for batch-level stocks
    if (restock) {
      batchSecondaryStock += fg.produced_qty
    } else {
      batchPrimaryStock += fg.produced_qty
    }

    return {
      item_name: fg.item_name,
      produced_qty: fg.produced_qty,
      unit: fg.unit,
      batch_no: fg.batch_no,
      expiry_date: expiryToUse,
      image: fg.image,
      is_restock: restock,
      primary_stock: restock ? 0 : fg.produced_qty,
      secondary_stock: restock ? fg.produced_qty : 0,
    }
  })

  // Prepare main payload
  const payload = {
    product_name: finishedGoods.value[0]?.item_name || '',
    primary_stock: batchPrimaryStock,
    secondary_stock: batchSecondaryStock,
    reorder_point: 10, // Set as needed or add input
    unit: finishedGoods.value[0]?.unit || '',
    production_date: productionDetails.value.production_date,
    expiry_date: finishedGoods.value[0]?.expiry_date || '',
    production_manager: productionDetails.value.production_manager,
    remarks: productionDetails.value.remarks,
    raw_materials: reviewData.value.rawMaterials.map((rm) => ({
      inventory_item_code: rm.item_code,
      quantity_used: rm.used_qty,
    })),
    finished_goods: finishedGoodsPayload,
  }

  try {
    await productionBatchStore.createBatch(payload)
    showConfirmation.value = true
  } catch (err) {
    showToast('Error: ' + (productionBatchStore.error || err.message), 'error')
  }
}

function isQtyInvalid(rm) {
  return rm.used_qty > rm.available_qty
}

const API_URL = import.meta.env.VITE_API_URL

function onImageChange(event, idx) {
  const file = event.target.files[0]
  if (!file) return
  const formData = new FormData()
  formData.append('image', file)
  axios
    .post('/api/production/batch-upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => {
      const backendUrl = `${API_URL}`
      finishedGoods.value[idx].image = backendUrl + res.data.imageUrl
      showToast('Image uploaded!', 'success')
    })
    .catch(() => {
      showToast('Image upload failed!', 'error')
    })
}

function removeImage(idx) {
  finishedGoods.value[idx].image = ''
}

function confirmAndReset() {
  resetForm()
  showConfirmation.value = false
}

function isRestock(itemName) {
  // Use the finished goods with batch info from the store
  return productionBatchStore.finishedGoods.some((item) => item.item_name === itemName)
}

const isRestockBatch = isRestock(finishedGoods.value[0]?.item_name)

const batchPrimaryStock = ref(0)
const batchSecondaryStock = ref(0)

function onRestockSelect(fg) {
  // Find the selected finished good details
  const selected = existingFinishedGoods.value.find((item) => item.item_name === fg.item_name)
  if (selected) {
    fg.unit = selected.unit
    fg.batch_no = selected.batch_no || '' // If you have batch_no in your data
    fg.expiry_date = selected.expiry_date || ''
    fg.image = selected.image || ''
  }
}

const totalPrimaryStock = computed(() =>
  finishedGoods.value.reduce(
    (sum, fg) => sum + (fg.type === 'New Stock' ? Number(fg.produced_qty) : 0),
    0,
  ),
)
const totalSecondaryStock = computed(() =>
  finishedGoods.value.reduce(
    (sum, fg) => sum + (fg.type === 'Restock' ? Number(fg.produced_qty) : 0),
    0,
  ),
)
</script>

<template>
  <div class="container mx-auto p-6 bg-white rounded shadow">
    <h2 class="text-xl font-bold mb-4 text-black">Production Batch Entry</h2>
    <!-- Stepper Navigation -->
    <ul class="steps w-full text-xs [--size:1rem] [--success:var(--color-primaryColor)] mb-6">
      <li
        class="step text-gray-400"
        :class="{ 'step-success': step >= 1, '!text-secondaryColor': step === 1 }"
      >
        Raw Materials
      </li>
      <li
        class="step text-gray-400"
        :class="{ 'step-success': step >= 2, '!text-secondaryColor': step === 2 }"
      >
        Finished Goods
      </li>
      <li
        class="step text-gray-400"
        :class="{ 'step-success': step >= 3, '!text-secondaryColor': step === 3 }"
      >
        Production Details
      </li>
      <li
        class="step text-gray-400"
        :class="{ 'step-success': step >= 4, '!text-secondaryColor': step === 4 }"
      >
        Review & Confirm
      </li>
    </ul>

    <!-- Step 1: Raw Materials -->
    <div v-if="step === 1">
      <h3 class="font-semibold mb-2 text-black">Select Raw Materials</h3>
      <table class="table w-full mb-4">
        <thead class="text-black text-xs">
          <tr>
            <th>Item Name</th>
            <th>Available</th>
            <th>Unit</th>
            <th>Quantity Used</th>
          </tr>
        </thead>
        <tbody class="text-xs text-black">
          <tr v-for="(rm, idx) in rawMaterials" :key="idx">
            <td>{{ rm.item_name }}</td>
            <td>{{ rm.available_qty }}</td>
            <td>{{ rm.unit }}</td>
            <td>
              <input
                type="number"
                min="0"
                :max="rm.available_qty"
                v-model.number="rm.used_qty"
                :class="[
                  'input-search input-bordered w-24',
                  isQtyInvalid(rm) ? 'border-red-500' : '',
                ]"
              />
              <div v-if="isQtyInvalid(rm)" class="text-xs text-red-600 mt-1">
                Quantity used exceeds available stock!
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Step 2: Finished Goods -->
    <div v-if="step === 2">
      <h3 class="font-semibold mb-2 text-black">Enter Finished/Semi-Finished Goods Produced</h3>
      <table class="table w-full mb-4">
        <thead class="text-black text-xs">
          <tr>
            <th>Item Name</th>
            <th>Quantity Produced</th>
            <th>Unit</th>
            <th>Batch No.</th>
            <th>Expiry Date</th>
            <th>Image</th>
            <th>Type</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(fg, idx) in finishedGoods" :key="idx">
            <td>
              <template v-if="fg.type === 'Restock'">
                <select
                  v-model="fg.item_name"
                  class="input-search input-bordered"
                  @change="onRestockSelect(fg)"
                >
                  <option value="">Select finished good</option>
                  <option
                    v-for="item in existingFinishedGoods"
                    :key="item.id"
                    :value="item.item_name"
                  >
                    {{ item.item_name }}
                  </option>
                </select>
              </template>
              <template v-else>
                <input
                  v-model="fg.item_name"
                  class="input-search"
                  placeholder="Type new finished good"
                />
              </template>
              <div v-if="finishedGoodsTouched && !fg.item_name" class="text-xs text-red-600">
                Product name required
              </div>
            </td>
            <td>
              <input
                type="number"
                min="0"
                v-model.number="fg.produced_qty"
                class="input-search input-bordered"
              />
              <div
                v-if="finishedGoodsTouched && (!fg.produced_qty || fg.produced_qty <= 0)"
                class="text-xs text-red-600"
              >
                Quantity required
              </div>
            </td>
            <td>
              <input
                v-model="fg.unit"
                class="input-search input-bordered"
                :disabled="fg.type === 'Restock'"
                placeholder="Unit"
              />
              <div v-if="finishedGoodsTouched && !fg.unit" class="text-xs text-red-600">
                Unit required
              </div>
            </td>
            <td>
              <input
                v-model="fg.batch_no"
                class="input-search input-bordered"
                :disabled="fg.type === 'Restock'"
                placeholder="Batch No."
              />
            </td>
            <td>
              <input
                type="date"
                v-model="fg.expiry_date"
                class="input-search input-bordered"
                :disabled="fg.type === 'Restock'"
              />
              <div v-if="finishedGoodsTouched && !fg.expiry_date" class="text-xs text-red-600">
                Expiry date required
              </div>
            </td>
            <td>
              <input
                type="file"
                class="text-black"
                accept="image/*"
                @change="onImageChange($event, idx)"
                :disabled="fg.type === 'Restock'"
              />
              <div
                v-if="finishedGoodsTouched && !fg.image && fg.type !== 'Restock'"
                class="text-xs text-red-600"
              >
                Image required
              </div>
              <div v-if="fg.image" class="relative mt-2" style="display: inline-block">
                <img
                  :src="fg.image"
                  alt="Preview"
                  style="
                    max-width: 80px;
                    max-height: 80px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                  "
                />
                <button
                  @click="removeImage(idx)"
                  type="button"
                  class="absolute top-0 right-0 bg-white rounded-full border border-gray-300 text-red-600"
                  style="
                    width: 20px;
                    height: 20px;
                    line-height: 18px;
                    font-size: 16px;
                    padding: 0;
                    cursor: pointer;
                  "
                  title="Remove image"
                  :disabled="fg.type === 'Restock'"
                >
                  ×
                </button>
              </div>
            </td>
            <td>
              <select
                v-model="fg.type"
                class="select select-xs bg-white border border-gray-300 text-black w-30"
              >
                <option value="New Stock">New Stock</option>
                <option value="Restock">Restock</option>
              </select>
            </td>
            <td>
              <button
                v-if="finishedGoods.length > 1"
                @click="finishedGoods.splice(idx, 1)"
                class="text-red-600 font-bold px-2"
                title="Remove"
                type="button"
              >
                ×
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="flex justify-end">
        <button
          class="btn-primaryStyle btn-sm"
          @click="
            finishedGoods.push({
              item_name: '',
              produced_qty: 0,
              unit: '',
              batch_no: '',
              expiry_date: '',
              image: '',
              type: 'New Stock',
            })
          "
        >
          + Add Finished Good
        </button>
      </div>
    </div>

    <!-- Step 3: Production Details -->
    <div v-if="step === 3">
      <h3 class="font-semibold mb-2 text-black">Production Details</h3>
      <div class="mb-2">
        <label class="block text-black text-xs font-bold">Production Date</label>
        <input
          type="date"
          v-model="productionDetails.production_date"
          class="input-search input-bordered"
        />
      </div>
      <div class="mb-2">
        <label class="block text-black text-xs font-bold">Production Manager</label>
        <select
          v-model="productionDetails.production_manager"
          class="select select-bordered w-full bg-white border border-black text-black"
        >
          <option value="">Select Production Manager</option>
          <option
            v-for="manager in productionManagers"
            :key="manager.employee_id"
            :value="manager.full_name"
          >
            {{ manager.full_name }}
          </option>
        </select>
      </div>
      <div class="mb-2">
        <label class="block text-black text-xs font-bold">Remarks</label>
        <textarea
          v-model="productionDetails.remarks"
          class="textarea bg-white border border-black text-black textarea-bordered w-full"
        ></textarea>
      </div>
    </div>

    <!-- Step 4: Review & Confirm -->
    <div v-if="step === 4">
      <h3 class="font-semibold mb-2 text-black">Review & Confirm</h3>
      <div class="text-black text-sm">
        <p class="text-gray-500">Raw Materials Used:</p>
        <ul>
          <li v-for="rm in reviewData.rawMaterials" :key="rm.item_name">
            {{ rm.item_name }}: {{ rm.used_qty }} {{ rm.unit }}
          </li>
        </ul>
      </div>
      <div class="text-black text-sm">
        <p class="text-gray-500">Finished Goods Produced:</p>
        <ul>
          <li v-for="fg in reviewData.finishedGoods" :key="fg.item_name">
            {{ fg.item_name }}: {{ fg.produced_qty }} {{ fg.unit }}
            <span v-if="fg.type === 'Restock'" class="badge badge-success ml-2">Restock</span>
            <span v-else class="badge badge-info ml-2">New Stock</span>
            (Batch: {{ fg.batch_no }}, Expiry: {{ fg.expiry_date }})
          </li>
        </ul>
      </div>
      <div class="text-black text-sm">
        <p class="text-gray-500">Production Details:</p>
        <div>
          <span class="text-gray-500">Date:</span>
          {{ reviewData.productionDetails.production_date }}
        </div>
        <div>
          <span class="text-gray-500">Produced By:</span>
          {{ reviewData.productionDetails.production_manager }}
        </div>
        <div>
          <span class="text-gray-500">Remarks:</span> {{ reviewData.productionDetails.remarks }}
        </div>
      </div>
      <div class="text-black text-sm mt-2">
        <p>
          <b>Total Primary Stock:</b> {{ totalPrimaryStock }}<br />
          <b>Total Secondary Stock:</b> {{ totalSecondaryStock }}
        </p>
      </div>
    </div>

    <!-- Navigation Buttons -->
    <div class="flex justify-between mt-6">
      <button class="btn-secondaryStyle btn-sm" @click="prevStep" :disabled="step === 1">
        Back
      </button>
      <button
        v-if="step < totalSteps"
        class="btn-primaryStyle btn-sm"
        @click="nextStep"
        :disabled="
          (step === 1 && !isStep1Valid) ||
          (step === 2 && !isStep2Valid) ||
          (step === 3 && !isStep3Valid)
        "
      >
        Next
      </button>
      <button
        v-else
        class="btn-primaryStyle btn-sm"
        @click="submitProductionBatch"
        :disabled="hasInvalidFinishedGoods"
      >
        Confirm & Save
      </button>
    </div>

    <Toast
      :show="toast.show"
      :message="toast.message"
      :type="toast.type"
      :customClass="toast.customClass"
    />

    <!-- Confirmation Modal -->
    <dialog v-if="showConfirmation" open class="modal z-50">
      <div class="modal-box bg-white text-black max-w-md">
        <h3 class="font-bold text-lg mb-2">Confirm Production Batch</h3>
        <div class="divider"></div>
        <p class="text-sm mb-4">Are you sure you want to save this production batch?</p>
        <div class="modal-action justify-center gap-4">
          <button class="btn-secondaryStyle" @click="showConfirmation = false">Cancel</button>
          <button class="btn-primaryStyle" @click="confirmAndReset">Confirm</button>
        </div>
      </div>
    </dialog>
  </div>
</template>
