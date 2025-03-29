<script setup>
import { ref, computed, defineAsyncComponent, onMounted } from 'vue'
//tables
const Foods = defineAsyncComponent(
  () => import('@/components/Admin Components/Inventory Management/Inventory Tables/Foods.vue'),
)
const DryGoods = defineAsyncComponent(
  () => import('@/components/Admin Components/Inventory Management/Inventory Tables/DryGoods.vue'),
)
const WetGoods = defineAsyncComponent(
  () => import('@/components/Admin Components/Inventory Management/Inventory Tables/WetGoods.vue'),
)

import { ImagePlus } from 'lucide-vue-next'

const selectCategory = ref('Food Products')
const modal = ref(null)
const today = ref('')
const fileInput = ref(null)
const fileName = ref('')

// Add these new refs
const priceError = ref('')
const isPriceValid = ref(true)
const qtyError = ref('')
const maxQtyError = ref('')
const isQtyValid = ref(true)
const isMaxQtyValid = ref(true)
const showSuccessToast = ref(false)

// Add these new refs for category-specific products
const foodProducts = ref([])
const dryGoods = ref([])
const wetGoods = ref([])

// Add these refs for tracking IDs
const foodProductsId = ref(1)
const dryGoodsId = ref(1)
const wetGoodsId = ref(1)

// Add loading state
const isUploading = ref(false)

// Add search ref
const searchQuery = ref('')

// Add new ref for name validation
const nameError = ref('')
const isNameValid = ref(true)

// Add new ref for date validation
const dateError = ref('')
const isDateValid = ref(true)

onMounted(() => {
  today.value = new Date().toISOString().split('T')[0]
})

const updateCategory = (value) => {
  selectCategory.value = value
}

const selectedCategory = computed(() => {
  if (selectCategory.value === 'Dry Goods') return DryGoods
  if (selectCategory.value === 'Wet Goods') return WetGoods
  return Foods
})

const toggleModal = () => {
  if (modal.value) {
    if (!modal.value.open) {
      modal.value.showModal()
    } else {
      modal.value.close()
    }
  }
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (file) {
    isUploading.value = true
    fileName.value = file.name

    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        addProduct.value.img = e.target.result
        isUploading.value = false
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading file:', error)
      isUploading.value = false
    }
  } else {
    fileName.value = 'Attach a file...'
    addProduct.value.img = null
  }
}

const addProduct = ref({
  name: '',
  price: '',
  dateExpiry: '',
  quantity: '',
  maxQty: '',
  img: null,
})

const closeModal = () => {
  modal.value?.close()
}

const cancelForm = () => {
  // Reset the form
  addProduct.value = {
    name: '',
    price: '',
    dateExpiry: '',
    quantity: '',
    maxQty: '',
    img: null,
  }
  // Reset the filename display
  fileName.value = ''
  // Close the modal
  closeModal()
}

// Add validation function
const validatePrice = (value) => {
  const price = Number(value)
  if (isNaN(price)) {
    priceError.value = 'Price must be a number'
    isPriceValid.value = false
    return false
  }
  if (price < 0) {
    priceError.value = 'Price cannot be less than 0'
    isPriceValid.value = false
    return false
  }
  priceError.value = ''
  isPriceValid.value = true
  return true
}

// Add validation functions
const validateQty = (value) => {
  const qty = Number(value)
  if (isNaN(qty)) {
    qtyError.value = 'Quantity must be a number'
    isQtyValid.value = false
    return false
  }
  if (qty < 0) {
    qtyError.value = 'Quantity cannot be less than 0'
    isQtyValid.value = false
    return false
  }
  if (addProduct.value.maxQty && qty > Number(addProduct.value.maxQty)) {
    qtyError.value = 'Quantity cannot exceed Max Quantity'
    isQtyValid.value = false
    return false
  }
  qtyError.value = ''
  isQtyValid.value = true
  return true
}

const validateMaxQty = (value) => {
  const maxQty = Number(value)
  if (isNaN(maxQty)) {
    maxQtyError.value = 'Max Quantity must be a number'
    isMaxQtyValid.value = false
    return false
  }
  if (maxQty < 0) {
    maxQtyError.value = 'Max Quantity cannot be less than 0'
    isMaxQtyValid.value = false
    return false
  }
  // Revalidate quantity when max quantity changes
  if (addProduct.value.quantity) {
    validateQty(addProduct.value.quantity)
  }
  maxQtyError.value = ''
  isMaxQtyValid.value = true
  return true
}

// Add a ref for toast message
const toastMessage = ref('')

// Modify the submitProduct function to handle both add and edit
const submitProduct = () => {
  // Validate all fields before submitting
  const isValid =
    validateName(addProduct.value.name) &&
    validatePrice(addProduct.value.price) &&
    validateQty(addProduct.value.quantity) &&
    validateMaxQty(addProduct.value.maxQty) &&
    validateDate(addProduct.value.dateExpiry)

  if (!isValid) {
    return
  }

  // Check if we're editing (product has an ID) or adding new
  if (addProduct.value.id) {
    // Update existing product
    switch (selectCategory.value) {
      case 'Food Products':
        const foodIndex = foodProducts.value.findIndex((p) => p.id === addProduct.value.id)
        if (foodIndex !== -1) {
          foodProducts.value[foodIndex] = { ...addProduct.value }
        }
        break
      case 'Dry Goods':
        const dryIndex = dryGoods.value.findIndex((p) => p.id === addProduct.value.id)
        if (dryIndex !== -1) {
          dryGoods.value[dryIndex] = { ...addProduct.value }
        }
        break
      case 'Wet Goods':
        const wetIndex = wetGoods.value.findIndex((p) => p.id === addProduct.value.id)
        if (wetIndex !== -1) {
          wetGoods.value[wetIndex] = { ...addProduct.value }
        }
        break
    }
  } else {
    // Add new product (existing logic)
    let productId
    switch (selectCategory.value) {
      case 'Food Products':
        productId = foodProductsId.value++
        break
      case 'Dry Goods':
        productId = dryGoodsId.value++
        break
      case 'Wet Goods':
        productId = wetGoodsId.value++
        break
      default:
        console.error('Invalid category')
        return
    }

    const newProduct = {
      id: productId,
      ...addProduct.value,
      category: selectCategory.value,
    }

    switch (selectCategory.value) {
      case 'Food Products':
        foodProducts.value.push(newProduct)
        break
      case 'Dry Goods':
        dryGoods.value.push(newProduct)
        break
      case 'Wet Goods':
        wetGoods.value.push(newProduct)
        break
    }
  }

  closeModal()
  toastMessage.value = addProduct.value.id
    ? 'Product updated successfully!'
    : `Product successfully added to ${selectCategory.value}!`
  showSuccessToast.value = true
  setTimeout(() => {
    showSuccessToast.value = false
  }, 3000)

  // Reset form
  addProduct.value = {
    name: '',
    price: '',
    dateExpiry: '',
    quantity: '',
    maxQty: '',
    img: null,
  }
  fileName.value = ''
}

// Optional: Add a computed property to get current category's products
const currentCategoryProducts = computed(() => {
  switch (selectCategory.value) {
    case 'Food Products':
      return foodProducts.value
    case 'Dry Goods':
      return dryGoods.value
    case 'Wet Goods':
      return wetGoods.value
    default:
      return []
  }
})

const handleEditProduct = (product) => {
  // Ensure we're in the correct category for editing
  if (product.category !== selectCategory.value) {
    selectCategory.value = product.category
  }

  addProduct.value = { ...product }
  fileName.value = product.img ? 'Current Image' : ''
  modal.value?.showModal()
}

const handleDeleteProduct = (product) => {
  switch (product.category) {
    case 'Food Products':
      foodProducts.value = foodProducts.value.filter((p) => p.id !== product.id)
      break
    case 'Dry Goods':
      dryGoods.value = dryGoods.value.filter((p) => p.id !== product.id)
      break
    case 'Wet Goods':
      wetGoods.value = wetGoods.value.filter((p) => p.id !== product.id)
      break
  }

  // Add message type for different operations
  toastMessage.value = 'Product deleted successfully!'
  showSuccessToast.value = true
  setTimeout(() => {
    showSuccessToast.value = false
  }, 2000)
}

// Add computed property for filtered products
const filteredProducts = computed(() => {
  const query = searchQuery.value.toLowerCase()
  if (!query) return currentCategoryProducts.value

  return currentCategoryProducts.value.filter(
    (product) =>
      product.name.toLowerCase().includes(query) || product.id.toString().includes(query),
  )
})

// Add validation function
const validateName = (value) => {
  if (!value.trim()) {
    nameError.value = 'Product name is required'
    isNameValid.value = false
    return false
  }
  nameError.value = ''
  isNameValid.value = true
  return true
}

// Add validation function
const validateDate = (value) => {
  if (!value) {
    dateError.value = 'Expiry date is required'
    isDateValid.value = false
    return false
  }
  dateError.value = ''
  isDateValid.value = true
  return true
}
</script>

<template>
  <div class="flex flex-col h-full w-full gap-5">
    <div class="action-container flex justify-between">
      <div class="search-field w-[280px]">
        <label class="input !outline-non bg-primaryColor">
          <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <g
              stroke-linejoin=""
              stroke-linecap=""
              stroke-width="2.5"
              fill="none"
              stroke="currentColor"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </g>
          </svg>
          <input v-model="searchQuery" type="search" required placeholder="Search" />
        </label>
      </div>
      <div class="flex gap-2">
        <div class="categories">
          <select
            class="select bg-primaryColor text-white border-none cursor-pointer"
            @change="updateCategory($event.target.value)"
          >
            <!-- <option disabled selected>Select Category</option> -->
            <option value="Food Products">Food Products</option>
            <option value="Dry Goods">Dry Goods</option>
            <option value="Wet Goods">Wet Goods</option>
          </select>
        </div>

        <div class="add-products">
          <button class="select cursor-pointer bg-primaryColor border-none" @click="toggleModal">
            Add Product
          </button>
          <dialog ref="modal" class="modal">
            <div class="modal-box bg-white text-black">
              <h3 class="text-3xl font-bold pb-5">
                {{ addProduct.id ? `Name: ${addProduct.name}` : 'Product Details' }}
              </h3>
              <!--Input Product Here-->
              <div
                class="input-container grid grid-cols-2 justify-center items-center w-full gap-6"
              >
                <div class="col-span-2 input-field-container">
                  <label class="text-[15px]">Product Name</label>
                  <input
                    v-model="addProduct.name"
                    type="text"
                    placeholder="Type here"
                    class="input w-full !outline-none border"
                    :class="{
                      'border-primaryColor bg-white': isNameValid,
                      'border-red-500 bg-red-50': !isNameValid,
                    }"
                    @input="validateName($event.target.value)"
                  />
                  <div v-if="nameError" class="text-red-500 text-[10px] mt-1">
                    {{ nameError }}
                  </div>
                </div>

                <div class="input-field-container">
                  <label class="text-[15px]">Product Price</label>
                  <input
                    v-model="addProduct.price"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="₱"
                    class="input w-full !outline-none border"
                    :class="{
                      'border-primaryColor bg-white': isPriceValid,
                      'border-red-500 bg-red-50': !isPriceValid,
                    }"
                    @input="validatePrice($event.target.value)"
                  />
                  <div v-if="priceError" class="text-red-500 text-[10px] mt-1">
                    {{ priceError }}
                  </div>
                </div>

                <div class="input-field-container">
                  <label class="text-[15px]">Expiry Date</label>
                  <input
                    v-model="addProduct.dateExpiry"
                    :min="today"
                    type="date"
                    placeholder="0"
                    class="input w-full !outline-none border"
                    :class="{
                      'border-primaryColor bg-white': isDateValid,
                      'border-red-500 bg-red-50': !isDateValid,
                    }"
                    @input="validateDate($event.target.value)"
                  />
                  <div v-if="dateError" class="text-red-500 text-[10px] mt-1">
                    {{ dateError }}
                  </div>
                </div>

                <div class="input-field-container">
                  <label class="text-[15px]">Quantity</label>
                  <input
                    v-model="addProduct.quantity"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    class="input w-full !outline-none border"
                    :class="{
                      'border-primaryColor bg-white': isQtyValid,
                      'border-red-500 bg-red-50': !isQtyValid,
                    }"
                    @input="validateQty($event.target.value)"
                  />
                  <div v-if="qtyError" class="text-red-500 text-[10px] mt-1">
                    {{ qtyError }}
                  </div>
                </div>

                <div class="input-field-container">
                  <label class="text-[15px]">Max Quantity</label>
                  <input
                    v-model="addProduct.maxQty"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    class="input w-full !outline-none border"
                    :class="{
                      'border-primaryColor bg-white': isMaxQtyValid,
                      'border-red-500 bg-red-50': !isMaxQtyValid,
                    }"
                    @input="validateMaxQty($event.target.value)"
                  />
                  <div v-if="maxQtyError" class="text-red-500 text-[10px] mt-1">
                    {{ maxQtyError }}
                  </div>
                </div>

                <!-- Image Field-->
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
                      <template v-else-if="addProduct.img">
                        <img
                          :src="addProduct.img"
                          class="h-16 w-16 object-cover"
                          alt="this is img uploaded"
                        />
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
              <div class="modal-action">
                <form class="flex gap-4">
                  <button type="button" class="btn bg-gray-400 border-none" @click="cancelForm">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    class="btn bg-primaryColor border-none"
                    @click.prevent="submitProduct"
                  >
                    {{ addProduct.id ? 'Update Product' : 'Add Product' }}
                  </button>
                </form>
              </div>
            </div>
          </dialog>
        </div>
      </div>
    </div>

    <div class="table-container h-full">
      <component
        v-if="selectedCategory"
        :is="selectedCategory"
        :products="filteredProducts"
        @edit-product="handleEditProduct"
        @delete-product="handleDeleteProduct"
      />
    </div>
  </div>

  <Teleport to="body">
    <div v-if="showSuccessToast" class="toast toast-top toast-end">
      <div class="alert alert-success">
        <span>{{ toastMessage }}</span>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.input-field-container {
  min-height: 85px;
}

input[type='date']::-webkit-calendar-picker-indicator {
  filter: invert(0%) brightness(0%);
  cursor: pointer;
}
</style>
