import { defineStore } from 'pinia'
import axios from '@/plugins/axios'

export const useMandatoryDeductionStore = defineStore('mandatoryDeduction', {
  state: () => ({
    deductions: [],
    loading: false,
    error: null,
    totalItems: 0,
    currentPage: 1,
  }),

  actions: {
    async fetchDeductions(params = {}) {
      try {
        this.loading = true
        console.log('Fetching deductions with params:', params)
        const response = await axios.get('/api/employee-deductions', {
          params: {
            ...params,
            include_deleted: params.show_inactive, // Add this parameter for archived records
          },
        })
        console.log('Response from server:', response.data)

        // Transform the response data to include status
        this.deductions = response.data.deductions.map((deduction) => {
          const status = deduction.deleted_at ? 'Archived' : deduction.status
          console.log('Deduction status:', {
            id: deduction.id,
            status,
            deleted_at: deduction.deleted_at,
          })
          return {
            ...deduction,
            status,
          }
        })

        this.totalItems = response.data.total
        this.currentPage = response.data.current_page
      } catch (error) {
        console.error('Error fetching deductions:', error)
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async createDeduction(deductionData) {
      try {
        this.loading = true
        // Format the data before sending
        const formattedData = {
          ...deductionData,
          deduction_type: deductionData.deduction_type || 'SSS',
          salary_range_from: parseFloat(deductionData.salary_range_from),
          salary_range_to: parseFloat(deductionData.salary_range_to),
          percentage_rate: parseFloat(deductionData.percentage_rate),
          employer_share: parseFloat(deductionData.employer_share),
          employee_share: parseFloat(deductionData.employee_share),
          minimum_contribution: deductionData.minimum_contribution
            ? parseFloat(deductionData.minimum_contribution)
            : null,
          maximum_contribution: deductionData.maximum_contribution
            ? parseFloat(deductionData.maximum_contribution)
            : null,
          effective_date: deductionData.effective_date || new Date().toISOString().split('T')[0],
        }

        const response = await axios.post('/api/employee-deductions', formattedData)
        await this.fetchDeductions()
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateDeduction(id, deductionData) {
      try {
        this.loading = true
        console.log('Store received deductionData:', deductionData)

        // Format the data before sending
        const formattedData = {
          ...deductionData,
          salary_range_from: parseFloat(deductionData.salary_range_from),
          salary_range_to: parseFloat(deductionData.salary_range_to),
          percentage_rate: parseFloat(deductionData.percentage_rate),
          employer_share: parseFloat(deductionData.employer_share),
          employee_share: parseFloat(deductionData.employee_share),
          minimum_contribution: deductionData.minimum_contribution
            ? parseFloat(deductionData.minimum_contribution)
            : null,
          maximum_contribution: deductionData.maximum_contribution
            ? parseFloat(deductionData.maximum_contribution)
            : null,
          effective_date: deductionData.effective_date,
        }

        console.log('Data being sent to server:', formattedData)
        console.log('Full data structure:', JSON.stringify(formattedData, null, 2))

        const response = await axios.put(`/api/employee-deductions/${id}`, formattedData)
        await this.fetchDeductions()
        return response.data
      } catch (error) {
        console.error('Store updateDeduction error:', error)
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          errors: error.response?.data?.errors,
          status: error.response?.status,
        })
        this.error = error.response?.data?.message || error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteDeduction(id) {
      try {
        this.loading = true
        await axios.delete(`/api/employee-deductions/${id}`)
        await this.fetchDeductions()
      } catch (error) {
        this.error = error.response?.data?.message || error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async restoreDeduction(id) {
      try {
        this.loading = true
        console.log('Attempting to restore deduction:', id)
        const response = await axios.post(`/api/employee-deductions/${id}/restore`)
        console.log('Restore response:', response.data)

        // Refresh the deductions list with the current archive state
        await this.fetchDeductions({ show_inactive: true })
        return response.data
      } catch (error) {
        console.error('Error in restoreDeduction:', error)
        this.error = error.response?.data?.message || error.message
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})
