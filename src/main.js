import './assets/main.css'
import 'tabulator-tables/dist/css/tabulator.min.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()

// Add router first
app.use(router)
app.use(pinia)

app.mount('#app')
