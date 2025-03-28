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

import { ChevronDown, Plus, ImagePlus } from 'lucide-vue-next'

const selectCategory = ref('Food Products')
const modal = ref(null)
const today = ref('')

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

const fileInput = ref(null)
const fileName = ref('')

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  fileName.value = file ? file.name : 'Attach a file...'
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
          <input type="search" required placeholder="Search" />
        </label>
      </div>
      <div class="flex gap-2">
        <div class="categories">
          <select
            class="select bg-primaryColor text-white border-none cursor-pointer"
            @change="updateCategory($event.target.value)"
          >
            <option disabled selected>Select Category</option>
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
              <h3 class="text-3xl font-bold pb-5">Product Details</h3>
              <!--Input Product Here-->
              <div
                class="input-container grid grid-cols-2 justify-center items-center w-full gap-6"
              >
                <div class="col-span-2 flex flex-col">
                  <label class="text-[15px]">Produc Name</label>
                  <input
                    type="text"
                    placeholder="Type here"
                    class="input w-full !outline-none border border-primaryColor bg-white"
                  />
                </div>

                <div class="flex flex-col">
                  <label class="text-[15px]">Product Price</label>
                  <input
                    type="text"
                    placeholder="₱"
                    class="input w-full !outline-none border border-primaryColor bg-white"
                  />
                </div>

                <div class="flex flex-col">
                  <label class="text-[15px]">Expiry Date</label>
                  <input
                    :min="today"
                    type="date"
                    placeholder="0"
                    class="input w-full !outline-none border border-primaryColor bg-white"
                  />
                </div>

                <div class="flex flex-col">
                  <label class="text-[15px]">Quantity</label>
                  <input
                    type="number"
                    placeholder="0"
                    class="input w-full !outline-none border border-primaryColor bg-white"
                  />
                </div>

                <div class="flex flex-col">
                  <label class="text-[15px]">Max Quantity</label>
                  <input
                    type="number"
                    placeholder="0"
                    class="input w-full !outline-none border border-primaryColor bg-white"
                  />
                </div>

                <!-- Image Field-->
                <div class="col-span-2 flex flex-col">
                  <label class="text-[15px]">Upload Image</label>
                  <div
                    class="relative flex items-center justify-center w-full h-20 border-dashed border-1 rounded-sm border-primaryColor bg-white px-4 cursor-pointer"
                    @click="fileInput?.click()"
                  >
                    <span class="flex items-center">
                      <template v-if="fileName">{{ fileName }}</template>
                      <template v-else>
                        <ImagePlus class="w-6 h-6 text-gray-500" />
                      </template>
                    </span>
                  </div>
                  <input type="file" ref="fileInput" class="hidden" @change="handleFileUpload" />
                </div>
              </div>
              <div class="modal-action">
                <!-- if there is a button in form, it will close the modal -->
                <button class="btn bg-gray-400 border-none" @click="modal?.close()">Close</button>
                <button class="btn bg-primaryColor border-none">Add Product</button>
              </div>
            </div>
          </dialog>
        </div>
      </div>
    </div>

    <div class="table-container h-full">
      <component v-if="selectedCategory" :is="selectedCategory" />
    </div>
  </div>
</template>

<style scoped>
input[type='date']::-webkit-calendar-picker-indicator {
  filter: invert(0%) brightness(0%);
  cursor: pointer;
}
</style>
