<script setup>
import { ref } from 'vue'
import branch1 from '@/assets/branch/branch1.png'
import branch2 from '@/assets/branch/branch2.png'
import branch3 from '@/assets/branch/branch3.png'
import branch4 from '@/assets/branch/branch4.png'

const searchQuery = ref('')

const stores = [
  {
    id: 1,
    name: 'Countryside Malihan Branch',
    image: branch2,
    phone: '(123) 456-7890',
    location: 'Malihan, Cavite'
  },
  {
    id: 2,
    name: 'Countryside Imus Branch',
    image: branch3,
    phone: '(123) 456-7891',
    location: 'Imus, Cavite'
  },
  {
    id: 3,
    name: 'Countryside Noveleta Branch',
    image: branch4,
    phone: '(123) 456-7892',
    location: 'Noveleta, Cavite'
  },
  {
    id: 4,
    name: 'Countryside Burol Main Branch',
    image: branch1,
    phone: '(123) 456-7893',
    location: 'Burol Main, Cavite'
  }
]
</script>

<template>
  <div class="p-8 w-full min-h-screen bg-primaryColor">
    <div class="header mt-15">
      <h1 class="text-4xl font-bold text-white mb-6">Store Directory</h1>
      <div class="max-w-md">
        <input 
          type="text"
          v-model="searchQuery"
          placeholder="Search Location"
          class="input input-bordered w-full rounded-full bg-white"
        />
      </div>
    </div>

    <div class="flex flex-col gap-8 mt-8">
      <div v-for="store in stores" :key="store.id" 
           class="flex shadow-xl bg-[#557F08] rounded-lg overflow-hidden hover:bg-opacity-30 transition-all">
        <div class="w-55 h-55 flex-shrink-0 flex items-center justify-center bg-opacity-20 rounded-2xl">
          <img 
            :src="store.image" 
            :alt="store.name" 
            class="max-w-full max-h-full object-contain"
          />
        </div>
        <div class="flex flex-col justify-center flex-1 px-8 mt-1">
          <h2 class="text-2xl font-bold text-white mb-4">{{ store.name }}</h2>
          <div class="flex flex-col gap-3">
            <div class="flex items-center gap-3">
              <i class="pi pi-phone text-xl text-white"></i>
              <span class="text-white text-lg">{{ store.phone }}</span>
            </div>
            <div class="flex items-center gap-3">
              <i class="pi pi-map-marker text-xl text-white"></i>
              <span class="text-white text-lg">{{ store.location }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Additional custom styles if needed */
.input::placeholder {
  color: #666;
}

@media (max-width: 768px) {
  .flex {
    flex-direction: column;
  }
  
  .w-96 {
    width: 100%;
  }
  
  .px-8 {
    padding: 1.5rem;
  }
}
</style>
