import { defineStore } from 'pinia'
import axios from 'axios'

export const useInventoryStore = defineStore('inventoryStore', {
  state: () => ({
    inventory: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchInventory() {
      this.loading = true
      this.error = null
      try {
        const res = await axios.get('/api/inventory')
        this.inventory = res.data
      } catch (err) {
        this.error = err.response?.data?.message || err.message
      } finally {
        this.loading = false
      }
    },
    async fetchItem(item_code) {
      this.loading = true
      this.error = null
      try {
        const res = await axios.get(`/api/inventory/${item_code}`)
        return res.data
      } catch (err) {
        this.error = err.response?.data?.message || err.message
        throw err
      } finally {
        this.loading = false
      }
    },
    async updateInventory(item_code, payload) {
      this.loading = true
      this.error = null
      try {
        await axios.put(`/api/inventory/${item_code}`, payload)
        await this.fetchInventory()
      } catch (err) {
        this.error = err.response?.data?.message || err.message
      } finally {
        this.loading = false
      }
    },
    // You can add create/update/delete/restore actions here if needed!
  },
})
