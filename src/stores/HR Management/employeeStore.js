import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { employeeAPI } from '@/services/main branch/api'
import { useAuthStore } from '@/stores/Authentication/authStore'
import axios from 'axios'

export const useEmployeeStore = defineStore('employee', () => {
  // State
  const employees = ref([])
  const positions = ref([])
  const currentPage = ref(1)
  const itemsPerPage = ref(8)
  const searchQuery = ref('')
  const sortBy = ref('id')
  const sortDesc = ref(false)
  const showViewModal = ref(false)
  const selectedEmployee = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const showArchived = ref(false)
  const pendingChanges = ref(null)

  // Current user employee computed property
  const currentUserEmployee = computed(() => {
    const authStore = useAuthStore()
    if (!authStore.currentUser) return null
    
    // Debug what we're looking for
    console.log('Looking for employee with:', {
      userEmail: authStore.currentUser.email,
      userId: authStore.currentUser.id,
      employeesCount: employees.value.length
    })
    
    // Try to find the employee by email first (most reliable)
    const userEmail = authStore.currentUser.email
    let userEmployee = employees.value.find(emp => emp.email === userEmail)
    
    if (userEmployee) {
      console.log('Found employee by email:', userEmployee.full_name)
      return userEmployee
    }
    
    // If not found by email, try by employee_id and id with strict comparison
    userEmployee = employees.value.find(emp => 
      String(emp.employee_id) === String(authStore.currentUser.id) || 
      String(emp.id) === String(authStore.currentUser.id)
    )
    
    if (userEmployee) {
      console.log('Found employee by ID:', userEmployee.full_name)
      return userEmployee
    }
    
    // If still not found, try by employee_id with more lenient comparison
    userEmployee = employees.value.find(emp => 
      emp.employee_id && authStore.currentUser.id && 
      emp.employee_id.toString().includes(authStore.currentUser.id.toString())
    )
    
    if (userEmployee) {
      console.log('Found employee by partial ID match:', userEmployee.full_name)
      return userEmployee
    }
    
    // Log failure if not found
    console.warn('Could not find employee for current user:', authStore.currentUser)
    console.log('Available employees:', employees.value.map(e => ({
      id: e.id,
      employee_id: e.employee_id,
      email: e.email,
      full_name: e.full_name
    })))
    return null
  })

  // Getters
  const filteredEmployees = computed(() => {
    let records = [...employees.value]

    if (!showArchived.value) {
      records = records.filter((employee) => !employee.deleted_at)
    }

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      records = records.filter(
        (employee) =>
          employee.full_name.toLowerCase().includes(query) ||
          employee.department.toLowerCase().includes(query) ||
          (employee.positionInfo?.position_title || '').toLowerCase().includes(query) ||
          employee.email.toLowerCase().includes(query),
      )
    }

    records.sort((a, b) => {
      const comparison =
        sortBy.value === 'id'
          ? a.id.toString().localeCompare(b.id.toString())
          : a.full_name.localeCompare(b.full_name)
      return sortDesc.value ? -comparison : comparison
    })

    return records
  })

  const paginatedEmployees = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value
    const end = start + itemsPerPage.value
    return filteredEmployees.value.slice(start, end)
  })

  const totalPages = computed(() => Math.ceil(filteredEmployees.value.length / itemsPerPage.value))

  // Actions
  async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
    })
  }

  // Load employees from API
  async function loadEmployees() {
    try {
      loading.value = true;
      error.value = null;

      console.log('Starting to load employees...');
      
      const authStore = useAuthStore();
      if (!authStore.isAuthenticated) {
        console.log('Not authenticated, skipping employee load');
        return;
      }

      console.log('Making API request to get all employees...');
      const response = await employeeAPI.getAllEmployees();
      console.log('Employees API response:', { 
        status: response.status, 
        employeesCount: response.data?.length || 0 
      });
      
      if (!response.data || !Array.isArray(response.data)) {
        console.error('Employee data is not an array:', response.data);
        throw new Error('Invalid employee data received from server');
      }
      
      employees.value = response.data;
      console.log(`Successfully loaded ${employees.value.length} employees`);

      // Make global for debugging - TEMPORARY
      window.__employeeStore = { employees: employees.value };

      return response.data;
    } catch (err) {
      console.error('Error loading employees:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          baseURL: err.config?.baseURL
        }
      });
      
      error.value = err.message;
      if (err.response?.status === 401) {
        const authStore = useAuthStore();
        await authStore.logout();
      }
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Load positions from backend
  async function loadPositions() {
    try {
      const response = await axios.get('/api/positions')
      positions.value = response.data
      return response.data
    } catch (err) {
      console.error('Error loading positions:', err)
      throw err
    }
  }

  // Add employee
  const createEmployee = async (formData) => {
    try {
      const employeeData = JSON.parse(formData.get('employeeData'))
      console.log('Creating employee with data:', {
        employeeData,
        hasProfileImage: formData.has('profileImage'),
      })

      const response = await employeeAPI.createEmployee(formData)
      await loadEmployees()
      return response.data
    } catch (error) {
      console.error('Error creating employee:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        requestInfo: {
          method: error.config?.method,
          url: error.config?.url,
        },
      })

      // If we have specific field errors from the backend, format them
      if (error.response?.data?.fields) {
        const missingFields = error.response.data.fields
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
      }
      throw error
    }
  }

  // Update employee
  async function updateEmployee(id, formData) {
    try {
      // Debug log to verify data being sent
      const employeeDataObj = JSON.parse(formData.get('employeeData'))
      console.log('Updating employee:', {
        numericId: id,
        formDataContent: employeeDataObj,
      })

      const response = await employeeAPI.updateEmployee(id, formData)
      console.log('Update response:', response.data)

      // Update local state using the employee_id for finding the record
      const index = employees.value.findIndex((emp) => emp.id === id) // Use numeric ID
      if (index !== -1) {
        employees.value[index] = {
          ...employees.value[index],
          ...response.data,
        }
      }

      // Reload employees to ensure we have fresh data
      await loadEmployees()

      return response.data
    } catch (error) {
      console.error('Employee update error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        method: error.config?.method,
        responseData: error.response?.data,
      })
      throw error
    }
  }

  // Delete employee
  async function deleteEmployee(id) {
    try {
      await employeeAPI.deleteEmployee(id)
      employees.value = employees.value.filter((emp) => emp.employee_id !== id)
    } catch (error) {
      console.error('Error deleting employee:', error)
      throw error
    }
  }

  // View employee details
  async function setSelectedEmployee(employee) {
    try {
      loading.value = true
      console.log('Initial employee data:', JSON.parse(JSON.stringify(employee)))

      // Fetch both employee and emergency contact data
      const [employeeResponse, emergencyContactResponse] = await Promise.all([
        employeeAPI.getEmployee(employee.employee_id),
        employeeAPI.getEmployeeEmergencyContact(employee.employee_id),
      ])

      console.log('Employee Response data:', employeeResponse.data)
      console.log('Emergency Contact Response data:', emergencyContactResponse.data)

      // Combine the data, accessing the emergency contact from the data property
      selectedEmployee.value = {
        ...employeeResponse.data,
        emergency_contact: emergencyContactResponse.data.data, // Access the data property
      }

      console.log(
        'Combined selected employee data:',
        JSON.parse(JSON.stringify(selectedEmployee.value)),
      )
      showViewModal.value = true
    } catch (error) {
      console.error('Error fetching employee details:', error)
      selectedEmployee.value = employee
      showViewModal.value = true
    } finally {
      loading.value = false
    }
  }

  function closeViewModal() {
    showViewModal.value = false
    selectedEmployee.value = null
  }

  function handleSort(column) {
    if (sortBy.value === column) {
      sortDesc.value = !sortDesc.value
    } else {
      sortBy.value = column
      sortDesc.value = false
    }
  }

  // Search and Filter Functions
  function searchEmployees(query) {
    searchQuery.value = query
  }

  function resetFilters() {
    searchQuery.value = ''
    currentPage.value = 1
    sortBy.value = 'id'
    sortDesc.value = false
  }

  // Add this function if not already present
  const getEmployee = async (id) => {
    try {
      const response = await employeeAPI.getEmployee(id)
      return response.data
    } catch (error) {
      console.error('Error fetching employee:', error)
      throw error
    }
  }

  // Add restore employee function
  async function restoreEmployee(id) {
    try {
      const response = await employeeAPI.restoreEmployee(id)

      // Reload employees to get fresh data
      await loadEmployees()

      return response.data
    } catch (error) {
      console.error('Error restoring employee:', error)
      throw error
    }
  }

  // Add pending changes functions
  function setPendingChanges(changes) {
    console.log('Setting pending changes:', changes)
    pendingChanges.value = changes
  }

  function clearPendingChanges() {
    pendingChanges.value = null
  }

  async function savePendingChanges() {
    if (!pendingChanges.value) {
      console.log('No pending changes to save')
      return null
    }

    if (!currentUserEmployee.value) {
      console.error('Cannot save changes: No employee found for current user')
      throw new Error('Employee not found. Please refresh the page and try again.')
    }

    try {
      // First, get the most up-to-date employee data
      const employee = currentUserEmployee.value
      
      console.log('Current user employee details:', {
        id: employee.id,
        employee_id: employee.employee_id,
        full_name: employee.full_name,
        email: employee.email
      })

      // Check if the changes only include personal info fields (full_name, contact_number, date_of_birth)
      const changesKeys = Object.keys(pendingChanges.value).filter(key => key !== 'profileImageFile');
      const personalInfoFieldsOnly = changesKeys.every(key => 
        ['full_name', 'contact_number', 'date_of_birth'].includes(key)
      );
      
      // TEMPORARY FIX: Always use the main update endpoint instead of the personal-info endpoint
      // which seems to have issues with updating the full_name
      if (false && personalInfoFieldsOnly && !pendingChanges.value.profileImageFile) {
        console.log('Updating only personal info fields, using simplified API');
        
        // Create data object with only the personal info fields
        const personalInfoData = {
          employee_id: employee.employee_id, // Explicitly include the employee_id
          full_name: pendingChanges.value.full_name,
          contact_number: pendingChanges.value.contact_number,
          date_of_birth: pendingChanges.value.date_of_birth
        };
        
        console.log('Personal info data being sent:', {
          employee_id: personalInfoData.employee_id,
          full_name: personalInfoData.full_name
        });
        
        // Call the personal info update API
        const response = await employeeAPI.updatePersonalInfo(personalInfoData);
        console.log('Personal info update response:', response.data);
        
        // Reload employee data to get updated information
        await loadEmployees();
        
        // Clear pending changes
        clearPendingChanges();
        
        return response.data;
      }
      
      // If we get here, we're updating more than just personal info fields or including profile image
      // Make sure the employee has a valid employee_id
      if (!employee.employee_id) {
        console.error('Cannot save changes: Employee does not have a valid employee_id', employee)
        throw new Error('Missing employee ID. Please contact your administrator.')
      }
      
      const updateData = new FormData()
      
      // Extract profile image file if it exists
      const profileImageFile = pendingChanges.value.profileImageFile
      
      // Remove profileImageFile from data object before JSON stringifying
      const { profileImageFile: _, ...employeeDataChanges } = pendingChanges.value
      
      console.log('Changes to be applied:', employeeDataChanges)
      
      // Prepare employee data object with pending changes
      const employeeData = {
        ...employee,
        ...employeeDataChanges
      }
      
      // If full_name is provided, parse it into first, middle, and last name
      if (employeeDataChanges.full_name) {
        console.log('Parsing full_name into name components:', employeeDataChanges.full_name)
        
        // Split the full name by spaces
        const nameParts = employeeDataChanges.full_name.trim().split(/\s+/)
        
        if (nameParts.length === 1) {
          // Only first name
          employeeData.firstName = nameParts[0]
          employeeData.middleName = ''
          employeeData.lastName = ''
        } else if (nameParts.length === 2) {
          // First and last name
          employeeData.firstName = nameParts[0]
          employeeData.middleName = ''
          employeeData.lastName = nameParts[1]
        } else {
          // First, middle (could be multiple parts), and last name
          employeeData.firstName = nameParts[0]
          employeeData.lastName = nameParts[nameParts.length - 1]
          employeeData.middleName = nameParts.slice(1, nameParts.length - 1).join(' ')
        }
        
        console.log('Parsed name components:', {
          firstName: employeeData.firstName,
          middleName: employeeData.middleName,
          lastName: employeeData.lastName
        })
        
        // Keep full_name for reference but the backend will reconstruct it
        employeeData.full_name = employeeDataChanges.full_name
      }
      
      // Fix contact number mapping - backend expects contactNumber (camelCase)
      if (employeeDataChanges.contact_number) {
        console.log('Mapping contact_number to contactNumber:', employeeDataChanges.contact_number)
        employeeData.contactNumber = employeeDataChanges.contact_number
      }
      
      // Fix date of birth mapping - backend expects dateOfBirth (camelCase)
      if (employeeDataChanges.date_of_birth) {
        console.log('Mapping date_of_birth to dateOfBirth:', employeeDataChanges.date_of_birth)
        employeeData.dateOfBirth = employeeDataChanges.date_of_birth
      }
      
      // Ensure address is properly mapped (can be directly used with the same name)
      if (employeeDataChanges.address) {
        console.log('Found address change:', employeeDataChanges.address)
        employeeData.address = employeeDataChanges.address
      }
      
      // Map other critical fields from snake_case to camelCase as expected by backend
      if (employee.date_of_hire) {
        employeeData.dateOfHire = employee.date_of_hire
      }
      if (employee.date_of_birth && !employeeData.dateOfBirth) {
        employeeData.dateOfBirth = employee.date_of_birth
      }
      
      console.log('Final employee data to be sent:', {
        id: employeeData.id,
        employee_id: employeeData.employee_id,
        full_name: employeeData.full_name,
        contactNumber: employeeData.contactNumber || employeeData.contact_number,
        dateOfBirth: employeeData.dateOfBirth || employeeData.date_of_birth,
        address: employeeData.address,
        hasProfileImage: !!profileImageFile
      })
      
      // Add employee data to form
      updateData.append('employeeData', JSON.stringify(employeeData))
      
      // Add profile image if it exists
      if (profileImageFile) {
        console.log('Adding profile image to request')
        updateData.append('profileImage', profileImageFile)
      }
      
      // Try using the string-formatted employee_id instead of numeric id
      // Backend might be expecting this format (like "2025-50000")
      const employee_id = employee.employee_id
      
      console.log(`Using employee_id for API call: ${employee_id} (Type: ${typeof employee_id})`)
      console.log('Full data being sent in updateEmployee:', JSON.stringify(employeeData, null, 2))
      
      // Make the API request with employee_id instead of id
      const response = await employeeAPI.updateEmployee(employee_id, updateData)
      console.log('API response after update:', response.data)
      
      // Reload employee data to get updated information
      await loadEmployees()
      
      // Verify the update worked by checking if the full_name was updated
      const updatedEmployee = employees.value.find(emp => emp.employee_id === employee_id)
      console.log('Employee after update:', {
        id: updatedEmployee?.id,
        employee_id: updatedEmployee?.employee_id,
        full_name: updatedEmployee?.full_name,
        expected_full_name: employeeData.full_name
      })
      
      // Clear pending changes
      clearPendingChanges()
      
      return response.data
    } catch (error) {
      console.error('Error saving pending changes:', error)
      // Log more details about the error
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data
        })
      }
      throw error
    }
  }

  function hasPendingChanges() {
    return !!pendingChanges.value
  }

  return {
    // State
    employees,
    positions,
    currentPage,
    itemsPerPage,
    searchQuery,
    sortBy,
    sortDesc,
    showViewModal,
    selectedEmployee,
    loading,
    error,
    showArchived,
    pendingChanges,

    // Getters
    filteredEmployees,
    paginatedEmployees,
    totalPages,
    currentUserEmployee,

    // Actions
    loadEmployees,
    loadPositions,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    setSelectedEmployee,
    closeViewModal,
    handleSort,
    searchEmployees,
    resetFilters,
    getEmployee,
    restoreEmployee,
    setPendingChanges,
    clearPendingChanges,
    savePendingChanges,
    hasPendingChanges,
  }
})
