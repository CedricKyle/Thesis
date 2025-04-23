import axios from '@/plugins/axios' // Import our configured axios instance

export const employeeAPI = {
  // Get all employees
  getAllEmployees: () => axios.get('/api/employees'),

  // Get single employee
  getEmployee: (id) => axios.get(`/api/employees/${id}`),

  // Create employee
  createEmployee: (formData) =>
    axios.post('/api/employees', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  // Update employee
  updateEmployee: (id, formData) => {
    return axios.put(`/api/employees/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  // Delete employee
  deleteEmployee: (id) => axios.delete(`/api/employees/${id}`),
}