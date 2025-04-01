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
    employees.value.push(employeeData)
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
    setSelectedEmployee,
    closeViewModal,
    handleSort,
  }
})
