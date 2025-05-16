import axios from '@/plugins/axios' // Import our configured axios instance

export const employeeAPI = {
  // Get all employees (now includes archived)
  getAllEmployees: async () => {
    try {
      console.log('Calling getAllEmployees API endpoint...');
      const response = await axios.get('/api/employees?includeDeleted=true');
      console.log('getAllEmployees API success:', { 
        status: response.status,
        dataType: typeof response.data,
        dataIsArray: Array.isArray(response.data),
        length: Array.isArray(response.data) ? response.data.length : 'N/A'
      });
      return response;
    } catch (error) {
      console.error('getAllEmployees API error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullUrl: error.config?.baseURL + error.config?.url
      });
      throw error;
    }
  },

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

  // Update employee (can use either numeric id or string employee_id)
  updateEmployee: (id, formData) => {
    // Parse the form data to get the employee data
    const employeeData = JSON.parse(formData.get('employeeData'))
    
    // Ensure fields are properly mapped for the backend
    // Backend expects camelCase field names like contactNumber, not contact_number
    const fieldMappings = {
      firstName: employeeData.firstName || employeeData.first_name,
      middleName: employeeData.middleName || employeeData.middle_name || '',
      lastName: employeeData.lastName || employeeData.last_name,
      contactNumber: employeeData.contactNumber || employeeData.contact_number,
      dateOfBirth: employeeData.dateOfBirth || employeeData.date_of_birth,
      dateOfHire: employeeData.dateOfHire || employeeData.date_of_hire,
      address: employeeData.address
    }
    
    // Update the data if needed
    Object.keys(fieldMappings).forEach(key => {
      if (fieldMappings[key] && !employeeData[key]) {
        employeeData[key] = fieldMappings[key];
        console.log(`Mapped ${key} field: ${fieldMappings[key]}`);
      }
    });
    
    // Make sure we have the expected fields for the backend
    if (employeeData.firstName && employeeData.lastName) {
      console.log('Found proper firstName and lastName fields to update:', {
        firstName: employeeData.firstName,
        middleName: employeeData.middleName || '',
        lastName: employeeData.lastName
      });
    } else if (employeeData.full_name) {
      console.log('Warning: Found full_name but missing firstName/lastName which backend requires');
    }
    
    // Check contact number field
    if (employeeData.contactNumber) {
      console.log('Found proper contactNumber field:', employeeData.contactNumber);
    } else if (employeeData.contact_number) {
      console.log('Warning: Using contact_number but backend expects contactNumber');
      employeeData.contactNumber = employeeData.contact_number;
    }
    
    // Check date of birth field
    if (employeeData.dateOfBirth) {
      console.log('Found proper dateOfBirth field:', employeeData.dateOfBirth);
    } else if (employeeData.date_of_birth) {
      console.log('Warning: Using date_of_birth but backend expects dateOfBirth');
      employeeData.dateOfBirth = employeeData.date_of_birth;
    }
    
    // Apply all field mappings to the final data
    formData.set('employeeData', JSON.stringify(employeeData));
    
    console.log('API updateEmployee called with:', {
      id: id,
      idType: typeof id,
      isEmployeeID: id.toString().includes('-'), // Check if this looks like an employee_id
      employeeData: {
        id: employeeData.id,
        employee_id: employeeData.employee_id,
        full_name: employeeData.full_name,
        firstName: employeeData.firstName,
        lastName: employeeData.lastName,
        contactNumber: employeeData.contactNumber,
        dateOfBirth: employeeData.dateOfBirth,
        address: employeeData.address
      },
      hasProfileImage: formData.has('profileImage')
    })

    // Try to make the API request using the provided ID
    console.log(`Making API request to: /api/employees/${id}`)
    return axios.put(`/api/employees/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(response => {
      console.log('Update employee response:', {
        status: response.status,
        data: response.data
      });
      return response;
    }).catch(error => {
      console.error('Update employee error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    });
  },

  // New API for updating personal info without permissions
  updatePersonalInfo: (personalData) => {
    console.log('API updatePersonalInfo called with:', {
      employee_id: personalData.employee_id,
      full_name: personalData.full_name,
      fields: Object.keys(personalData)
    });
    
    // Create form data
    const formData = new FormData();
    formData.append('employeeData', JSON.stringify(personalData));
    
    return axios.put('/api/employees/personal-info/update', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 10000, // 10 second timeout
    }).catch(error => {
      console.error('API Error in updatePersonalInfo:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    });
  },

  // Change password
  changePassword: (passwordData) => {
    console.log('API changePassword called');
    return axios.post('/api/employees/change-password', passwordData)
      .catch(error => {
        console.error('API Error in changePassword:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      });
  },

  // Delete employee
  deleteEmployee: (id) => axios.delete(`/api/employees/${id}`),

  // Restore employee
  restoreEmployee: (id) => axios.post(`/api/employees/${id}/restore`),

  // Get archived employees (optional)
  getArchivedEmployees: () => axios.get('/api/employees?includeDeleted=true'),

  // Add emergency contact endpoint
  getEmployeeEmergencyContact: (id) => axios.get(`/api/employees/${id}/emergency-contact`),

  // Update profile image only
  updateProfileImage: (employeeId, profileImage) => {
    const formData = new FormData()
    formData.append('employeeId', employeeId)
    formData.append('profileImage', profileImage)
    
    return axios.post('/api/employees/update-profile-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30 second timeout
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        console.log('Upload progress:', percentCompleted)
      },
    })
  }
}

// Request API
export const requestAPI = {
  getAllRequests: () => axios.get('/api/requests'),
  getRequest: (id) => axios.get(`/api/requests/${id}`),
  createRequest: (data) => {
    console.log('Sending request data:', data)
    return axios.post('/api/requests', data)
  },
  updateRequest: (id, data) => axios.put(`/api/requests/${id}`, data),
  deleteRequest: (id) => axios.delete(`/api/requests/${id}`),
  restoreRequest: (id) => axios.patch(`/api/requests/restore/${id}`),

  // --- NEW: Batch update status ---
  batchUpdateStatus: (payload) => axios.post('/api/requests/batch-update-status', payload),

  // --- NEW: Resubmit and Resume endpoints ---
  resubmitRequest: (id, data) => axios.put(`/api/requests/${id}/resubmit`, data),
  resumeRequest: (id, data) => axios.put(`/api/requests/${id}/resume`, data),
}

export async function updateRequest(id, data) {
  return await axios.put(`/api/requests/${id}`, data)
}
