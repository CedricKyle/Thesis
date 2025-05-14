<template>
  <div class="flex min-h-screen overflow-hidden">
    <!-- Main Content Area -->
    <div class="flex-1 p-6 bg-base-200 overflow-auto">
      <!-- Filter + Add Button -->
      <div class="flex flex-wrap items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-bold mb-2">Menu Categories</h2>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="category in categories"
              :key="category"
              class="btn btn-sm rounded-full"
              :class="{
                'bg-green-800 text-white': activeCategory === category,
                'bg-base-100': activeCategory !== category
              }"
              @click="activeCategory = category"
            >
              {{ category }}
            </button>
            <button @click="toggleSidebar" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-b">
            <
          </button>
          </div>
        </div>

      
      </div>

      <!-- Menu Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <div
          v-for="(item, index) in filteredMenuItems"
          :key="index"
          class="card shadow-xl bg-base-100"
        >
          <figure>
            <img :src="item.image" alt="food image" class="w-full h-60 object-cover" />
          </figure>
          <div class="card-body">
            <div class="flex justify-between items-center">
              <h2 class="card-title text-sm">{{ item.name }}</h2>
              <div
                class="badge"
                :class="item.stock > 0 ? 'badge-info' : 'badge-error'"
              >
                Stock: {{ item.stock }}
              </div>
            </div>
            <p class="text-m font-semibold">₱{{ item.price.toFixed(2) }}</p>
            <div class="card-actions justify-end">
              <div v-if="getOrder(item.name)">
                <div class="flex items-center gap-1">
                  <button class="btn btn-xs btn-error" @click="decrement(item.name)">-</button>
                  <span class="text-sm">{{ getOrder(item.name).qty }}</span>
                  <button class="btn btn-xs btn-success" @click="increment(item.name)">+</button>
                </div>
              </div>
              <button
                v-else
                class="btn btn-sm"
                :class="item.stock > 0 ? 'btn-success' : 'btn-disabled'"
                :disabled="item.stock <= 0"
                @click="addToOrder(item)"
              >
                Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Slide-in Sidebar -->
    <transition name="slide">
      <div
        v-if="showSidebar"
        class="right-0 top-0 w-[300px] h-full bg-white border-l border-gray-300 z-50 shadow-lg flex flex-col"
      >
        <div class="bg-green-800 text-white text-center p-3 font-semibold">
          Customer Orders
           <button @click="toggleSidebar" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-black">
            ✕
          </button>
        </div>

        <div class="flex-1 p-4 overflow-y-auto">
          <div v-for="(item, index) in orders" :key="index" class="mb-4 border-b pb-2">
            <div class="flex justify-between items-center">
              <div>
                <p class="font-bold">{{ item.name }}</p>
                <p class="text-sm text-gray-600">₱{{ item.price }}</p>
              </div>
              <div class="flex items-center gap-1">
                <button class="btn btn-xs btn-error" @click="decrement(item.name)">-</button>
                <span class="text-sm">{{ item.qty }}</span>
                <button class="btn btn-xs btn-success" @click="increment(item.name)">+</button>
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 border-t">
          <p class="font-bold">Total Cost: ₱{{ totalCost }}</p>
          <input v-model="payment" type="number" class="input input-sm w-full mt-2" placeholder="Enter payment" />

          <div class="grid grid-cols-2 gap-2 my-3">
            <button class="btn btn-sm bg-green-800 text-white">Dine In</button>
            <button class="btn btn-sm btn-disabled">Coming Soon</button>
          </div>

          <div class="grid grid-cols-3 gap-2 mb-3">
            <button v-for="n in keypad" :key="n" class="btn btn-sm" @click="addToInput(n)">
              {{ n }}
            </button>
            <button class="btn btn-sm btn-error" @click="clearInput">X</button>
            <button class="btn btn-sm btn-success" @click="submitPayment">Ok</button>
          </div>

          <button class="btn btn-sm btn-primary w-full">Process Order</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Menu, PlusCircle } from 'lucide-vue-next';
import food1 from '@/assets/Images/POS/food1.png';
import food2 from '@/assets/Images/POS/food2.png';
import food3 from '@/assets/Images/POS/food3.png';
import food4 from '@/assets/Images/POS/food4.png';
import food5 from '@/assets/Images/POS/food5.png';
import food6 from '@/assets/Images/POS/food6.png';
import food7 from '@/assets/Images/POS/food7.png';
import food8 from '@/assets/Images/POS/food8.png';
import food9 from '@/assets/Images/POS/food9.png';
import food10 from '@/assets/Images/POS/food10.png';

const showSidebar = ref(false);
const payment = ref('');
const orders = ref([]);

const totalCost = computed(() =>
  orders.value.reduce((sum, item) => sum + item.price * item.qty, 0)
);

const keypad = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '00'];

const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value;
};

const addToInput = (val) => {
  payment.value += val;
};

const clearInput = () => {
  payment.value = '';
};

const submitPayment = () => {
  alert('Payment Entered: ' + payment.value);
};

const getOrder = (name) => orders.value.find(order => order.name === name);

const increment = (name) => {
  const order = getOrder(name);
  const item = menuItems.find(m => m.name === name);
  if (order && item && item.stock > 0) {
    order.qty += 1;
    item.stock -= 1;
  }
};

const decrement = (name) => {
  const index = orders.value.findIndex(order => order.name === name);
  const item = menuItems.find(m => m.name === name);
  if (index !== -1 && item) {
    if (orders.value[index].qty > 1) {
      orders.value[index].qty -= 1;
      item.stock += 1;
    } else {
      item.stock += orders.value[index].qty;
      orders.value.splice(index, 1);
    }
  }
};

const addToOrder = (item) => {
  if (item.stock <= 0) return;
  const existing = getOrder(item.name);
  if (existing) {
    existing.qty += 1;
  } else {
    orders.value.push({ ...item, qty: 1 });
  }
  item.stock -= 1;
  if (!showSidebar.value) showSidebar.value = true;
};

const activeCategory = ref('All');
const categories = [
  'All',
  'All Time Favorites',
  'Drinks',
  'Sizzling',
  'Silog Meal',
  'Chicken Meal',
  'Gulay',
];

const menuItems = [
  { name: 'Tapsilog', image: food1, stock: 20, price: 150, category: 'Silog Meal' },
  { name: 'Porksilog', image: food2, stock: 20, price: 150, category: 'Silog Meal' },
  { name: 'Tocilog', image: food3, stock: 20, price: 150, category: 'Silog Meal' },
  { name: 'Pork Sisig', image: food4, stock: 20, price: 150, category: 'Sizzling' },
  { name: 'Sizzling Pusit', image: food5, stock: 20, price: 150, category: 'Sizzling' },
  { name: 'Tenderloin Steak', image: food6, stock: 20, price: 150, category: 'All Time Favorites' },
  { name: 'Sizzling T-Bone Steak', image: food7, stock: 20, price: 150, category: 'Sizzling' },
  { name: 'Sizzling Chicken Leg', image: food8, stock: 20, price: 150, category: 'Chicken Meal' },
  { name: 'Burger Steak', image: food9, stock: 0, price: 150, category: 'All Time Favorites' },
  { name: 'Sizzling Chicken Wings', image: food10, stock: 0, price: 150, category: 'Chicken Meal' },
];

const filteredMenuItems = computed(() => {
  if (activeCategory.value === 'All') return menuItems;
  return menuItems.filter(item => item.category === activeCategory.value);
});

const addMenuItem = () => {
  alert('Add Menu button clicked');
};
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