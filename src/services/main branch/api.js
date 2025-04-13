import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
})

export const employeeAPI = {
  // Get all employees
  getAllEmployees: () => api.get('/employees'),

  // Get single employee
  getEmployee: (id) => api.get(`/employees/${id}`),

  // Create employee
  createEmployee: (data) => api.post('/employees', data),

  // Update employee
  updateEmployee: (id, data) => api.put(`/employees/${id}`, data),

  // Delete employee
  deleteEmployee: (id) => api.delete(`/employees/${id}`),
}
