import './assets/main.css'
import 'tabulator-tables/dist/css/tabulator.min.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './plugins/axios'
import { useRolesStore } from '@/stores/Users & Role/roleStore'
import { useAuthStore } from '@/stores/Authentication/authStore'
import axios from 'axios'

const app = createApp(App)
const pinia = createPinia()

// Initialize Pinia first
app.use(pinia)

// Initialize auth store first
const authStore = useAuthStore()

// Initialize roles store only if authenticated
const rolesStore = useRolesStore()
if (authStore.isAuthenticated) {
  rolesStore.initializeStore()
}

// Initialize the roles store
const rolesStoreInit = useRolesStore()
rolesStoreInit.initializeStore()

// Then add router
app.use(router)

// Initialize auth store and set up axios with stored token
if (authStore.token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${authStore.token}`
}

// Mount the app
app.mount('#app')
