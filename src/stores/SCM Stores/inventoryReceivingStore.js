import { defineStore } from 'pinia'
import axios from '@/plugins/axios'
export const useInventoryReceivingStore = defineStore('inventoryReceivingStore', {
  state: () => ({
    receivings: [],
    loading: false,
    error: null,
  }),
  actions: {
    async createReceiving(payload) {
      this.loading = true
      this.error = null
      try {
        const res = await axios.post('/api/inventory-receivings', payload)
        this.receivings.push(res.data)
        return res.data
      } catch (err) {
        this.error = err.response?.data?.message || err.message
        throw err
      } finally {
        this.loading = false
      }
    },
    async fetchReceivings() {
      this.loading = true
      this.error = null
      try {
        const res = await axios.get('/api/inventory-receivings')
        this.receivings = res.data
      } catch (err) {
        this.error = err.response?.data?.message || err.message
      } finally {
        this.loading = false
      }
    },
  },
})
