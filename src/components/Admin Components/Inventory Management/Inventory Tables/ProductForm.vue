<script setup>
import { ref, defineProps, defineEmits, watch } from 'vue'
import { ImagePlus } from 'lucide-vue-next'
import * as validators from '@/utils/Admin Utils/Inventory/validators'

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({
      name: '',
      price: '',
      dateExpiry: '',
      quantity: '',
      maxQty: '',
      img: null,
    }),
  },
  isEdit: Boolean,
})

const emit = defineEmits(['submit', 'cancel'])
const confirmationModal = ref(null)
const formData = ref({ ...props.initialData })
const errors = ref({})
const fileInput = ref(null)
const fileName = ref('')
const isUploading = ref(false)

// Add watch for initialData changes
watch(
  () => props.initialData,
  (newData) => {
    formData.value = { ...newData }
  },
  { deep: true },
)

const validateForm = () => {
  const nameValidation = validators.validateName(formData.value.name)
  const priceValidation = validators.validatePrice(formData.value.price)
  const qtyValidation = validators.validateQuantity(formData.value.quantity, formData.value.maxQty)
  const maxQtyValidation = validators.validateMaxQuantity(formData.value.maxQty)
  const dateValidation = validators.validateDate(formData.value.dateExpiry)

  // Clear previous errors
  errors.value = {
    name: nameValidation.error,
    price: priceValidation.error,
    quantity: qtyValidation.error,
    maxQty: maxQtyValidation.error,
    dateExpiry: dateValidation.error,
  }

  // Additional validation to ensure both quantity and maxQty are provided
  if (!formData.value.quantity && !formData.value.maxQty) {
    errors.value.quantity = 'Quantity is required'
    errors.value.maxQty = 'Max quantity is required'
    return false
  }

  return !Object.values(errors.value).some((error) => error)
}

const handleSubmit = () => {
  if (validateForm()) {
    // Instead of emitting directly, show confirmation modal
    confirmationModal.value?.showModal()
  }
}

const confirmSubmit = () => {
  // Format the data
  const submissionData = {
    ...formData.value,
    quantity: Number(formData.value.quantity),
    maxQty: Number(formData.value.maxQty),
    price: Number(formData.value.price),
  }

  // Close the confirmation modal
  confirmationModal.value?.close()
  // Emit the submit event
  emit('submit', submissionData)
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (file) {
    isUploading.value = true
    fileName.value = file.name

    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        formData.value.img = e.target.result
        isUploading.value = false
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading file:', error)
      isUploading.value = false
    }
  } else {
    fileName.value = ''
    formData.value.img = null
  }
}
</script>

<template>
  <div class="modal-box bg-white text-black">
    <h3 class="text-3xl font-bold pb-5">
      {{ isEdit ? `Name: ${formData.name}` : 'Product Details' }}
    </h3>

    <div class="input-container grid grid-cols-2 justify-center items-center w-full gap-6">
      <!-- Product Name -->
      <div class="col-span-2 input-field-container">
        <label class="text-[15px]">Product Name</label>
        <input
          v-model="formData.name"
          type="text"
          placeholder="Type here"
          class="input w-full !outline-none border"
          :class="{
            'border-primaryColor bg-white': !errors.name,
            'border-red-500 bg-red-50': errors.name,
          }"
        />
        <div v-if="errors.name" class="text-red-500 text-[10px] mt-1">
          {{ errors.name }}
        </div>
      </div>

      <!-- Product Price -->
      <div class="input-field-container">
        <label class="text-[15px]">Product Price</label>
        <input
          v-model="formData.price"
          type="number"
          min="0"
          step="1"
          placeholder="₱"
          class="input w-full !outline-none border"
          :class="{
            'border-primaryColor bg-white': !errors.price,
            'border-red-500 bg-red-50': errors.price,
          }"
        />
        <div v-if="errors.price" class="text-red-500 text-[10px] mt-1">
          {{ errors.price }}
        </div>
      </div>

      <!-- Expiry Date -->
      <div class="input-field-container">
        <label class="text-[15px]">Expiry Date</label>
        <input
          v-model="formData.dateExpiry"
          :min="new Date().toISOString().split('T')[0]"
          type="date"
          class="input w-full !outline-none border"
          :class="{
            'border-primaryColor bg-white': !errors.dateExpiry,
            'border-red-500 bg-red-50': errors.dateExpiry,
          }"
        />
        <div v-if="errors.dateExpiry" class="text-red-500 text-[10px] mt-1">
          {{ errors.dateExpiry }}
        </div>
      </div>

      <!-- Quantity -->
      <div class="input-field-container">
        <label class="text-[15px]">Quantity</label>
        <input
          v-model="formData.quantity"
          type="number"
          min="0"
          step="1"
          required
          placeholder="0"
          class="input w-full !outline-none border"
          :class="{
            'border-primaryColor bg-white': !errors.quantity,
            'border-red-500 bg-red-50': errors.quantity,
          }"
        />
        <div v-if="errors.quantity" class="text-red-500 text-[10px] mt-1">
          {{ errors.quantity }}
        </div>
      </div>

      <!-- Max Quantity -->
      <div class="input-field-container">
        <label class="text-[15px]">Max Quantity</label>
        <input
          v-model="formData.maxQty"
          type="number"
          min="0"
          step="1"
          required
          placeholder="0"
          class="input w-full !outline-none border"
          :class="{
            'border-primaryColor bg-white': !errors.maxQty,
            'border-red-500 bg-red-50': errors.maxQty,
          }"
        />
        <div v-if="errors.maxQty" class="text-red-500 text-[10px] mt-1">
          {{ errors.maxQty }}
        </div>
      </div>

      <!-- Image Field -->
      <div class="col-span-2 flex flex-col">
        <label class="text-[15px]">Upload Image</label>
        <div
          class="relative flex items-center justify-center w-full h-20 border-dashed border-1 rounded-sm border-primaryColor bg-white px-4 cursor-pointer"
          @click="fileInput?.click()"
        >
          <span class="flex items-center">
            <template v-if="isUploading">
              <span class="loading loading-spinner"></span>
            </template>
            <template v-else-if="formData.img">
              <img :src="formData.img" class="h-16 w-16 object-cover" alt="uploaded image" />
              <span>{{ fileName }}</span>
            </template>
            <template v-else>
              <ImagePlus class="w-6 h-6 text-gray-500 mr-3" />
              <span>{{ fileName || 'Click to upload image' }}</span>
            </template>
          </span>
        </div>
        <input
          type="file"
          ref="fileInput"
          class="hidden"
          @change="handleFileUpload"
          accept="image/*"
        />
      </div>
    </div>

    <!-- Form Actions -->
    <div class="modal-action">
      <div class="flex gap-4">
        <button type="button" class="btn-secondaryStyle" @click="$emit('cancel')">Cancel</button>
        <button type="submit" class="btn-primaryStyle" @click.prevent="handleSubmit">
          {{ isEdit ? 'Update Product' : 'Add Product' }}
        </button>
      </div>
    </div>
  </div>

  <!-- Add Confirmation Modal -->
  <dialog ref="confirmationModal" class="modal">
    <div class="modal-box bg-white w-96">
      <h3 class="text-lg font-bold text-center text-black mb-4">Confirm Product Details</h3>

      <div class="space-y-3 text-black">
        <div class="flex justify-between">
          <span class="font-semibold">Product Name:</span>
          <span>{{ formData.name }}</span>
        </div>
        <div class="flex justify-between">
          <span class="font-semibold">Price:</span>
          <span>₱{{ formData.price }}</span>
        </div>
        <div class="flex justify-between">
          <span class="font-semibold">Quantity:</span>
          <span>{{ formData.quantity }}</span>
        </div>
        <div class="flex justify-between">
          <span class="font-semibold">Max Quantity:</span>
          <span>{{ formData.maxQty }}</span>
        </div>
        <div class="flex justify-between">
          <span class="font-semibold">Expiry Date:</span>
          <span>{{ formData.dateExpiry }}</span>
        </div>
      </div>

      <p class="py-4 text-center text-black">
        Are you sure you want to {{ isEdit ? 'update' : 'add' }} this product?
      </p>

      <div class="modal-action justify-center gap-4">
        <button class="btn-primaryStyle" @click="confirmSubmit">
          {{ isEdit ? 'Update' : 'Add' }}
        </button>
        <button class="btn-secondaryStyle" @click="confirmationModal?.close()">Cancel</button>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.input-field-container {
  min-height: 85px;
}
</style>
