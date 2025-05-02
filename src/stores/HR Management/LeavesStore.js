import { defineStore } from 'pinia'
import axios from 'axios'

export const useLeavesStore = defineStore('leaves', {
  state: () => ({
    leaves: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchLeaves() {
      this.loading = true
      try {
        const { data } = await axios.get('/api/leaves')
        this.leaves = data.data.map((leave) => {
          let full_name = leave.employee?.full_name
          if (!full_name && window.__employeeStore) {
            const emp = window.__employeeStore.employees.find(
              (e) => e.employee_id === leave.employee_id,
            )
            full_name = emp?.full_name || leave.employee_id
          }
          return { ...leave, full_name }
        })
        this.error = null
      } catch (error) {
        this.error = error.response?.data?.message || error.message
      } finally {
        this.loading = false
      }
    },
    async approveLeave(id) {
      await axios.patch(`/api/leaves/${id}/approve`)
      await this.fetchLeaves()
    },
    async rejectLeave(id) {
      await axios.patch(`/api/leaves/${id}/reject`)
      await this.fetchLeaves()
    },
    async createLeave(payload) {
      await axios.post('/api/leaves', payload)
      await this.fetchLeaves()
    },
    async updateLeave(id, payload) {
      await axios.put(`/api/leaves/${id}`, payload)
      await this.fetchLeaves()
    },
    async deleteLeave(id) {
      await axios.delete(`/api/leaves/${id}`)
      await this.fetchLeaves()
    },
    async restoreLeave(id) {
      await axios.patch(`/api/leaves/${id}/restore`)
      await this.fetchLeaves()
    },
  },
})
