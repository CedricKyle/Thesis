import { defineStore } from 'pinia'
import axios from '@/plugins/axios'

export const useTreasurySCMStore = defineStore('treasurySCM', {
  state: () => ({
    requests: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchForReleaseRequests() {
      this.loading = true
      this.error = null
      try {
        // Only fetch requests with payment_status = 'For Release' and request_status = 'Approved'
        const res = await axios.get('/api/scm-requests', {
          params: { payment_status: 'For Release', request_status: 'Approved' },
        })
        this.requests = res.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to fetch requests'
      } finally {
        this.loading = false
      }
    },

    async releaseCash(requestId, amount, receiptFile) {
      this.loading = true
      this.error = null
      try {
        const formData = new FormData()
        formData.append('amount', amount)
        if (receiptFile) formData.append('receipt', receiptFile)
        await axios.post(`/api/treasury/scm-requests/${requestId}/release-cash`, formData)
        await this.fetchForReleaseRequests()
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to release cash'
        throw err
      } finally {
        this.loading = false
      }
    },
  },
})
