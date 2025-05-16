<script setup>
import { ref } from 'vue';

const backgroundImage = ref(null);

const fadeInImage = () => {
  if (backgroundImage.value) {
    backgroundImage.value.classList.remove('opacity-0');
  }
};
</script>

<template>
  <div class="w-full">
    <div class="relative">
      <img 
        src="@/assets/FoodGallery/bg.png" 
        alt="Background"
        class="h-[450px] w-full object-cover transition-opacity duration-600 opacity-0"
        ref="backgroundImage"
        @load="fadeInImage"
      />
      
      <div class="absolute inset-0 flex flex-col items-center justify-center font-Poppins text-white text-center p-4">
        <h1 class="text-6xl font-bold mb-4">Food Gallery</h1>
        <div class="text-2xl font-semibold">
          <span>Serving </span>
          <span class="text-orange-500">sizzling steaks</span>
          <span> since </span>
          <span class="text-orange-500">1984</span>
          <span>!</span>
        </div>
      </div>
    </div>

    <!-- Gallery Grid -->
    <div class="bg-primaryColor px-4 py-16">
      <!-- Sizzling Cards Display -->
      <div class="max-w-6xl mx-auto mb-20">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center justify-center">
          <div class="transform -rotate-6 transition-transform hover:scale-105 duration-300">
            <img 
              src="@/assets/menu1.png" 
              alt="Sizzling Steak"
              class="rounded-lg shadow-xl"
            />
          </div>
          <div class="transform z-10 scale-110 transition-transform hover:scale-125 duration-300">
            <img 
              src="@/assets/menu2.png" 
              alt="Sizzling Tenderloin Steak"
              class="rounded-lg shadow-xl"
            />
          </div>
          <div class="transform rotate-6 transition-transform hover:scale-105 duration-300">
            <img 
              src="@/assets/menu3.png" 
              alt="Bone Steak"
              class="rounded-lg shadow-xl"
            />
          </div>
        </div>
      </div>

      <!-- Feature -->
      <div class="max-w-6xl mx-auto mb-20">
        <div class="bg-gradient-to-r from-orange-500 to-orange-400 rounded-lg overflow-hidden shadow-xl">
          <div class="flex flex-col md:flex-row items-center">
            <div class="p-8 text-white md:w-1/2">
              <h2 class="text-5xl font-poppins font-bold mb-4">PAN-GRILLED LIEMPO</h2>
              <p class="text-xl font-poppins  mb-6">BRUSHED WITH A SWEET GLAZE FOR ADDED JUICINESS AND FLAVOR</p>
              <router-link 
                to="/store-directory" 
                class="inline-block bg-white text-orange-500 px-4 py-2 rounded-full font-semibold hover:bg-orange-100 transition-colors duration-300"
              >
                Tara sa Countryside
              </router-link>
            </div>
            <div class="md:w-1/2">
              <img 
                src="@/assets/menu4.png" 
                alt="T-Bone Steak Special"
                class="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Regular Gallery Grid -->
      <div class="max-w-6xl mx-auto">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Gallery Item 1 -->
          <router-link to="/menu" class="block overflow-hidden rounded-lg hover:shadow-2xl transition-shadow duration-300">
            <div class="relative group overflow-hidden rounded-lg shadow-lg bg-white">
              <img 
                src="@/assets/FoodDirectory/Sizzling.png" 
                alt="Sizzling"
                class="w-full h-94 object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div class="absolute bottom-0 left-0 right-0 bg-orange-500 bg-opacity-50 text-white p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <h3 class="text-xl font-semibold">Sizzling</h3>
                <p class="text-sm">Food served hot on a sizzling platter or plate, making a sizzling sound as it cooks</p>
                <span class="mt-2 inline-block text-white font-medium border-b border-white group-hover:border-orange-200 group-hover:text-orange-200 transition-colors">
                  View in Menu <span class="ml-1">→</span>
                </span>
              </div>
            </div>
          </router-link>

          <!-- Gallery Item 2 -->
          <router-link to="/menu" class="block overflow-hidden rounded-lg hover:shadow-2xl transition-shadow duration-300">
            <div class="relative group overflow-hidden rounded-lg shadow-lg bg-white">
              <img 
                src="@/assets/FoodDirectory/T-BoneSteak.png" 
                alt="T-Bone Steak"
                class="w-full h-94 object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div class="absolute bottom-0 left-0 right-0 bg-orange-500 bg-opacity-50 text-white p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <h3 class="text-xl font-semibold">T-Bone Steak</h3>
                <p class="text-sm">Classic T-bone with rich marbling</p>
                <span class="mt-2 inline-block text-white font-medium border-b border-white group-hover:border-orange-200 group-hover:text-orange-200 transition-colors">
                  View in Menu <span class="ml-1">→</span>
                </span>
              </div>
            </div>
          </router-link>

          <!-- Gallery Item 3 -->
          <router-link to="/menu" class="block overflow-hidden rounded-lg hover:shadow-2xl transition-shadow duration-300">
            <div class="relative group overflow-hidden rounded-lg shadow-lg bg-white">
              <img 
                src="@/assets/FoodDirectory/Silog.png" 
                alt="Porterhouse"
                class="w-full h-94 object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div class="absolute bottom-0 left-0 right-0 bg-orange-500 bg-opacity-50 text-white p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <h3 class="text-xl font-semibold">Silog</h3>
                <p class="text-sm">Simple, delicious, and always a good time</p>
                <span class="mt-2 inline-block text-white font-medium border-b border-white group-hover:border-orange-200 group-hover:text-orange-200 transition-colors">
                  View in Menu <span class="ml-1">→</span>
                </span>
              </div>
            </div>
          </router-link>

          <!-- Gallery Item 4 -->
          <router-link to="/menu" class="block overflow-hidden rounded-lg hover:shadow-2xl transition-shadow duration-300">
            <div class="relative group overflow-hidden rounded-lg shadow-lg bg-white">
              <img 
                src="@/assets/FoodDirectory/Spam&Sandwich.png" 
                alt="Side Dishes"
                class="w-full h-94 object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div class="absolute bottom-0 left-0 right-0 bg-orange-500 bg-opacity-50 text-white p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <h3 class="text-xl font-semibold">Spam and Egg Sandwich</h3>
                <p class="text-sm">A common Filipino breakfast or snack, Spam and egg</p>
                <span class="mt-2 inline-block text-white font-medium border-b border-white group-hover:border-orange-200 group-hover:text-orange-200 transition-colors">
                  View in Menu <span class="ml-1">→</span>
                </span>
              </div>
            </div>
          </router-link>

          <!-- Gallery Item 5 -->
          <router-link to="/menu" class="block overflow-hidden rounded-lg hover:shadow-2xl transition-shadow duration-300">
            <div class="relative group overflow-hidden rounded-lg shadow-lg bg-white">
              <img 
                src="@/assets/FoodDirectory/Capsuey.png" 
                alt="Desserts"
                class="w-full h-94 object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div class="absolute bottom-0 left-0 right-0 bg-orange-500 bg-opacity-50 text-white p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <h3 class="text-xl font-semibold">Chop Suey</h3>
                <p class="text-sm">A stir-fried vegetable dish that is cooked with meats such as chicken and pork</p>
                <span class="mt-2 inline-block text-white font-medium border-b border-white group-hover:border-orange-200 group-hover:text-orange-200 transition-colors">
                  View in Menu <span class="ml-1">→</span>
                </span>
              </div>
            </div>
          </router-link>

          <!-- Gallery Item 6 -->
          <router-link to="/menu" class="block overflow-hidden rounded-lg hover:shadow-2xl transition-shadow duration-300">
            <div class="relative group overflow-hidden rounded-lg shadow-lg bg-white">
              <img 
                src="@/assets/menu2.png" 
                alt="Beverages"
                class="w-full h-94 object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div class="absolute bottom-0 left-0 right-0 bg-orange-500 bg-opacity-50 text-white p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <h3 class="text-xl font-semibold">Fried Chicken</h3>
                <p class="text-sm"> Marinated in citrus and spices and fried to golden perfection</p>
                <span class="mt-2 inline-block text-white font-medium border-b border-white group-hover:border-orange-200 group-hover:text-orange-200 transition-colors">
                  View in Menu <span class="ml-1">→</span>
                </span>
              </div>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.group {
  cursor: pointer;
}

.transition-transform {
  transition-property: transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}

.transition-opacity {
  transition: opacity 0.6s ease-in-out;
}

.primaryColor {
  background-color: #4a6522;
}

@media (max-width: 768px) {
  .grid {
    gap: 1rem;
  }
  
  .h-64 {
    height: 16rem;
  }
}
</style>
