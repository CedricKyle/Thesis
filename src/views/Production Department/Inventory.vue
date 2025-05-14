<template>
  <div class="min-h-screen">
    <!-- Tabs -->
    <div class="tabs bg-primaryColor text-white rounded-t-lg">
      <a class="tab tab-bordered tab-active px-6">Inventory</a>
    </div>

    <!-- Filter Section -->
    <div class="bg-white p-4 shadow rounded-b-lg">
      <div class="flex flex-wrap gap-4 items-end mb-4">
        <input type="text" v-model="filters.search" placeholder="Search" class="input input-bordered w-48" />
        <select class="select select-bordered w-48" v-model="filters.product">
          <option disabled selected>Product</option>
          <option>Drinks</option>
          <option>Sizzling</option>
          <option>Silog Meal</option>
          <option>Chicken Meal</option>
          <option>Steak</option>
        </select>
        <select class="select select-bordered w-48" v-model="filters.branch">
          <option disabled selected>Branch</option>
          <option>Branch 1</option>
          <option>Branch 2</option>
        </select>
        <button class="btn bg-primaryColor text-white" @click="applyFilter">Filter</button>
        <button class="btn bg-primaryColor text-white ml-auto" @click="openModal = true">+ Add Supplies</button>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto rounded shadow">
        <table class="table table-zebra w-full">
          <thead class="bg-primaryColor text-white">
            <tr>
              <th>Product Name</th>
              <th>Image</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Date Added</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="inventoryList.length === 0">
              <td colspan="8" class="text-center text-gray-500">No data available.</td>
            </tr>
            <tr v-for="(item, index) in inventoryList" :key="index">
              <td>{{ item.productName }}</td>
              <td>
                <img
                  v-if="item.imagePreview"
                  :src="item.imagePreview"
                  alt="Preview"
                  class="h-12 w-12 object-cover rounded border"
                />
                <span v-else class="text-gray-400">No image</span>
              </td>
              <td>{{ item.product }}</td>
              <td>{{ item.quantity }}</td>
              <td>{{ item.price | currency }}</td>
              <td>{{ item.dateAdded }}</td>
            </tr>
          </tbody>
        </table>
        <div class="flex justify-end p-2 bg-primaryColor text-white rounded-b">
          <label class="label cursor-pointer">
            <span class="label-text text-white mr-2">Show all</span>
            <input type="checkbox" class="toggle toggle-success" v-model="showAll" />
          </label>
        </div>
      </div>
    </div>

    <!-- Add Supplies Modal -->
    <dialog class="modal" :class="{ 'modal-open': openModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Add Supplies</h3>
        <form @submit.prevent="addSupply">
          <div class="space-y-3">
            <input
              v-model="form.productName"
              type="text"
              placeholder="Product Name"
              class="input input-bordered w-full"
            />

            <!-- Upload Image -->
            <input type="file" accept="image/*" @change="handleImageUpload" class="file-input file-input-bordered w-full" />
            <div v-if="form.imagePreview" class="mt-2">
              <img :src="form.imagePreview" alt="Preview" class="max-h-32 object-cover rounded border" />
            </div>

            <select v-model="form.product" class="select select-bordered w-full">
              <option disabled selected>Product</option>
              <option>Drinks</option>
              <option>Sizzling</option>
              <option>Silog Meal</option>
              <option>Chicken Meal</option>
              <option>Steak</option>
            </select>
            <input v-model="form.quantity" type="number" placeholder="Quantity" class="input input-bordered w-full" />
            
            <!-- Price Input -->
            <input
              v-model="form.price"
              type="number"
              placeholder="Price"
              class="input input-bordered w-full"
              step="0.01"
            />
          </div>

          <div class="modal-action">
            <button
              type="submit"
              class="btn bg-primaryColor text-white"
              :disabled="!isFormValid"
            >
              Save
            </button>

            <button type="button" class="btn" @click="openModal = false">Cancel</button>
          </div>
        </form>
      </div>
    </dialog>
  </div>
</template>


<script setup>
import { ref, computed } from 'vue'

// Define the inventory list
const inventoryList = ref([])

const filters = ref({
  search: '',
  product: '',
})

const showAll = ref(false)
const openModal = ref(false)

// Define the form to collect data
const form = ref({
  productName: '',
  product: '',
  quantity: '',
  price: '', // Add price field
  image: null,
  imagePreview: null,
})

// Validation: return true if all fields are filled
const isFormValid = computed(() =>
  form.value.productName.trim() &&
  form.value.product &&
  form.value.quantity &&
  form.value.price // Ensure price is also validated
)

// Apply filters for the inventory list
const applyFilter = () => {
  console.log('Filter applied', filters.value)
  // Add filtering logic here
}

// Handle image upload and preview
const handleImageUpload = (e) => {
  const file = e.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    form.value.image = file
    form.value.imagePreview = reader.result
  }
  reader.readAsDataURL(file)
}

// Add supply to the inventory
const addSupply = () => {
  if (!isFormValid.value) {
    alert('Please fill in all required fields.')
    return
  }

  // Get the current date
  const currentDate = new Date().toLocaleString()

  // Add the supply to the list with price and date added
  inventoryList.value.push({ 
    ...form.value, 
    dateAdded: currentDate 
  })

  // Reset form fields
  form.value = {
    productName: '',
    product: '',
    quantity: '',
    price: '',
    image: null,
    imagePreview: null,
  }
  
  openModal.value = false
}
</script>
