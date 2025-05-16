<template>
  <div class="flex h-screen">
    <!-- Sidebar -->
    <aside class="w-20 bg-[#5a7114] flex flex-col items-center justify-between py-4">
      <!-- Logo -->
      <div>
        <img src="/countryside-logo.png" class="w-12 h-12 rounded-full" />
      </div>
      <!-- Nav Icons -->
      <nav class="flex-1 flex flex-col items-center gap-6 mt-8">
        <button class="text-white text-2xl"><i class="icon-dashboard"></i></button>
        <button class="text-white text-2xl"><i class="icon-cart"></i></button>
        <button class="text-white text-2xl"><i class="icon-box"></i></button>
        <button class="text-white text-2xl"><i class="icon-users"></i></button>
      </nav>
      <!-- Profile -->
      <div>
        <img src="https://randomuser.me/api/portraits/men/32.jpg" class="w-12 h-12 rounded-full" />
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col bg-[#f3f4fa]">
      <!-- Category Tabs -->
      <div class="flex gap-2 p-4">
        <button
          v-for="cat in categories"
          :key="cat"
          class="px-4 py-2 rounded bg-white text-gray-700 font-semibold shadow-sm"
        >
          {{ cat }}
        </button>
      </div>

      <div class="flex flex-1">
        <!-- Product Grid -->
        <div class="grid grid-cols-4 gap-4 p-4 flex-1">
          <div
            v-for="prod in products"
            :key="prod.id"
            class="bg-white rounded-lg shadow p-2 flex flex-col items-center"
          >
            <img :src="`/images/${prod.img}`" class="w-32 h-24 object-cover rounded" />
            <div class="mt-2 font-bold">{{ prod.name }}</div>
            <div class="text-green-700 text-xs mb-1">Stock: {{ prod.stock }}</div>
            <div class="font-bold text-lg mb-2">₱{{ prod.price.toFixed(2) }}</div>
            <button class="bg-[#5a7114] text-white px-4 py-1 rounded" :disabled="prod.stock === 0">
              Order
            </button>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="w-1/3 bg-white p-6 flex flex-col justify-between rounded-l-lg">
          <div>
            <div class="text-lg font-bold text-[#5a7114] mb-4">Order Number #01</div>
            <div
              v-for="item in orders"
              :key="item.id"
              class="flex justify-between items-center mb-2"
            >
              <div>
                <div class="font-semibold">{{ item.name }}</div>
                <div class="text-xs text-gray-500">₱{{ item.price.toFixed(2) }}</div>
              </div>
              <div class="flex items-center gap-2">
                <button class="bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center">
                  -
                </button>
                <span>{{ item.qty }}</span>
                <button class="bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center">
                  +
                </button>
              </div>
            </div>
            <hr class="my-4" />
            <div class="flex justify-between font-bold text-lg">
              <span>Total Cost:</span>
              <span>₱{{ orders.reduce((sum, o) => sum + o.price * o.qty, 0).toFixed(2) }}</span>
            </div>
            <input
              type="number"
              class="w-full border rounded px-2 py-1 mt-2"
              placeholder="Enter payment"
            />
            <div class="flex gap-2 mt-4">
              <button class="flex-1 bg-[#5a7114] text-white py-2 rounded">Dine In</button>
              <button class="flex-1 bg-gray-200 text-gray-700 py-2 rounded">Take Out</button>
            </div>
          </div>
          <!-- Keypad and Process Order -->
          <div>
            <div class="grid grid-cols-3 gap-2 my-4">
              <button class="bg-gray-100 py-2 rounded">7</button>
              <button class="bg-gray-100 py-2 rounded">8</button>
              <button class="bg-gray-100 py-2 rounded">9</button>
              <button class="bg-gray-100 py-2 rounded">4</button>
              <button class="bg-gray-100 py-2 rounded">5</button>
              <button class="bg-gray-100 py-2 rounded">6</button>
              <button class="bg-gray-100 py-2 rounded">1</button>
              <button class="bg-gray-100 py-2 rounded">2</button>
              <button class="bg-gray-100 py-2 rounded">3</button>
              <button class="bg-gray-100 py-2 rounded">0</button>
              <button class="bg-gray-100 py-2 rounded">00</button>
              <button class="bg-red-500 text-white py-2 rounded">X</button>
            </div>
            <button class="w-full bg-[#5a7114] text-white py-3 rounded font-bold">
              Process Order
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// You can import your icons, stores, and data here
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
  // Example data, replace with your real data
  { id: 1, name: 'Tapsilog', price: 150, stock: 20, img: 'tapsilog.jpg' },
  { id: 2, name: 'Porksilog', price: 150, stock: 20, img: 'porksilog.jpg' },
  // ... more products
]

const orders = [
  { id: 1, name: 'Pork Sisig', price: 150, qty: 2 },
  { id: 2, name: 'Pork Silog', price: 150, qty: 1 },
]
</script>

<style scoped>
.card-title {
  font-size: 1.3rem;
}
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}
.slide-enter-from {
  transform: translateX(100%);
}
.slide-leave-to {
  transform: translateX(100%);
}
</style>
