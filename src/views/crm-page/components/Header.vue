<template>
  <header
    :class="{
      'bg-primaryColor': hasScrolled,
      'bg-transparent': !hasScrolled,
    }"
    class="fixed top-0 left-0 w-full h-16 shadow-md flex items-center px-6 justify-between z-10 transition-colors duration-300"
  >
    <div class="flex items-center space-x-2">
      <img src="@/assets/logo1.png" alt="Logo" class="h-10 w-auto" />
      <router-link to="/" class="text-xl font-semibold text-white font-Poppins">
        Countryside Steakhouse
      </router-link>
    </div>

    <!-- Nav Menu -->
    <nav>
      <ul class="flex space-x-6 text-white font-Poppins font-bold">
        <li><router-link to="/" class="hover:text-gray-300 font-thin">Home</router-link></li>
        <li><router-link to="/menu" class="hover:text-gray-300 font-thin">Menu</router-link></li>
        <li>
          <router-link to="/food-gallery" class="hover:text-gray-300 font-thin"
            >Food Gallery</router-link
          >
        </li>
        <li>
          <router-link to="/store-directory" class="hover:text-gray-300 font-thin"
            >Store Directory</router-link
          >
        </li>
        <li>
          <router-link to="/feedbacks" class="hover:text-gray-300 font-thin">Feedbacks</router-link>
        </li>
        <li><router-link to="/login" class="hover:text-gray-300 font-thin">Login</router-link></li>
      </ul>
    </nav>
  </header>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

const hasScrolled = ref(false)
const router = useRouter()

const handleClick = (path) => {
  router.push(path)
}

// Function to check scroll position
const checkScroll = () => {
  if (window.scrollY > 200) {
    // You can change 50 to whatever scroll threshold you prefer
    hasScrolled.value = true
  } else {
    hasScrolled.value = false
  }
}

onMounted(() => {
  // Add scroll event listener when the component is mounted
  window.addEventListener('scroll', checkScroll)
})

onBeforeUnmount(() => {
  // Remove scroll event listener when the component is unmounted
  window.removeEventListener('scroll', checkScroll)
})
</script>

<style scoped>
/* Additional scoped styles if needed */
</style>
