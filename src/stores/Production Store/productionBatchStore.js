import { defineStore } from 'pinia'
import axios from 'axios'
import { watch } from 'vue'

export const useProductionBatchStore = defineStore('productionBatchStore', {
  state: () => ({
    batches: [],
    finishedGoods: [],
    loading: false,
    error: null,
    stats: {
      total: 0,
      inStock: 0,
      lowStock: 0,
      outOfStock: 0,
    },
  }),
  actions: {
    async fetchBatches() {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get('/api/production/batches')
        this.batches = response.data

        // Calculate stats with null checks
        this.stats = {
          total: this.batches.length,
          inStock: this.batches.filter(
            (batch) =>
              (Number(batch.primary_stock) || 0) + (Number(batch.secondary_stock) || 0) >
              (batch.reorder_point || 0),
          ).length,
          lowStock: this.batches.filter(
            (batch) =>
              (Number(batch.primary_stock) || 0) + (Number(batch.secondary_stock) || 0) <=
                (batch.reorder_point || 0) &&
              (Number(batch.primary_stock) || 0) + (Number(batch.secondary_stock) || 0) > 0,
          ).length,
          outOfStock: this.batches.filter(
            (batch) =>
              (Number(batch.primary_stock) || 0) + (Number(batch.secondary_stock) || 0) === 0,
          ).length,
        }
      } catch (error) {
        console.error('Error fetching batches:', error)
        this.error = error.response?.data?.error || 'Failed to fetch batches'
        throw error
      } finally {
        this.loading = false
      }
    },
    async fetchBatch(id) {
      this.loading = true
      this.error = null
      try {
        const res = await axios.get(`/api/production/batches/${id}`)
        return res.data.data
      } catch (err) {
        this.error = err.response?.data?.message || err.message
        throw err
      } finally {
        this.loading = false
      }
    },
    async fetchRawMaterials() {
      this.loading = true
      this.error = null
      try {
        const res = await axios.get('/api/production/batches/raw-materials')
        return res.data
      } catch (err) {
        this.error = err.response?.data?.message || err.message
        throw err
      } finally {
        this.loading = false
      }
    },
    async createBatch(payload) {
      this.loading = true
      this.error = null
      try {
        const res = await axios.post('/api/production/batches', payload)
        await this.fetchBatches()
        return res.data
      } catch (err) {
        this.error = err.response?.data?.message || err.message
        throw err
      } finally {
        this.loading = false
      }
    },
    async generateForecast(period) {
      this.loading = true
      this.error = null
      try {
        const res = await axios.get(`/api/production/batches/forecast?period=${period}`)
        return res.data.data
      } catch (err) {
        this.error = err.response?.data?.message || err.message
        throw err
      } finally {
        this.loading = false
      }
    },
    async fetchFinishedGoods({ showArchived = false } = {}) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get('/api/production/batches/finished-goods', {
          params: { showArchived },
        })
        this.finishedGoods = response.data
      } catch (error) {
        console.error('Error fetching finished goods:', error)
      } finally {
        this.loading = false
      }
    },
    async fetchBatchByBatchNumber(batchNumber) {
      this.loading = true
      this.error = null
      try {
        const res = await axios.get(`/api/production/batches/batch-number/${batchNumber}`)
        return res.data.data
      } catch (err) {
        this.error = err.response?.data?.message || err.message
        throw err
      } finally {
        this.loading = false
      }
    },
    async fetchFinishedGoodsWithBatch(showArchived = false) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get(
          `/api/production/batches/finished-goods/with-batch?showArchived=${showArchived}`,
        )
        this.finishedGoods = Array.isArray(response.data.data) ? response.data.data : []
      } catch (error) {
        console.error('Error fetching finished goods with batch:', error)
        this.finishedGoods = []
        throw error
      } finally {
        this.loading = false
      }
    },
    async updateFinishedGood({ id, item_name, image }) {
      this.loading = true
      this.error = null
      try {
        const res = await axios.put(`/api/production/batches/finished-goods/${id}`, {
          item_name,
          image,
        })
        // Optionally refresh the finished goods list after update
        await this.fetchFinishedGoodsWithBatch()
        return res.data
      } catch (err) {
        this.error = err.response?.data?.message || err.message
        throw err
      } finally {
        this.loading = false
      }
    },
    async softDeleteFinishedGood(id) {
      this.loading = true
      this.error = null
      try {
        await axios.delete(`/api/production/batches/finished-goods/${id}`)
        // Optionally refresh the finished goods list after delete
        await this.fetchFinishedGoodsWithBatch()
        return true
      } catch (err) {
        this.error = err.response?.data?.message || err.message
        throw err
      } finally {
        this.loading = false
      }
    },
    async restoreFinishedGood(id) {
      this.loading = true
      this.error = null
      try {
        await axios.post(`/api/production/batches/finished-goods/${id}/restore`)
        // Optionally refresh the finished goods list after restore
        await this.fetchFinishedGoodsWithBatch()
        return true
      } catch (err) {
        this.error = err.response?.data?.message || err.message
        throw err
      } finally {
        this.loading = false
      }
    },
  },
})
