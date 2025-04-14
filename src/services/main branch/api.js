import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'multipart/form-data', // This is important for file uploads
  },
})

export const employeeAPI = {
  // Get all employees
  getAllEmployees: () => api.get('/employees'),

  // Get single employee
  getEmployee: (id) => api.get(`/employees/${id}`),

  // Create employee
  createEmployee: (formData) =>
    api.post('/employees', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  // Update employee
  updateEmployee: (id, data) => api.put(`/employees/${id}`, data),

  // Delete employee
  deleteEmployee: (id) => api.delete(`/employees/${id}`),
}
