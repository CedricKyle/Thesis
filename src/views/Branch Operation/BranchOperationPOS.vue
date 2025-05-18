<script setup>
import { ref, computed } from 'vue'

const categories = [
  'All',
  'All Time Favorites',
  'Drinks',
  'Sizzling',
  'Silog Meal',
  'Chicken Meal',
  'Gulay',
]

const products = [
  { name: 'Tapsilog', price: 150, stock: 20, category: 'Silog Meal' },
  { name: 'Porksilog', price: 150, stock: 20, category: 'Silog Meal' },
  { name: 'Tocilog', price: 150, stock: 20, category: 'Silog Meal' },
  { name: 'Pork Sisig', price: 150, stock: 20, category: 'Sizzling' },
  { name: 'Sizzling Pusit', price: 150, stock: 20, category: 'Sizzling' },
  { name: 'Tenderloin Steak', price: 150, stock: 20, category: 'Sizzling' },
  { name: 'Sizzling T-Bone Steak', price: 150, stock: 20, category: 'Sizzling' },
  { name: 'Sizzling Chicken Leg', price: 150, stock: 20, category: 'Chicken Meal' },
  { name: 'Burger Steak', price: 150, stock: 0, category: 'All Time Favorites' },
  { name: 'Pork Steak', price: 150, stock: 20, category: 'All Time Favorites' },
  { name: 'Sizzling Beef Mushroom', price: 150, stock: 20, category: 'Sizzling' },
  { name: 'Sizzling Chicken Wings', price: 150, stock: 0, category: 'Chicken Meal' },
]

const selectedCategory = ref('All')
const orders = ref([])

const filteredProducts = computed(() => {
  if (selectedCategory.value === 'All') return products
  return products.filter((p) => p.category === selectedCategory.value)
})

function addToOrder(product) {
  if (product.stock === 0) return
  const found = orders.value.find((item) => item.name === product.name)
  if (found) {
    if (found.qty < product.stock) found.qty++
  } else {
    orders.value.push({ name: product.name, price: product.price, qty: 1, stock: product.stock })
  }
}

function increaseQty(item) {
  const prod = products.find((p) => p.name === item.name)
  if (item.qty < prod.stock) item.qty++
}

function decreaseQty(item) {
  if (item.qty > 1) {
    item.qty--
  } else {
    // Remove from order if qty is 1 and user clicks minus
    orders.value = orders.value.filter((o) => o.name !== item.name)
  }
}

function removeOrder(item) {
  orders.value = orders.value.filter((o) => o.name !== item.name)
}

const totalCost = computed(() => orders.value.reduce((sum, item) => sum + item.price * item.qty, 0))

const inputValue = computed(() => totalCost.value.toString())
</script>

<template>
  <div class="flex h-screen bg-[#e9e9f6] overflow-auto">
    <!-- Left: Product List -->
    <div class="flex-1 p-6">
      <!-- Categories -->
      <div class="flex gap-2 mb-4">
        <button
          v-for="cat in categories"
          :key="cat"
          class="px-4 py-2 rounded bg-[#5a7114] text-white font-semibold"
          :class="{ 'bg-[#466114]': cat === selectedCategory }"
          @click="selectedCategory = cat"
        >
          {{ cat }}
        </button>
      </div>
      <!-- Products Grid -->
      <div class="grid grid-cols-4 gap-4">
        <div
          v-for="prod in filteredProducts"
          :key="prod.name"
          class="bg-white rounded-lg shadow p-2 flex flex-col items-center relative"
        >
          <img
            src="https://via.placeholder.com/120x90?text=Image"
            alt="product"
            class="w-full h-24 object-cover rounded mb-2"
          />
          <span
            class="absolute top-2 left-2 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded"
            v-if="prod.stock > 0"
            >Stock: {{ prod.stock }}</span
          >
          <span
            class="absolute top-2 left-2 bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded"
            v-else
            >Stock: 0</span
          >
          <div class="font-bold text-lg text-center">{{ prod.name }}</div>
          <div class="text-black text-md mb-2">₱{{ prod.price.toFixed(2) }}</div>
          <button
            class="bg-[#466114] text-white px-4 py-1 rounded font-semibold"
            :disabled="prod.stock === 0"
            @click="addToOrder(prod)"
          >
            Order
          </button>
        </div>
      </div>
    </div>
    <!-- Right: Order Summary -->
    <div class="w-[400px] bg-white h-screen flex flex-col border-l border-gray-200">
      <div class="bg-[#466114] text-white text-lg font-bold p-4">Order Number #01</div>
      <div class="flex-1 p-4 flex flex-col">
        <div v-for="item in orders" :key="item.name" class="flex items-center justify-between mb-2">
          <div>
            <div class="font-semibold">{{ item.name }}</div>
            <div class="text-xs text-gray-500">₱{{ item.price.toFixed(2) }}</div>
          </div>
          <div class="flex items-center gap-2">
            <button
              class="bg-red-100 text-red-500 rounded-full w-6 h-6 flex items-center justify-center"
              @click="decreaseQty(item)"
            >
              -
            </button>
            <span class="font-bold">{{ item.qty }}</span>
            <button
              class="bg-green-100 text-green-500 rounded-full w-6 h-6 flex items-center justify-center"
              @click="increaseQty(item)"
              :disabled="item.qty >= item.stock"
            >
              +
            </button>
            <button
              class="ml-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
              @click="removeOrder(item)"
            >
              ×
            </button>
          </div>
        </div>
        <hr class="my-2" />
        <div class="flex justify-between items-center font-bold text-lg mb-2">
          <span>Total Cost:</span>
          <span>₱{{ totalCost.toFixed(2) }}</span>
        </div>
        <input
          class="w-full border rounded px-2 py-1 mb-2 text-right font-mono"
          :value="inputValue"
          readonly
        />
        <div class="flex gap-2 mb-2">
          <button class="flex-1 bg-[#466114] text-white py-2 rounded font-bold">Dine In</button>
          <button class="flex-1 bg-gray-200 text-gray-700 py-2 rounded font-bold">Take Out</button>
        </div>
        <!-- Keypad -->
        <div class="grid grid-cols-3 gap-2 mb-2">
          <button class="bg-gray-100 py-3 rounded font-bold text-lg">7</button>
          <button class="bg-gray-100 py-3 rounded font-bold text-lg">8</button>
          <button class="bg-gray-100 py-3 rounded font-bold text-lg">9</button>
          <button class="bg-gray-100 py-3 rounded font-bold text-lg">4</button>
          <button class="bg-gray-100 py-3 rounded font-bold text-lg">5</button>
          <button class="bg-gray-100 py-3 rounded font-bold text-lg">6</button>
          <button class="bg-gray-100 py-3 rounded font-bold text-lg">1</button>
          <button class="bg-gray-100 py-3 rounded font-bold text-lg">2</button>
          <button class="bg-gray-100 py-3 rounded font-bold text-lg">3</button>
          <button class="bg-gray-100 py-3 rounded font-bold text-lg">00</button>
          <button class="bg-gray-100 py-3 rounded font-bold text-lg">0</button>
          <button class="bg-green-500 text-white py-3 rounded font-bold text-lg">Ok</button>
        </div>
        <div class="flex gap-2">
          <button class="flex-1 bg-red-500 text-white py-2 rounded font-bold">X</button>
          <button class="flex-1 bg-[#466114] text-white py-2 rounded font-bold">
            Process Order
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add any custom styles here if needed */
</style>
