import './assets/main.css'
import 'tabulator-tables/dist/css/tabulator.min.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useRolesStore } from '@/stores/Users & Role/roleStore'
import { useAuthStore } from '@/stores/Authentication/authStore'

const app = createApp(App)
const pinia = createPinia()

// Initialize Pinia first
app.use(pinia)

// Initialize the roles store
const rolesStore = useRolesStore()
rolesStore.initializeStore()

// Initialize the auth store
const authStore = useAuthStore()
authStore.checkAuth() // Check for existing auth state

// Then add router
app.use(router)

app.mount('#app')
