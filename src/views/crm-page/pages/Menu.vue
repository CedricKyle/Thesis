<template>
    <div class=" w-full">
      <!-- Background image -->
      <div class="relative">
        <img 
          src="@/assets/background3.png" 
          alt="Background"
          class="h-[450px] w-full object-cover transition-opacity duration-600 opacity-0"
          ref="backgroundImage"
          @load="fadeInImage"
        />
      </div>
        <!-- Overlay Text -->
       
         <!-- Overlay Text (Now positioned with flex to not block the navbar) -->
      <div class="absolute text-left top-0 left-0 right-200 bottom-0 mt-40 flex flex-col items-left z-10 text-white px-5">
        <h2 class="text-4xl sm:text-5xl font-Poppins font-bold mb-4 text-left">
         Ang Paborito ng <span class="text-[#F68920]">Bayan</span>
        </h2>
        <p class="text-lg sm:text-xl font-Poppins font-normal text-left">
          Sabi nga nila, sa <span class="text-[#F68920]">unang tikim</span> pa lang, alam mong <span class="text-[#F68920]">babalik-balikan</span> mo!
        </p>
      </div>
  
      <div class="relative w-full">
        <!-- Background Color Section -->
        <div class="bg-[#466114] text-white py-5">
          <!-- Overlay logo in the background -->
          <div class="absolute inset-0 flex items-center justify-center z-0 opacity-50">
            <img 
              src="@/assets/logo1.png" 
              alt="Logo" 
              class="h-180 w-auto object-contain" 
            />
          </div>
  
         
          <div class="flex items-center justify-between space-x-4 z-10">
            <h2 class="text-3xl font-bold text-center flex-grow">Our Menu!</h2>
            <div 
              class="h-[20px] w-full max-w-[1250px] rounded-[28px] bg-gray-300"
              style="background-image: url('@/assets/rectangle.png');"
            ></div>
          </div>
  
          <!-- Menu images -->
          <div class="flex justify-center space-x-8 mt-8 z-20 relative">
            <img 
              src="@/assets/menu/menu1.png" 
              alt="Menu 1" 
              class="h-[700px] w-[500px] object-cover rounded-[28px] cursor-pointer menu-image"
              @click="openFullscreen('menu1.png')" 
            />
            <img 
              src="@/assets/menu/menu2.png" 
              alt="Menu 2" 
              class="h-[700px] w-[500px] object-cover rounded-[28px] cursor-pointer menu-image" 
              @click="openFullscreen('menu2.png')" 
            />
          </div>
        </div>
      </div>
  
      <!-- Fullscreen Modal -->
      <div v-if="isFullscreen" class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
        <img 
          :src="fullscreenImage" 
          alt="Fullscreen Menu" 
          class="h-auto w-auto max-h-full max-w-full object-contain"
        />
        <button 
          @click="closeFullscreen" 
          class="absolute top-5 right-5 text-white text-3xl"
        >
          &times;
        </button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  
  const isFullscreen = ref(false);
  const fullscreenImage = ref('');
  const backgroundImage = ref(null);
  
  // Function to fade in the background image
  const fadeInImage = () => {
    if (backgroundImage.value) {
      backgroundImage.value.classList.remove('opacity-0');
    }
  };
  
  // Function to open fullscreen with the selected image
  const openFullscreen = async (image) => {
    fullscreenImage.value = require(`@/assets/menu/${image}`);
    isFullscreen.value = true;
  };
  
  // Function to close fullscreen
  const closeFullscreen = () => {
    isFullscreen.value = false;
  };
  </script>
  
  <style scoped>
  /* Transitions */
  .transition-opacity {
    transition: opacity 0.6s ease-in-out;
  }
  
  /* Menu styles */
  .menu-image {
    transition: transform 0.3s ease;
  }
  
  .menu-image:hover {
    transform: scale(1.02);
  }
  
  /* Modal styles */
  .modal-enter-active,
  .modal-leave-active {
    transition: opacity 0.3s ease;
  }
  
  .modal-enter-from,
  .modal-leave-to {
    opacity: 0;
  }
  
  /* Responsive styles */
  @media (max-width: 768px) {
    .menu-grid {
      flex-direction: column;
      gap: 1rem;
    }
    
    img[alt="Menu 1"],
    img[alt="Menu 2"] {
      width: 100%;
      height: auto;
      max-height: 500px;
    }
  }
  </style>
  