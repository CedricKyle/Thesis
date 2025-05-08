import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { requestAPI } from '@/services/main branch/api'
import { useAuthStore } from '@/stores/Authentication/authStore'

export const useRequestStore = defineStore('request', () => {
  // State
  const requests = ref([])
  const currentPage = ref(1)
  const itemsPerPage = ref(8)
  const searchQuery = ref('')
  const sortBy = ref('id')
  const sortDesc = ref(false)
  const showViewModal = ref(false)
  const selectedRequest = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const showArchived = ref(false)
  const newRequest = ref({
    item: '',
    quantity: 1,
    remarks: '',
  })

  // Getters
  const filteredRequests = computed(() => {
    let records = [...requests.value]

    if (!showArchived.value) {
      records = records.filter((request) => !request.deleted_at)
    }

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      records = records.filter(
        (request) =>
          request.item.toLowerCase().includes(query) ||
          request.status.toLowerCase().includes(query) ||
          request.requested_by.toLowerCase().includes(query),
      )
    }

    records.sort((a, b) => {
      const comparison =
        sortBy.value === 'id'
          ? a.id.toString().localeCompare(b.id.toString())
          : a.item.localeCompare(b.item)
      return sortDesc.value ? -comparison : comparison
    })

    return records
  })

  const paginatedRequests = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value
    const end = start + itemsPerPage.value
    return filteredRequests.value.slice(start, end)
  })

  const totalPages = computed(() => Math.ceil(filteredRequests.value.length / itemsPerPage.value))

  // Actions
  async function loadRequests() {
    try {
      loading.value = true
      error.value = null

      const authStore = useAuthStore()
      if (!authStore.isAuthenticated) {
        console.log('Not authenticated, skipping request load')
        return
      }

      const response = await requestAPI.getAllRequests()
      requests.value = response.data

      return response.data
    } catch (err) {
      console.error('Error loading requests:', err)
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

  // Create request
  const createRequest = async (formData) => {
    try {
      const response = await requestAPI.createRequest(formData)
      await loadRequests()
      return response.data
    } catch (error) {
      console.error('Error creating request:', error)
      throw error
    }
  }

  // Update request
  async function updateRequest(id, formData) {
    try {
      const authStore = useAuthStore()
      const action_by =
        authStore.currentUser?.full_name || authStore.currentUser?.employee_id || 'SYSTEM'
      const payload = { ...formData, action_by }
      const response = await requestAPI.updateRequest(id, payload)
      await loadRequests()
      return response.data
    } catch (error) {
      console.error('Error updating request:', error)
      throw error
    }
  }

  // Delete request
  async function deleteRequest(id) {
    try {
      await requestAPI.deleteRequest(id)
      await loadRequests()
    } catch (error) {
      console.error('Error deleting request:', error)
      throw error
    }
  }

  // Restore request
  async function restoreRequest(id) {
    try {
      const response = await requestAPI.restoreRequest(id)
      await loadRequests()
      return response.data
    } catch (error) {
      console.error('Error restoring request:', error)
      throw error
    }
  }

  // View request details
  async function setSelectedRequest(request) {
    try {
      loading.value = true
      const response = await requestAPI.getRequest(request.id)
      selectedRequest.value = response.data
      showViewModal.value = true
    } catch (error) {
      console.error('Error fetching request details:', error)
      selectedRequest.value = request
      showViewModal.value = true
    } finally {
      loading.value = false
    }
  }

  function closeViewModal() {
    showViewModal.value = false
    selectedRequest.value = null
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
  function searchRequests(query) {
    searchQuery.value = query
  }

  function resetFilters() {
    searchQuery.value = ''
    currentPage.value = 1
    sortBy.value = 'id'
    sortDesc.value = false
  }

  // Batch update status for multiple requests
  async function batchUpdateStatus({ requestIds, newStatus, remarks }) {
    try {
      const authStore = useAuthStore()
      const action_by =
        authStore.currentUser?.full_name || authStore.currentUser?.employee_id || 'SYSTEM'
      const payload = { requestIds, newStatus, action_by, remarks }
      const response = await requestAPI.batchUpdateStatus(payload)
      await loadRequests()
      return response.data
    } catch (error) {
      console.error('Error in batchUpdateStatus:', error)
      throw error
    }
  }

  // Helper to check if a request is resubmittable
  function isResubmittable(status) {
    return [
      'Rejected by SCM',
      'Rejected by Finance',
      'Returned to Requestor',
      'On Hold (No Supplier)',
      'On Hold (No Stock)',
    ].includes(status)
  }

  return {
    // State
    requests,
    currentPage,
    itemsPerPage,
    searchQuery,
    sortBy,
    sortDesc,
    showViewModal,
    selectedRequest,
    loading,
    error,
    showArchived,
    newRequest,

    // Getters
    filteredRequests,
    paginatedRequests,
    totalPages,

    // Actions
    loadRequests,
    createRequest,
    updateRequest,
    deleteRequest,
    restoreRequest,
    setSelectedRequest,
    closeViewModal,
    handleSort,
    searchRequests,
    resetFilters,
    batchUpdateStatus,
    isResubmittable,
  }
})
