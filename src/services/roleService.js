import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

export const roleService = {
  getAllRoles: async () => {
    try {
      const response = await axios.get(`${API_URL}/roles`)
      console.log('Roles fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('Error in getAllRoles:', error.response?.data || error.message)
      throw error
    }
  },

  createRole: async (roleData) => {
    try {
      const transformedData = {
        role_name: roleData['role name'],
        description: roleData.description,
        permissions: roleData.permissions,
      }
      const response = await axios.post(`${API_URL}/roles`, transformedData)
      return response.data
    } catch (error) {
      console.error('Error in createRole:', error.response?.data || error.message)
      throw error
    }
  },

  updateRole: async (id, roleData) => {
    try {
      const transformedData = {
        role_name: roleData.role_name || roleData['role name'],
        description: roleData.description,
        permissions: roleData.permissions,
      }
      const response = await axios.put(`${API_URL}/roles/${id}`, transformedData)
      return response.data
    } catch (error) {
      console.error('Error in updateRole:', error.response?.data || error.message)
      throw error
    }
  },

  deleteRole: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/roles/${id}`)
      return response.data
    } catch (error) {
      console.error('Error in deleteRole:', error.response?.data || error.message)
      throw error
    }
  },
}
