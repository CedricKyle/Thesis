import axios from 'axios'
import { useAuthStore } from '@/stores/Authentication/authStore'

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

// Add request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Add any request processing here
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Add response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const authStore = useAuthStore()

    if (error.response?.status === 401 || error.response?.status === 403) {
      const errorCode = error.response?.data?.code
      let message = 'Your session has expired. Please login again.'

      switch (errorCode) {
        case 'ROLE_CHANGED':
          message = 'Your role has been changed. Please login again with your new permissions.'
          break
        case 'USER_NOT_FOUND':
          message = 'Your account no longer exists.'
          break
        case 'INVALID_TOKEN':
          message = 'Invalid session. Please login again.'
          break
      }

      // Show notification
      ElNotification({
        title: 'Session Expired',
        message: message,
        type: 'warning',
        duration: 5000,
        onClose: async () => {
          await authStore.logout()
          window.location.href = '/login'
        },
      })
    }
    return Promise.reject(error)
  },
)

// Set as default axios instance
axios.defaults.baseURL = 'http://localhost:3000'
axios.defaults.withCredentials = true
axios.defaults.headers.common['Content-Type'] = 'application/json'
axios.defaults.headers.common['Accept'] = 'application/json'
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest'

export default axiosInstance
