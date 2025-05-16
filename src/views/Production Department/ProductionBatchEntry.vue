<script setup>
import { ref, computed } from 'vue'

// Stepper state
const step = ref(1)
const totalSteps = 4

// Step 1: Raw Materials
const rawMaterials = ref([
  // Example: { item_code: '', item_name: '', available_qty: 0, used_qty: 0, unit: '' }
])
// TODO: Fetch SCM inventory and populate rawMaterials

// Step 2: Finished Goods
const finishedGoods = ref([
  // Example: { item_code: '', item_name: '', produced_qty: 0, unit: '', batch_no: '', expiry_date: '' }
])

// Step 3: Production Details
const productionDetails = ref({
  production_date: new Date().toISOString().split('T')[0],
  production_manager: '',
  remarks: '',
})

// Step 4: Review (computed)
const reviewData = computed(() => ({
  rawMaterials: rawMaterials.value.filter((rm) => rm.used_qty > 0),
  finishedGoods: finishedGoods.value.filter((fg) => fg.produced_qty > 0),
  productionDetails: productionDetails.value,
}))

function nextStep() {
  if (step.value < totalSteps) step.value++
}
function prevStep() {
  if (step.value > 1) step.value--
}
function submitProductionBatch() {
  // TODO: Submit the batch to backend/store
  alert('Production batch recorded!')
}
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
      <!-- TODO: Replace with dynamic table from SCM inventory -->
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
                class="input input-bordered w-24"
              />
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
          </tr>
        </thead>
        <tbody>
          <tr v-for="(fg, idx) in finishedGoods" :key="idx">
            <td>
              <input v-model="fg.item_name" class="input-search" />
            </td>
            <td>
              <input
                type="number"
                min="0"
                v-model.number="fg.produced_qty"
                class="input-search input-bordered"
              />
            </td>
            <td>
              <input v-model="fg.unit" class="input-search input-bordered" />
            </td>
            <td>
              <input v-model="fg.batch_no" class="input-search input-bordered" />
            </td>
            <td>
              <input type="date" v-model="fg.expiry_date" class="input-search input-bordered" />
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
          <!-- TODO: Populate with actual production managers -->
          <option value="manager1">John Doe</option>
          <option value="manager2">Jane Smith</option>
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
            {{ fg.item_name }}: {{ fg.produced_qty }} {{ fg.unit }} (Batch: {{ fg.batch_no }},
            Expiry: {{ fg.expiry_date }})
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
    </div>

    <!-- Navigation Buttons -->
    <div class="flex justify-between mt-6">
      <button class="btn-secondaryStyle btn-sm" @click="prevStep" :disabled="step === 1">
        Back
      </button>
      <button v-if="step < totalSteps" class="btn-primaryStyle btn-sm" @click="nextStep">
        Next
      </button>
      <button v-else class="btn btn-success" @click="submitProductionBatch">Confirm & Save</button>
    </div>
  </div>
</template>
