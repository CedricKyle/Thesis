import { defineStore } from 'pinia'
import axios from 'axios'

export const useFinanceRequestStore = defineStore('financeRequest', {
  state: () => ({
    requests: [],
    loading: false,
    error: null,
  }),

  getters: {
    pendingRequests: (state) => state.requests.filter((req) => req.request_status === 'Submitted'),
    approvedRequests: (state) => state.requests.filter((req) => req.request_status === 'Approved'),
    rejectedRequests: (state) => state.requests.filter((req) => req.request_status === 'Rejected'),
  },

  actions: {
    async fetchRequests() {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get('/api/scm-requests')
        this.requests = response.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to fetch requests'
        throw err
      } finally {
        this.loading = false
      }
    },

    async approveRequest(requestId, remarks = null) {
      this.loading = true
      this.error = null
      try {
        await axios.post(`/api/scm-requests/${requestId}/approve`, { remarks })
        await this.fetchRequests()
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to approve request'
        throw err
      } finally {
        this.loading = false
      }
    },

    async rejectRequest(requestId, remarks = null) {
      this.loading = true
      this.error = null
      try {
        await axios.post(`/api/scm-requests/${requestId}/reject`, { remarks })
        await this.fetchRequests()
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to reject request'
        throw err
      } finally {
        this.loading = false
      }
    },

    async bulkApproveRequests(requestIds, remarks = null) {
      this.loading = true
      this.error = null
      try {
        await axios.post('/api/scm-requests/bulk-approve', { requestIds, remarks })
        await this.fetchRequests()
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to bulk approve requests'
        throw err
      } finally {
        this.loading = false
      }
    },

    async bulkRejectRequests(requestIds, remarks = null) {
      this.loading = true
      this.error = null
      try {
        await axios.post('/api/scm-requests/bulk-reject', { requestIds, remarks })
        await this.fetchRequests()
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to bulk reject requests'
        throw err
      } finally {
        this.loading = false
      }
    },
  },
})
