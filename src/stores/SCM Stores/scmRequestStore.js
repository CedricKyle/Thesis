import { defineStore } from 'pinia'
import axios from 'axios'

export const useSCMRequestStore = defineStore('scmRequest', {
  state: () => ({
    requests: [],
    currentRequest: null,
    loading: false,
    error: null,
  }),
  actions: {
    async fetchRequests(showArchived = false) {
      this.loading = true
      this.error = null
      try {
        const res = await axios.get('/api/scm-requests', {
          params: { showArchived },
        })
        this.requests = res.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to fetch requests'
      } finally {
        this.loading = false
      }
    },
    async fetchRequestById(requestId) {
      this.loading = true
      this.error = null
      try {
        const res = await axios.get(`/api/scm-requests/${requestId}`)
        this.currentRequest = res.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to fetch request'
      } finally {
        this.loading = false
      }
    },
    async createRequest(payload) {
      this.loading = true
      this.error = null
      try {
        const res = await axios.post('/api/scm-requests', payload)
        // Optionally, refetch or push to requests
        await this.fetchRequests()
        return res.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to create request'
        throw err
      } finally {
        this.loading = false
      }
    },
    async cancelRequest(requestId) {
      this.loading = true
      this.error = null
      try {
        await axios.delete(`/api/scm-requests/${requestId}`)
        await this.fetchRequests()
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to cancel request'
        throw err
      } finally {
        this.loading = false
      }
    },
    clearCurrentRequest() {
      this.currentRequest = null
    },
    async updateRequest(id, payload) {
      this.loading = true
      this.error = null
      try {
        const res = await axios.put(`/api/scm-requests/${id}`, payload)
        await this.fetchRequests()
        return res.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to update request'
        throw err
      } finally {
        this.loading = false
      }
    },
    async restoreRequest(requestId) {
      this.loading = true
      this.error = null
      try {
        await axios.post(`/api/scm-requests/${requestId}/restore`)
        await this.fetchRequests(true) // fetch archived after restore
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to restore request'
        throw err
      } finally {
        this.loading = false
      }
    },
    async submitToFinance(requestId) {
      this.loading = true
      this.error = null
      try {
        await axios.post(`/api/scm-requests/${requestId}/submit-to-finance`)
        await this.fetchRequests()
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to submit to finance'
        throw err
      } finally {
        this.loading = false
      }
    },
    async approveRequest(requestId) {
      this.loading = true
      this.error = null
      try {
        await axios.post(`/api/scm-requests/${requestId}/approve`)
        await this.fetchRequests()
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to approve request'
        throw err
      } finally {
        this.loading = false
      }
    },
    async rejectRequest(requestId) {
      this.loading = true
      this.error = null
      try {
        await axios.post(`/api/scm-requests/${requestId}/reject`)
        await this.fetchRequests()
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to reject request'
        throw err
      } finally {
        this.loading = false
      }
    },
    async fetchApprovedRequests() {
      this.loading = true
      this.error = null
      try {
        const res = await axios.get('/api/scm-requests', {
          params: { request_status: 'Approved' },
        })
        return res.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to fetch approved requests'
        throw err
      } finally {
        this.loading = false
      }
    },
  },
})
