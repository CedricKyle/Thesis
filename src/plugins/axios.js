import axios from 'axios'
import { useAuthStore } from '@/stores/Authentication/authStore'

const API_URL = import.meta.env.VITE_API_URL

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: `${API_URL}`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  timeout: 10000, // Add 10 second timeout
})

// Add request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Log API requests in development
    console.log(`API Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`)
    return config
  },
  (error) => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  },
)

// Add response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error('API Response Error:', {
      message: error.message,
      code: error.code,
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
    })

    // If it's a network error (e.g., server not running)
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
      console.error(
        'Network error - please check if the backend server is running at:',
        error.config.baseURL,
      )
      // You can add custom error notification here
    }

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

      // Show notification if ElNotification is available
      if (typeof ElNotification !== 'undefined') {
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
      } else {
        console.warn('Session expired:', message)
        await authStore.logout()
        setTimeout(() => {
          window.location.href = '/login'
        }, 1000)
      }
    }
    return Promise.reject(error)
  },
)

// Set as default axios instance
axios.defaults.baseURL = `${API_URL}`
axios.defaults.withCredentials = true
axios.defaults.headers.common['Content-Type'] = 'application/json'
axios.defaults.headers.common['Accept'] = 'application/json'
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest'

export default axiosInstance
