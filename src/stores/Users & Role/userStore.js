import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const users = ref([])
  const loading = ref(false)
  const error = ref(null)

  const createUser = async (userData) => {
    try {
      loading.value = true
      // Here you would typically make an API call to your backend
      // For now, we'll just add to the local array
      users.value.push({
        id: generateUserId(), // Implement this or get from backend
        fullName: userData.fullName,
        email: userData.email,
        role: userData.role,
        status: userData.status,
        createdAt: userData.createdAt,
        lastModified: new Date().toISOString(), // Set last modified to current time
      })

      // If you have an API:
      // await axios.post('/api/users', userData)
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const generateUserId = () => {
    // Implement your ID generation logic
    return `USER-${Date.now()}`
  }

  return {
    users,
    loading,
    error,
    createUser,
  }
})
