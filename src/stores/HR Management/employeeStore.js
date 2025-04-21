import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { employeeAPI } from '@/services/main branch/api'
import axios from 'axios'

export const useEmployeeStore = defineStore('employee', () => {
  // State
  const employees = ref([])
  const currentPage = ref(1)
  const itemsPerPage = ref(8)
  const searchQuery = ref('')
  const sortBy = ref('id')
  const sortDesc = ref(false)
  const showViewModal = ref(false)
  const selectedEmployee = ref(null)

  // Getters
  const filteredEmployees = computed(() => {
    let records = [...employees.value]

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      records = records.filter(
        (employee) =>
          employee.fullName.toLowerCase().includes(query) ||
          employee.department.toLowerCase().includes(query) ||
          employee.jobTitle.toLowerCase().includes(query) ||
          employee.email.toLowerCase().includes(query),
      )
    }

    records.sort((a, b) => {
      const comparison =
        sortBy.value === 'id' ? a.id.localeCompare(b.id) : a.fullName.localeCompare(b.fullName)
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
      const response = await employeeAPI.getAllEmployees()
      employees.value = response.data
    } catch (error) {
      console.error('Error loading employees:', error)
      throw error
    }
  }

  // Add employee
  const createEmployee = async (employeeData) => {
    try {
      // Log the request URL and data for debugging
      console.log('Sending request to:', `${employeeAPI.defaults?.baseURL}/employees`)
      console.log('Employee data:', employeeData)

      const response = await employeeAPI.createEmployee(employeeData)

      // After successful creation, immediately load the updated list
      await loadEmployees()

      return response.data
    } catch (error) {
      // Enhanced error logging
      console.error('Error creating employee:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config,
      })
      throw error
    }
  }

  // Update employee
  async function updateEmployee(id, updates) {
    try {
      const response = await employeeAPI.updateEmployee(id, updates)
      const index = employees.value.findIndex((emp) => emp.employee_id === id)
      if (index !== -1) {
        employees.value[index] = response.data
      }
      return response.data
    } catch (error) {
      console.error('Error updating employee:', error)
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
  function setSelectedEmployee(employee) {
    selectedEmployee.value = employee
    showViewModal.value = true
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

  return {
    // State
    employees,
    currentPage,
    itemsPerPage,
    searchQuery,
    sortBy,
    sortDesc,
    showViewModal,
    selectedEmployee,

    // Getters
    filteredEmployees,
    paginatedEmployees,
    totalPages,

    // Actions
    loadEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    setSelectedEmployee,
    closeViewModal,
    handleSort,
    searchEmployees,
    resetFilters,
    downloadResume,
  }
})
