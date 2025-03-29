<script setup>
import { SquarePen, Trash2 } from 'lucide-vue-next'
defineProps({
  products: {
    type: Array,
    required: true,
    default: () => [],
  },
})

// Add a function to handle missing images
const getImageUrl = (img) => {
  return img || '/path/to/default-image.png' // Replace with your default image path
}
</script>

<template>
  <div class="overflow-x-auto bg-white">
    <table class="table">
      <!-- head -->
      <thead class="bg-primaryColor">
        <tr class="text-white">
          <th class="w-35">Id</th>
          <th class="w-80">Product Name</th>
          <th class="">Price</th>
          <th class="">Quantity</th>
          <th class="">Expiry Date</th>
          <th class="">Max Qty</th>
          <th class="">Status</th>
          <th class="w-30">Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="products.length === 0">
          <td colspan="8" class="text-center py-4 text-black">No products available</td>
        </tr>
        <tr v-for="product in products" :key="product.id" class="text-black border-b-gray-200">
          <th>
            <div class="flex justify-between items-center">
              <div class="">{{ product.id }}</div>

              <div class="w-10 h-10 rounded-sm overflow-hidden">
                <img
                  v-if="product.img"
                  :src="product.img"
                  class="w-full h-full object-cover"
                  :alt="product.name"
                />
                <div v-else class="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span class="text-gray-400 text-xs">No image</span>
                </div>
              </div>
            </div>
          </th>
          <td class="">
            {{ product.name }}
          </td>
          <td>₱{{ product.price }}</td>
          <td class="font-bold">{{ product.quantity }}</td>
          <td>{{ product.dateExpiry }}</td>
          <td class="font-bold">{{ product.maxQty }}</td>
          <td>
            <span
              :class="{
                'badge badge-success': Number(product.quantity) >= Number(product.maxQty * 0.5),
                'badge badge-warning':
                  Number(product.quantity) < Number(product.maxQty * 0.5) &&
                  Number(product.quantity) > 0,
                'badge badge-error': Number(product.quantity) === 0,
              }"
            >
              {{
                Number(product.quantity) >= Number(product.maxQty * 0.5)
                  ? 'In Stock'
                  : Number(product.quantity) > 0
                    ? 'Low Stock'
                    : 'No Stock'
              }}
            </span>
          </td>
          <td>
            <div class="flex gap-2">
              <button class="btn btn-sm bg-primaryColor border-none"><SquarePen class="" /></button>
              <button class="btn btn-sm btn-error"><Trash2 /></button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
