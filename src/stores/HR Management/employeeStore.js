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
      loading.value = true
      error.value = null

      const authStore = useAuthStore()
      if (!authStore.isAuthenticated) {
        console.log('Not authenticated, skipping employee load')
        return
      }

      const response = await employeeAPI.getAllEmployees()
      employees.value = response.data

      return response.data
    } catch (err) {
      console.error('Error loading employees:', err)
      error.value = err.message
      if (err.response?.status === 401) {
        const authStore = useAuthStore()
        await authStore.logout()
      }
      throw err
    } finally {
      loading.value = false
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
        hasResume: formData.has('resume'),
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

  // Add helper function to download resume
  function downloadResume(employeeId) {
    try {
      const employee = employees.value.find((emp) => emp.id === employeeId)
      if (!employee || !employee.resume) {
        throw new Error('Resume not found')
      }

      // Create blob from base64 data
      const byteString = atob(employee.resume.data.split(',')[1])
      const ab = new ArrayBuffer(byteString.length)
      const ia = new Uint8Array(ab)
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i)
      }
      const blob = new Blob([ab], { type: employee.resume.type })

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = employee.resume.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading resume:', error)
      throw error
    }
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

    // Getters
    filteredEmployees,
    paginatedEmployees,
    totalPages,

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
    downloadResume,
    getEmployee,
    restoreEmployee,
  }
})
