import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL
export const useUserStore = defineStore('user', () => {
  const users = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Fetch all users
  const fetchUsers = async () => {
    try {
      loading.value = true
      const response = await axios.get(`${API_URL}/users`)
      users.value = response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Create new user
  const createUser = async (userData) => {
    try {
      loading.value = true
      const response = await axios.post(`${API_URL}/users`, userData)

      // Add the new user to the users array
      users.value.push(response.data)

      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update user
  const updateUser = async (userId, userData) => {
    try {
      loading.value = true
      const response = await axios.put(`${API_URL}/users/${userId}`, userData)

      // Update the user in the users array
      const index = users.value.findIndex((user) => user.id === userId)
      if (index !== -1) {
        users.value[index] = { ...users.value[index], ...userData }
      }

      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete user
  const deleteUser = async (userId) => {
    try {
      loading.value = true
      await axios.delete(`${API_URL}/users/${userId}`)

      // Remove the user from the users array
      users.value = users.value.filter((user) => user.id !== userId)
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Get single user
  const getUserById = async (userId) => {
    try {
      loading.value = true
      const response = await axios.get(`${API_URL}/users/${userId}`)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    getUserById,
  }
})
