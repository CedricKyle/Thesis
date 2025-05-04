<script setup>
import { ref, computed } from 'vue'

const suppliers = ref([
  { id: 1, name: 'ABC Meats',          phone_number: '09171234567', location: 'Dasma, Bayan',     product: 'Pork Meat'        },
  { id: 2, name: 'Santos Beef Co.',    phone_number: '09281234567', location: 'General Trias',     product: 'Beef Meat'        },
  { id: 3, name: 'Rodriguez Oils',     phone_number: '09321234567', location: 'Imus',              product: 'Cooking Oil'      },
  { id: 4, name: 'Green Valley Farms', phone_number: '09181234567', location: 'Trece Martires',   product: 'Fresh Vegetables' },
  { id: 5, name: 'Golden Grain',       phone_number: '09291234567', location: 'Tanza',             product: 'White Rice'       },
  { id: 6, name: 'Spice World',        phone_number: '09301234567', location: 'Bacoor',            product: 'Herbs & Spices'   },
])

// Controls
const search        = ref('')             // filter by supplier name
const selectedTab   = ref('Meat')         // current category
const productFilter = ref('All')          // specific product within that category
const tabs          = ['Meat', 'Vegetable', 'Rice', 'Other']

// Helper to map a product into one of our tabs
const categorize = product => {
  const p = product.toLowerCase()
  if (p.includes('meat'))                 return 'Meat'
  if (p.includes('vegetable') || p.includes('veg')) return 'Vegetable'
  if (p.includes('rice'))                 return 'Rice'
  return 'Other'
}

// Build the list of products available in the active tab
const productsInCategory = computed(() => {
  const set = new Set()
  suppliers.value.forEach(s => {
    if (categorize(s.product) === selectedTab.value) {
      set.add(s.product)
    }
  })
  return ['All', ...Array.from(set).sort()]
})

// Final filtered list: must match tab, name search, and optional product filter
const filteredSuppliers = computed(() =>
  suppliers.value.filter(s => {
    if (categorize(s.product) !== selectedTab.value) return false
    if (search.value && !s.name.toLowerCase().includes(search.value.toLowerCase()))
      return false
    if (productFilter.value !== 'All' && s.product !== productFilter.value)
      return false
    return true
  })
)
</script>

<template>
  <div>
    <!-- Tab Navigation (no Ingredients) -->
    <nav class="bg-primaryColor text-white font-medium flex justify-around py-3">
      <button
        v-for="tab in tabs"
        :key="tab"
        @click="selectedTab = tab; productFilter = 'All';"
        :class="{ 'text-gray-300': selectedTab !== tab }"
      >
        {{ tab }}
      </button>
    </nav>

    <div class="w-full bg-white shadow-md rounded-md p-4 space-y-6">
      <!-- Search by Name & Product Filter -->
      <section class="flex gap-2">
        <input
          v-model="search"
          type="text"
          placeholder="Search by supplier name"
          class="input-search input-sm w-72"
        />
        <select
          v-model="productFilter"
          class="select input-sm w-48 bg-white border-primaryColor text-black"
        >
          <option
            v-for="prod in productsInCategory"
            :key="prod"
            :value="prod"
          >
            {{ prod }}
          </option>
        </select>
      </section>

      <!-- Results Table -->
      <section v-if="filteredSuppliers.length" class="overflow-x-auto">
        <h2 class="font-semibold text-black mb-2">{{ selectedTab }}</h2>
        <table class="table text-black w-full text-xs border border-gray-300 rounded-md">
          <thead class="bg-gray-100">
            <tr>
              <th>No.</th>
              <th>Name</th>
              <th>Contact No.</th>
              <th>Location</th>
              <th>Product</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="s in filteredSuppliers"
              :key="s.id"
              class="border-b"
            >
              <td>{{ s.id }}</td>
              <td>{{ s.name }}</td>
              <td>{{ s.phone_number }}</td>
              <td>{{ s.location }}</td>
              <td>{{ s.product }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- No Results -->
      <section v-else class="text-center py-8 text-gray-500">
        No suppliers found for “{{ selectedTab }}” matching your criteria.
      </section>
    </div>
  </div>
</template>
