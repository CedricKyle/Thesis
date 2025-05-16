<template>
  <!-- Loader screen after login -->
  <div v-if="showLoader" class="fixed inset-0 bg-primaryColor flex flex-col items-center justify-center z-50">
    <!-- Loading spinner -->
    <div v-if="loading" class="flex flex-col items-center gap-3">
      <span class="loading loading-spinner loading-lg text-white"></span>
    </div>
    <!-- Welcome logo -->
    <div v-else class="flex flex-col items-center gap-2">
      <img src="@/assets/logo1.png" alt="Logo" class="h-60 w-auto" />
      <span class="loading loading-spinner text-success"></span>
    </div>
  </div>

  <div class="relative w-full">
    <!-- Hero Section -->
    <div class="relative">
      <img
        src="@/assets/background1.png"
        alt="Background"
        class="w-full h-auto object-cover shadow-xl transition-opacity duration-2000"
      />
      <div class="absolute inset-0 flex flex-col items-center justify-center space-y-6 px-4">
        <p class="font-poppins text-white text-3xl font-bold text-center">
          Welcome to Countryside Steakhouse
        </p>
        <div class="flex flex-wrap justify-center gap-4">
          <router-link to="/menu" class="px-6 py-3 rounded-[28px] font-bold bg-[#F68920] text-white shadow-lg hover:bg-orange-300 transition">
            Menu View
          </router-link>
          <router-link to="/store-directory" class="px-6 py-3 rounded-[28px] bg-white font-bold text-[#466114] shadow-lg hover:bg-gray-200 transition">
            Store View
          </router-link>
        </div>
      </div>
    </div>

    <!-- "Check our menu!" Divider -->
    <div class="bg-[#466114] text-white py-6">
      <div class="flex items-center justify-center space-x-4 w-full px-4">
        <div
          class="h-5 flex-1 max-w-[200px] md:max-w-[300px] lg:max-w-[550px] bg-gray-300 rounded-[28px] bg-cover bg-center"
          style="background-image: url('@/assets/rectangle.png');"
        ></div>
        <h2 class="text-2xl md:text-3xl font-bold text-center">Check our menu!</h2>
        <div
          class="h-5 flex-1 max-w-[200px] md:max-w-[300px] lg:max-w-[550px] bg-gray-300 rounded-[28px] bg-cover bg-center"
          style="background-image: url('@/assets/rectangle.png');"
        ></div>
      </div>

      <!-- Auto-advancing Carousel -->
      <div class="relative overflow-hidden py-8">
        <div
          class="flex transition-transform duration-500 ease-in-out"
          :style="{ transform: `translateX(-${currentIndex * (100 / slides.length)}%)` }"
        >
          <router-link
            v-for="(slide, idx) in slides"
            :key="idx"
            class="flex-shrink-0 w-full md:w-[600px] px-2"
            to="/menu"
          >
            <img
              :src="slide"
              alt="Menu slide"
              class="h-auto w-full object-cover rounded-[28px] transition-all duration-300 ease-in-out transform hover:scale-105 hover:opacity-80"
            />
          </router-link>
        </div>
        <div class="flex justify-center mt-4 space-x-2">
          <span
            v-for="(_, idx) in slides"
            :key="idx"
            class="w-3 h-3 rounded-full cursor-pointer"
            :class="currentIndex === idx ? 'bg-white' : 'bg-white/50'"
            @click="goTo(idx)"
          ></span>
        </div>
      </div>
    </div>

    <!-- "Our Stores!" Divider -->
    <div class="bg-[#466114] text-white py-5">
      <div class="flex flex-col md:flex-row items-center justify-center space-x-0 md:space-x-4 w-full px-4">
        <h2 class="text-2xl md:text-3xl font-bold text-center">Our Stores!</h2>
        <div
          class="h-5 flex-1 max-w-[200px] md:max-w-[1200px] bg-gray-300 rounded-[28px] bg-cover bg-center mt-4 md:mt-0"
          style="background-image: url('@/assets/rectangle.png');"
        ></div>
      </div>

      <!-- Branch Images -->
      <div class="flex flex-wrap justify-center gap-6 px-4 mt-8 mb-8">
        <div class="text-center">
          <router-link to="/store-directory">
            <img
              src="@/assets/branch/branch1.png"
              alt="Countryside Burol Main Branch"
              class="w-40 sm:w-56 md:w-64 lg:w-72 h-auto object-cover rounded-[28px] transition-all duration-300 ease-in-out transform hover:scale-105 hover:opacity-80"
            />
          </router-link>
          <p class="mt-2 font-poppins font-bold text-sm sm:text-base">Countryside Burol Main Branch</p>
        </div>
        <div class="text-center">
          <router-link to="/store-directory">
            <img
              src="@/assets/branch/branch2.png"
              alt="Countryside Malihan Branch"
              class="w-40 sm:w-56 md:w-64 lg:w-72 h-auto object-cover rounded-[28px] transition-all duration-300 ease-in-out transform hover:scale-105 hover:opacity-80"
            />
          </router-link>
          <p class="mt-2 font-poppins font-bold text-sm sm:text-base">Countryside Malihan Branch</p>
        </div>
        <div class="text-center">
          <router-link to="/store-directory">
            <img
              src="@/assets/branch/branch3.png"
              alt="Countryside Imus Branch"
              class="w-40 sm:w-56 md:w-64 lg:w-72 h-auto object-cover rounded-[28px] transition-all duration-300 ease-in-out transform hover:scale-105 hover:opacity-80"
            />
          </router-link>
          <p class="mt-2 font-poppins font-bold text-sm sm:text-base">Countryside Imus Branch</p>
        </div>
        <div class="text-center">
          <router-link to="/store-directory">
            <img
              src="@/assets/branch/branch4.png"
              alt="Countryside Cantimbuhan Branch"
              class="w-40 sm:w-56 md:w-64 lg:w-72 h-auto object-cover rounded-[28px] transition-all duration-300 ease-in-out transform hover:scale-105 hover:opacity-80"
            />
          </router-link>
          <p class="mt-2 font-poppins font-bold text-sm sm:text-base">Countryside Cantimbuhan Branch</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import menu1 from '@/assets/menu1.png'
import menu2 from '@/assets/menu2.png'
import menu3 from '@/assets/menu3.png'
import menu4 from '@/assets/menu4.png'

const showLoader = ref(false)
const loading = ref(false)
const router = useRouter()
const slides = [menu1, menu2, menu3, menu4]
const currentIndex = ref(0)
let autoInterval = null

function goTo(idx) {
  currentIndex.value = idx
}

onMounted(() => {
  showLoader.value = true
  loading.value = true

  autoInterval = setInterval(() => {
    currentIndex.value = (currentIndex.value + 1) % slides.length
  }, 3000)

  setTimeout(() => {
    loading.value = false
    setTimeout(() => {
      showLoader.value = false
      router.push('/')
    }, 800)
  }, 100)
})

onBeforeUnmount(() => {
  clearInterval(autoInterval)
})
</script>

<style scoped>
.relative::-webkit-scrollbar {
  height: 8px;
}
.relative::-webkit-scrollbar-track {
  background: transparent;
}
.relative::-webkit-scrollbar-thumb {
  background-color: rgba(255,255,255,0.6);
  border-radius: 9999px;
  border: 2px solid transparent;
  background-clip: content-box;
}
.relative {
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.6) transparent;
}


</style>
