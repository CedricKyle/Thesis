<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/Authentication/authStore'
import { LogOut } from 'lucide-vue-next'

const props = defineProps({
  departmentName: {
    type: String,
    required: true,
  },
  menuItems: {
    type: Array,
    required: true,
  },
})

const router = useRouter()
const authStore = useAuthStore()
const currentTab = ref(null)

const visibleMenuItems = computed(() => {
  const userPermissions = authStore.currentUser?.permissions || []

  // Show all items for Super Admin
  if (authStore.currentUser?.role === 'Super Admin') {
    return props.menuItems
  }

  // Filter items based on user's permissions
  return props.menuItems.filter((item) => userPermissions.includes(item.permission))
})

const handleLogout = async () => {
  await authStore.logout()
}
</script>

<template>
  <div class="flex">
    <!-- Sidebar -->
    <div class="w-80 min-h-screen p-4 bg-primaryColor flex flex-col">
      <!-- Logo Section -->
      <div class="logo-section flex items-center mb-5 gap-4">
        <div class="logo-content">
          <img
            src="@/assets/Images/countryside-logo.png"
            alt="Countryside logo"
            class="w-[60px] h-[60px]"
          />
        </div>
        <div class="text-log">
          <h1 class="text-[25px] text-secondaryColor">Countryside</h1>
          <p class="text-[12px] text-gray-300">Serving sizzling steaks since 1984!</p>
        </div>
      </div>

      <!-- Menu Items -->
      <ul class="menu w-full text-base-content">
        <li v-for="item in visibleMenuItems" :key="item.name">
          <router-link
            :to="item.route"
            class="flex items-center gap-3 p-3 hover:bg-primaryColor/20 rounded-md text-white"
            :class="{ 'active-menu': currentTab === item.name }"
            @click="currentTab = item.name"
          >
            <component :is="item.icon" class="w-5 h-5" />
            {{ item.name }}
          </router-link>
        </li>
      </ul>

      <!-- User Info -->
      <div class="mt-4 p-3 text-white">
        <p class="text-sm">{{ authStore.currentUser?.full_name }}</p>
        <p class="text-xs text-gray-300">{{ authStore.currentUser?.role }}</p>
      </div>

      <!-- Logout Button -->
      <div class="mt-auto pt-5">
        <button
          @click="handleLogout"
          class="flex items-center gap-3 p-3 w-full hover:bg-primaryColor/20 rounded-md text-white"
        >
          <LogOut class="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 p-6 bg-bgColor overflow-y-auto max-h-screen">
      <router-view></router-view>
    </div>
  </div>
</template>

<style scoped>
.active-menu {
  background-color: rgba(255, 255, 255, 0.2);
}
</style>
