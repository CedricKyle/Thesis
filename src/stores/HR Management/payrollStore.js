import { defineStore } from 'pinia'
import axios from 'axios'

export const usePayrollStore = defineStore('payroll', {
  state: () => ({
    payrolls: [],
    auditLogs: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchPayrolls(params = {}) {
      this.loading = true
      try {
        // Provide default dates if not supplied
        if (!params.start_date || !params.end_date) {
          // Example: fetch current month
          const now = new Date()
          const year = now.getFullYear()
          const month = String(now.getMonth() + 1).padStart(2, '0')
          params.start_date = `${year}-${month}-01`
          params.end_date = `${year}-${month}-15` // or calculate last day of month
        }
        const { data } = await axios.get('/api/payrolls', { params })
        this.payrolls = data.data
      } catch (err) {
        this.error = err
      } finally {
        this.loading = false
      }
    },
    async submitPayroll(id) {
      await axios.post(`/api/payrolls/${id}/submit`)
      await this.fetchPayrolls()
    },
    async approvePayroll(id) {
      await axios.post(`/api/payrolls/${id}/approve`)
      await this.fetchPayrolls()
    },
    async rejectPayroll(id, remarks) {
      await axios.post(`/api/payrolls/${id}/reject`, { remarks })
      await this.fetchPayrolls()
    },
    async processPayroll(id) {
      await axios.post(`/api/payrolls/${id}/process`)
      await this.fetchPayrolls()
    },
    async editPayroll(id, updates) {
      await axios.patch(`/api/payrolls/${id}`, updates)
      await this.fetchPayrolls()
    },
    async fetchAuditLogs(payrollId) {
      const { data } = await axios.get(`/api/payrolls/audit-logs`, {
        params: { payroll_id: payrollId },
      })
      this.auditLogs = data.data
    },
    async generatePayroll({ start_date, end_date }) {
      await axios.post('/api/payrolls/generate', { start_date, end_date })
    },
  },
})
