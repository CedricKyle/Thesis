import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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
  function addEmployee(employeeData) {
    try {
      const newEmployee = {
        ...employeeData,
        createdAt: new Date().toISOString(),
        status: 'Active', // You might want to add a status field
      }

      employees.value.push(newEmployee)
      saveToLocalStorage()
      return newEmployee
    } catch (error) {
      console.error('Error adding employee:', error)
      throw error
    }
  }

  function updateEmployee(id, updates) {
    try {
      const index = employees.value.findIndex((emp) => emp.id === id)
      if (index !== -1) {
        employees.value[index] = {
          ...employees.value[index],
          ...updates,
          updatedAt: new Date().toISOString(),
        }
        saveToLocalStorage()
        return employees.value[index]
      }
      return null
    } catch (error) {
      console.error('Error updating employee:', error)
      throw error
    }
  }

  function deleteEmployee(id) {
    try {
      employees.value = employees.value.filter((emp) => emp.id !== id)
      saveToLocalStorage()
    } catch (error) {
      console.error('Error deleting employee:', error)
      throw error
    }
  }

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

  // Local Storage Functions
  function saveToLocalStorage() {
    try {
      localStorage.setItem('employees', JSON.stringify(employees.value))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
      throw error
    }
  }

  function loadEmployees() {
    try {
      const savedEmployees = localStorage.getItem('employees')
      if (savedEmployees) {
        employees.value = JSON.parse(savedEmployees)
      }
    } catch (error) {
      console.error('Error loading employees:', error)
      employees.value = []
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

  // Initialize employees from localStorage when store is created
  loadEmployees()

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
    addEmployee,
    updateEmployee,
    deleteEmployee,
    setSelectedEmployee,
    closeViewModal,
    handleSort,
    loadEmployees,
    searchEmployees,
    resetFilters,
  }
})
