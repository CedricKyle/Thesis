import { defineStore } from 'pinia'
import axios from 'axios'

export const usePositionStore = defineStore('positionStore', {
  state: () => ({
    positions: [],
    archivedPositions: [],
    loading: false,
    error: null,
  }),

  actions: {
    async loadPositions() {
      this.loading = true
      this.error = null
      try {
        const res = await axios.get('/api/positions')
        this.positions = res.data
      } catch (err) {
        this.error = err.response?.data?.message || err.message
      } finally {
        this.loading = false
      }
    },

    async loadAllPositions() {
      this.loading = true
      this.error = null
      try {
        const res = await axios.get('/api/positions/all')
        this.archivedPositions = res.data
      } catch (err) {
        this.error = err.response?.data?.message || err.message
      } finally {
        this.loading = false
      }
    },

    async createPosition(position) {
      this.loading = true
      this.error = null
      try {
        const res = await axios.post('/api/positions', position)
        await this.loadPositions()
        return res.data
      } catch (err) {
        this.error = err.response?.data?.message || err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    async updatePosition(id, position) {
      this.loading = true
      this.error = null
      try {
        const res = await axios.put(`/api/positions/${id}`, position)
        await this.loadPositions()
        return res.data
      } catch (err) {
        this.error = err.response?.data?.message || err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    async deletePosition(id) {
      this.loading = true
      this.error = null
      try {
        const res = await axios.delete(`/api/positions/${id}`)
        await this.loadPositions()
        return res.data
      } catch (err) {
        this.error = err.response?.data?.message || err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    async restorePosition(id) {
      this.loading = true
      this.error = null
      try {
        const res = await axios.post(`/api/positions/${id}/restore`)
        await this.loadPositions()
        return res.data
      } catch (err) {
        this.error = err.response?.data?.message || err.message
        throw err
      } finally {
        this.loading = false
      }
    },
  },
})
