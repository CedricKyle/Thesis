import axios from '@/plugins/axios' // Import our configured axios instance

export const employeeAPI = {
  // Get all employees (now includes archived)
  getAllEmployees: () => axios.get('/api/employees?includeDeleted=true'),

  // Get single employee
  getEmployee: (id) => axios.get(`/api/employees/${id}`),

  // Create employee
  createEmployee: (formData) => {
    // Log the data being sent
    const employeeData = JSON.parse(formData.get('employeeData'))
    console.log('API createEmployee called with:', {
      employeeData,
      files: {
        hasProfileImage: formData.has('profileImage'),
        hasResume: formData.has('resume'),
      },
    })

    return axios.post('/api/employees', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30 second timeout
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        console.log('Upload progress:', percentCompleted)
      },
    })
  },

  // Update employee (uses numeric id)
  updateEmployee: (id, formData) => {
    // Parse the form data to get the employee data
    const employeeData = JSON.parse(formData.get('employeeData'))
    console.log('Making update request with numeric ID:', id, 'Data:', employeeData)

    // Make the request using the numeric ID
    return axios.put(`/api/employees/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  // Delete employee
  deleteEmployee: (id) => axios.delete(`/api/employees/${id}`),

  // Restore employee
  restoreEmployee: (id) => axios.post(`/api/employees/${id}/restore`),

  // Get archived employees (optional)
  getArchivedEmployees: () => axios.get('/api/employees?includeDeleted=true'),

  // Add emergency contact endpoint
  getEmployeeEmergencyContact: (id) => axios.get(`/api/employees/${id}/emergency-contact`),
}
