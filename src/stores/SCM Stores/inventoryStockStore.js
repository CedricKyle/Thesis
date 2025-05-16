import { defineStore } from 'pinia'
import axios from 'axios'

export const useInventoryStockStore = defineStore('inventoryStockStore', {
  state: () => ({
    stockIns: [],
    stockOuts: [],
    loading: false,
    error: null,
  }),
  actions: {
    // STOCK IN
    async createStockIn(payload) {
      this.loading = true
      this.error = null
      try {
        const res = await axios.post('/api/inventory-stock/in', payload)
        this.stockIns.unshift(res.data.stockIn) // add to top
        return res.data
      } catch (err) {
        this.error = err.response?.data?.message || err.message
        throw err
      } finally {
        this.loading = false
      }
    },
    async fetchStockIns() {
      this.loading = true
      this.error = null
      try {
        const res = await axios.get('/api/inventory-stock/in')
        this.stockIns = res.data
      } catch (err) {
        this.error = err.response?.data?.message || err.message
      } finally {
        this.loading = false
      }
    },

    // STOCK OUT
    async createStockOut(payload) {
      this.loading = true
      this.error = null
      try {
        const res = await axios.post('/api/inventory-stock/out', payload)
        this.stockOuts.unshift(res.data.stockOut) // add to top
        return res.data
      } catch (err) {
        this.error = err.response?.data?.message || err.message
        throw err
      } finally {
        this.loading = false
      }
    },
    async fetchStockOuts() {
      this.loading = true
      this.error = null
      try {
        const res = await axios.get('/api/inventory-stock/out')
        this.stockOuts = res.data
      } catch (err) {
        this.error = err.response?.data?.message || err.message
      } finally {
        this.loading = false
      }
    },
  },
})
