<script setup>
import { ref, computed, defineAsyncComponent } from 'vue'
import ProductForm from '@/components/Admin Components/Inventory Management/Inventory Tables/ProductForm.vue'
import { useInventoryStore } from '@/stores/inventory'
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

const inventoryStore = useInventoryStore()

const searchQuery = ref('')
const selectedCategory = ref('Food Products')
const showSuccessToast = ref(false)
const toastMessage = ref('')
const modal = ref(null)
const editConfirmModal = ref(null)
const updateConfirmModal = ref(null)
const productToEdit = ref(null)

// Computed property for current category component
const currentCategoryComponent = computed(() => {
  switch (selectedCategory.value) {
    case 'Dry Goods':
      return DryGoods
    case 'Wet Goods':
      return WetGoods
    default:
      return Foods
  }
})

// Computed property for filtered products
const filteredProducts = computed(() => {
  const query = searchQuery.value.toLowerCase()
  const products = inventoryStore.getProductsByCategory(selectedCategory.value)

  if (!query) return products

  return products.filter(
    (product) =>
      product.name.toLowerCase().includes(query) || product.id.toString().includes(query),
  )
})

// Default product data structure
const emptyProduct = {
  name: '',
  price: '',
  dateExpiry: '',
  quantity: '',
  maxQty: '',
  img: null,
}

// Product data for the form
const productData = ref({ ...emptyProduct })

// Modal handling functions
const toggleModal = () => {
  if (modal.value) {
    if (!modal.value.open) {
      productData.value = { ...emptyProduct }
      modal.value.showModal()
    } else {
      modal.value.close()
    }
  }
}

const closeModal = () => {
  modal.value?.close()
  productData.value = { ...emptyProduct }
}

// Product management functions
const handleEditProduct = (product) => {
  productToEdit.value = { ...product }
  editConfirmModal.value?.showModal()
}

const confirmEdit = () => {
  if (productToEdit.value) {
    productData.value = { ...productToEdit.value }
    editConfirmModal.value?.close()
    modal.value?.showModal()
    productToEdit.value = null
  }
}

const handleSubmit = (formData) => {
  try {
    if (formData.id) {
      productData.value = { ...formData }
      updateConfirmModal.value?.showModal()
    } else {
      inventoryStore.addProduct(formData, selectedCategory.value)
      showToast(`Product successfully added to ${selectedCategory.value}!`)
      closeModal()
    }
  } catch (error) {
    showToast(error.message)
  }
}

const proceedWithSubmit = () => {
  inventoryStore.updateProduct(productData.value, selectedCategory.value)
  showToast('Product updated successfully!')
  updateConfirmModal.value?.close()
  closeModal()
}

const handleDeleteProduct = (product) => {
  inventoryStore.deleteProduct(product, selectedCategory.value)
  showToast('Product deleted successfully!')
}

// Category update handler
const updateCategory = (value) => {
  selectedCategory.value = value
}

// Toast helper function
const showToast = (message) => {
  toastMessage.value = message
  showSuccessToast.value = true
  setTimeout(() => {
    showSuccessToast.value = false
  }, 3000)
}
</script>

<template>
  <div class="flex flex-col h-full w-full gap-5">
    <div class="action-container flex justify-between">
      <div class="search-field w-[280px]">
        <label class="input-search">
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
            <ProductForm
              :initial-data="productData"
              :is-edit="!!productData.id"
              @submit="handleSubmit"
              @cancel="closeModal"
            />
          </dialog>
        </div>
      </div>
    </div>

    <div class="table-container h-full">
      <component
        v-if="selectedCategory"
        :is="currentCategoryComponent"
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

  <dialog ref="editConfirmModal" class="modal">
    <div class="modal-box bg-white w-96">
      <p class="py-4 text-center text-black text-lg">
        Are you sure you want to edit <span class="font-bold">{{ productToEdit?.name }}</span
        >?
      </p>
      <div class="modal-action justify-center gap-4">
        <button class="btn bg-primaryColor border-none" @click="confirmEdit">Edit</button>
        <button class="btn bg-gray-400 border-none" @click="editConfirmModal?.close()">
          Cancel
        </button>
      </div>
    </div>
  </dialog>

  <dialog ref="updateConfirmModal" class="modal">
    <div class="modal-box bg-white w-96">
      <p class="py-4 text-center text-black text-lg">
        Are you sure you want to update this product?
      </p>
      <div class="modal-action justify-center gap-4">
        <button class="btn bg-primaryColor border-none" @click="proceedWithSubmit">Update</button>
        <button class="btn bg-gray-400 border-none" @click="updateConfirmModal?.close()">
          Cancel
        </button>
      </div>
    </div>
  </dialog>
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
