import { defineStore } from 'pinia'
import axios from 'axios'

export const useDeliveryStore = defineStore('deliveryStore', {
  state: () => ({
    deliveries: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchDeliveries() {
      this.loading = true
      this.error = null
      try {
        const res = await axios.get('/api/deliveries')
        this.deliveries = res.data
      } catch (err) {
        this.error = err.response?.data?.message || err.message
      } finally {
        this.loading = false
      }
    },
    async createDelivery(payload) {
      this.loading = true
      this.error = null
      try {
        const res = await axios.post('/api/deliveries', payload)
        this.deliveries.push(res.data)
      } catch (err) {
        this.error = err.response?.data?.message || err.message
      } finally {
        this.loading = false
      }
    },
    async receiveDelivery(id, payload) {
      this.loading = true
      this.error = null
      try {
        const res = await axios.post(`/api/deliveries/${id}/receive`, payload)
        // Update the delivery in the list
        const idx = this.deliveries.findIndex((d) => d.id === id)
        if (idx !== -1) this.deliveries[idx] = res.data.delivery
        return res.data // <-- return the full response data!
      } catch (err) {
        this.error = err.response?.data?.message || err.message
        throw err // propagate error for frontend handling
      } finally {
        this.loading = false
      }
    },
    async cancelDelivery(id, payload) {
      this.loading = true
      this.error = null
      try {
        const res = await axios.post(`/api/deliveries/${id}/cancel`, payload)
        // Update the delivery in the list
        const idx = this.deliveries.findIndex((d) => d.id === id)
        if (idx !== -1) this.deliveries[idx] = res.data.delivery
      } catch (err) {
        this.error = err.response?.data?.message || err.message
      } finally {
        this.loading = false
      }
    },
    async updateDelivery(id, payload) {
      this.loading = true
      this.error = null
      try {
        const res = await axios.put(`/api/deliveries/${id}`, payload)
        // Update the delivery in the list
        const idx = this.deliveries.findIndex((d) => d.id === id)
        if (idx !== -1) this.deliveries[idx] = res.data.delivery
      } catch (err) {
        this.error = err.response?.data?.message || err.message
      } finally {
        this.loading = false
      }
    },
    async markAsPaid(id, paid_by) {
      this.loading = true
      this.error = null
      try {
        const res = await axios.post(`/api/deliveries/${id}/mark-paid`, { paid_by })
        // Update the delivery in the list
        const idx = this.deliveries.findIndex((d) => d.id === id)
        if (idx !== -1) this.deliveries[idx] = res.data.delivery
      } catch (err) {
        this.error = err.response?.data?.message || err.message
      } finally {
        this.loading = false
      }
    },
  },
})
