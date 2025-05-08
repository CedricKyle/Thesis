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

  // Dynamic bulk action for any status
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

  // Single Approve
  async function financeApproveRequest(id, remarks = '') {
    await updateRequest(id, {
      status: 'Approved by Finance',
      finance_remarks: remarks,
    })
  }

  // Single Reject
  async function financeRejectRequest(id, remarks) {
    await updateRequest(id, {
      status: 'Rejected by Finance',
      finance_remarks: remarks,
      finance_rejected_remarks: remarks,
      requestor_rejection_remarks: remarks,
    })
  }

  // Single Hold
  async function financeHoldRequest(id, remarks) {
    await updateRequest(id, {
      status: 'On Hold (Finance)',
      finance_remarks: remarks,
      finance_on_hold_remarks: remarks,
    })
  }

  // Forward to Treasury
  async function financeForwardToTreasury(id, remarks = '') {
    await updateRequest(id, {
      status: 'Forwarded to Treasury',
      finance_remarks: remarks,
    })
  }

  // Batch Approve
  async function batchFinanceApprove(ids, remarks = '') {
    await batchUpdateStatus({
      requestIds: ids,
      newStatus: 'Approved by Finance',
      remarks,
    })
  }

  // Batch Reject
  async function batchFinanceReject(ids, remarks, target = 'SCM') {
    let newStatus = target === 'Requestor' ? 'Returned to Requestor' : 'Returned to SCM'
    await batchUpdateStatus({
      requestIds: ids,
      newStatus,
      remarks,
    })
  }

  // Batch Hold
  async function batchFinanceHold(ids, remarks, target = 'Finance') {
    let newStatus = 'On Hold (Finance)'
    if (target === 'SCM') newStatus = 'On Hold (SCM)'
    else if (target === 'Requestor') newStatus = 'On Hold (Requestor)'
    await batchUpdateStatus({
      requestIds: ids,
      newStatus,
      remarks,
    })
  }

  // Resubmit Request (for SCM/Requestor)
  async function resubmitRequest(id, remarks = '') {
    const authStore = useAuthStore()
    const action_by =
      authStore.currentUser?.full_name || authStore.currentUser?.employee_id || 'SYSTEM'
    await requestAPI.resubmitRequest(id, { action_by, remarks })
    await loadRequests()
  }

  // Resume Request (for Finance)
  async function resumeRequest(id, remarks = '') {
    const authStore = useAuthStore()
    const action_by =
      authStore.currentUser?.full_name || authStore.currentUser?.employee_id || 'SYSTEM'
    await requestAPI.resumeRequest(id, { action_by, remarks })
    await loadRequests()
  }

  async function returnToRequestor(id, remarks, action_by) {
    return await requestAPI.updateRequest(id, {
      status: 'Returned to Requestor',
      remarks,
      action_by,
    })
  }

  async function returnToSCM(id, remarks, action_by) {
    return await requestAPI.updateRequest(id, {
      status: 'Returned to SCM',
      remarks,
      action_by,
    })
  }

  async function holdForRequestor(id, remarks, action_by) {
    return await requestAPI.updateRequest(id, {
      status: 'On Hold (Requestor)',
      remarks,
      action_by,
    })
  }

  async function holdForSCM(id, remarks, action_by) {
    return await requestAPI.updateRequest(id, {
      status: 'On Hold (SCM)',
      remarks,
      action_by,
    })
  }

  async function batchSCMApprove(ids, remarks = '') {
    await batchUpdateStatus({
      requestIds: ids,
      newStatus: 'Approved by SCM',
      remarks,
    })
  }

  async function batchSCMForwardToFinance(ids, remarks = '') {
    await batchUpdateStatus({
      requestIds: ids,
      newStatus: 'Forwarded to Finance',
      remarks,
    })
  }

  // Batch Forward to Treasury
  async function batchFinanceForwardToTreasury(ids, remarks = '') {
    await batchUpdateStatus({
      requestIds: ids,
      newStatus: 'Forwarded to Treasury',
      remarks,
    })
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
    financeApproveRequest,
    financeRejectRequest,
    financeHoldRequest,
    financeForwardToTreasury,
    batchFinanceApprove,
    batchFinanceReject,
    batchFinanceHold,
    resubmitRequest,
    resumeRequest,
    returnToRequestor,
    returnToSCM,
    holdForRequestor,
    holdForSCM,
    batchSCMApprove,
    batchSCMForwardToFinance,
    batchFinanceForwardToTreasury,
  }
})
