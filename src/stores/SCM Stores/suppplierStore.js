import { defineStore } from 'pinia'
import axios from '@/plugins/axios'
export const useSupplierStore = defineStore('supplierStore', {
  state: () => ({
    suppliers: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchSuppliers({ archived = false } = {}) {
      this.loading = true
      this.error = null
      try {
        const res = await axios.get('/api/suppliers', {
          params: { archived },
        })
        this.suppliers = res.data.data
      } catch (err) {
        this.error = err.response?.data?.message || err.message
      } finally {
        this.loading = false
      }
    },
    async createSupplier(payload) {
      this.loading = true
      this.error = null
      try {
        const res = await axios.post('/api/suppliers', payload)
        this.suppliers.push(res.data.data)
      } catch (err) {
        this.error = err.response?.data?.message || err.message
      } finally {
        this.loading = false
      }
    },
    async updateSupplier(id, payload) {
      this.loading = true
      this.error = null
      try {
        const res = await axios.put(`/api/suppliers/${id}`, payload)
        const idx = this.suppliers.findIndex((s) => s.id === id)
        if (idx !== -1) this.suppliers[idx] = res.data.data
      } catch (err) {
        this.error = err.response?.data?.message || err.message
      } finally {
        this.loading = false
      }
    },
    async archiveSupplier(id) {
      this.loading = true
      this.error = null
      try {
        const res = await axios.delete(`/api/suppliers/${id}`)
        await this.fetchSuppliers({ archived: true })
      } catch (err) {
        this.error = err.response?.data?.message || err.message
      } finally {
        this.loading = false
      }
    },
    async restoreSupplier(id) {
      this.loading = true
      this.error = null
      try {
        await axios.post(`/api/suppliers/${id}/restore`)
        await this.fetchSuppliers({ archived: true })
      } catch (err) {
        this.error = err.response?.data?.message || err.message
      } finally {
        this.loading = false
      }
    },
  },
})
