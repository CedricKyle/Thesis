// import { defineStore } from 'pinia'
// import axios from 'axios'

// export const useProductionDistributionStore = defineStore('productionDistribution', {
//   state: () => ({
//     branchRequests: [],
//     branchDistributionRequests: [],
//     branchDistributionRequestItems: [],
//     loading: false,
//     error: null,
//   }),
//   actions: {
//     async fetchBranchRequests(filters = {}) {
//       this.loading = true
//       try {
//         const res = await axios.get('/api/production/branch-requests', { params: filters })
//         this.branchRequests = res.data.data || res.data
//       } catch (err) {
//         this.error = err
//         throw err
//       } finally {
//         this.loading = false
//       }
//     },
//     async fetchBranchDistributionRequests(filters = {}) {
//       this.loading = true
//       try {
//         const res = await axios.get('/api/production/production-distribution/', { params: filters })
//         this.branchDistributionRequests = res.data.data || res.data
//       } catch (err) {
//         this.error = err
//         throw err
//       } finally {
//         this.loading = false
//       }
//     },
//     async fetchBranchDistributionRequestById(id) {
//       this.loading = true
//       try {
//         const res = await axios.get(`/api/production/production-distribution/branch-request/${id}`)
//         return res.data
//       } catch (err) {
//         this.error = err
//         throw err
//       } finally {
//         this.loading = false
//       }
//     },
//     async fetchBranchDistributionRequestItems(filters = {}) {
//       this.loading = true
//       try {
//         const res = await axios.get('/api/production/branch_distribution_request_items', {
//           params: filters,
//         })
//         this.branchDistributionRequestItems = res.data.data || res.data
//       } catch (err) {
//         this.error = err
//         throw err
//       } finally {
//         this.loading = false
//       }
//     },
//     async createBranchDistributionRequest(data) {
//       this.loading = true
//       try {
//         const res = await axios.post('/api/production/production-distribution/branch-request', data)
//         await this.fetchBranchDistributionRequests()
//         return res.data
//       } catch (err) {
//         this.error = err
//         throw err
//       } finally {
//         this.loading = false
//       }
//     },
//     async updateBranchDistributionRequest(id, data) {
//       this.loading = true
//       try {
//         const res = await axios.put(`/api/production/branch_distribution_requests/${id}`, data)
//         await this.fetchBranchDistributionRequests()
//         return res.data
//       } catch (err) {
//         this.error = err
//         throw err
//       } finally {
//         this.loading = false
//       }
//     },
//     async updateBranchDistributionRequestStatus(id, status, notes = null) {
//       this.loading = true
//       try {
//         const res = await axios.patch(
//           `/api/production/production-distribution/branch-request/${id}/status`,
//           {
//             status,
//             notes,
//             updated_at: new Date().toISOString(),
//           },
//         )
//         await this.fetchBranchDistributionRequests()
//         return res.data
//       } catch (err) {
//         this.error = err
//         throw err
//       } finally {
//         this.loading = false
//       }
//     },
//     async deleteBranchDistributionRequest(id) {
//       this.loading = true
//       try {
//         const res = await axios.delete(`/api/production/branch_distribution_requests/${id}`)
//         await this.fetchBranchDistributionRequests()
//         return res.data
//       } catch (err) {
//         this.error = err
//         throw err
//       } finally {
//         this.loading = false
//       }
//     },
//     async fetchBranchRequestsByBranchId(branchId) {
//       this.loading = true
//       try {
//         const res = await axios.get('/api/production/branch-requests', {
//           params: { branch_id: branchId },
//         })
//         this.branchRequests = res.data.data || res.data
//         return this.branchRequests
//       } catch (err) {
//         this.error = err
//         throw err
//       } finally {
//         this.loading = false
//       }
//     },
//     async fetchBranchRequestById(requestId) {
//       this.loading = true
//       try {
//         const res = await axios.get(`/api/production/branch-requests/${requestId}`)
//         return res.data
//       } catch (err) {
//         this.error = err
//         throw err
//       } finally {
//         this.loading = false
//       }
//     },
//     async createBranchRequest(requestData) {
//       this.loading = true
//       try {
//         const res = await axios.post('/api/production/branch-requests', requestData)
//         await this.fetchBranchRequests()
//         return res.data
//       } catch (err) {
//         this.error = err
//         throw err
//       } finally {
//         this.loading = false
//       }
//     },
//     async updateBranchRequestStatus(requestId, status, notes = null) {
//       this.loading = true
//       try {
//         const res = await axios.patch(`/api/production/branch-requests/${requestId}/status`, {
//           status,
//           notes,
//           processed_at: new Date().toISOString(),
//         })
//         await this.fetchBranchRequests()
//         return res.data
//       } catch (err) {
//         this.error = err
//         throw err
//       } finally {
//         this.loading = false
//       }
//     },
//     async createDistribution(distributionData) {
//       this.loading = true
//       try {
//         const res = await axios.post('/api/production/distributions', distributionData)
//         await this.fetchAllDistributions()
//         return res.data
//       } catch (err) {
//         this.error = err
//         throw err
//       } finally {
//         this.loading = false
//       }
//     },
//     async fetchAllDistributions(filters = {}) {
//       this.loading = true
//       try {
//         const res = await axios.get('/api/production/distributions', { params: filters })
//         return res.data.data || res.data
//       } catch (err) {
//         this.error = err
//         throw err
//       } finally {
//         this.loading = false
//       }
//     },
//     async fetchBranchDistributions(branchId) {
//       this.loading = true
//       try {
//         const res = await axios.get('/api/production/distributions', {
//           params: { branch_id: branchId },
//         })
//         return res.data.data || res.data
//       } catch (err) {
//         this.error = err
//         throw err
//       } finally {
//         this.loading = false
//       }
//     },
//     async fetchDistributionById(distributionId) {
//       this.loading = true
//       try {
//         const res = await axios.get(`/api/production/distributions/${distributionId}`)
//         return res.data
//       } catch (err) {
//         this.error = err
//         throw err
//       } finally {
//         this.loading = false
//       }
//     },
//     async updateDistributionStatus(distributionId, status, notes = null) {
//       this.loading = true
//       try {
//         const res = await axios.patch(`/api/production/distributions/${distributionId}/status`, {
//           status,
//           notes,
//           updated_at: new Date().toISOString(),
//         })
//         await this.fetchAllDistributions()
//         return res.data
//       } catch (err) {
//         this.error = err
//         throw err
//       } finally {
//         this.loading = false
//       }
//     },
//     async fetchItemsByRequestId(requestId) {
//       this.loading = true
//       try {
//         const res = await axios.get('/api/production/branch_distribution_request_items', {
//           params: { request_id: requestId },
//         })
//         return res.data.data || res.data
//       } catch (err) {
//         this.error = err
//         throw err
//       } finally {
//         this.loading = false
//       }
//     },
//     async fetchBranchDistributionRequestItemById(id) {
//       this.loading = true
//       try {
//         const res = await axios.get(`/api/production/branch_distribution_request_items/${id}`)
//         return res.data
//       } catch (err) {
//         this.error = err
//         throw err
//       } finally {
//         this.loading = false
//       }
//     },
//     async createBranchDistributionRequestItem(data) {
//       this.loading = true
//       try {
//         const res = await axios.post('/api/production/branch_distribution_request_items', data)
//         await this.fetchBranchDistributionRequestItems()
//         return res.data
//       } catch (err) {
//         this.error = err
//         throw err
//       } finally {
//         this.loading = false
//       }
//     },
//     async createBranchDistributionRequestItems(items) {
//       this.loading = true
//       try {
//         const res = await axios.post('/api/production/branch_distribution_request_items/batch', {
//           items,
//         })
//         await this.fetchBranchDistributionRequestItems()
//         return res.data
//       } catch (err) {
//         this.error = err
//         throw err
//       } finally {
//         this.loading = false
//       }
//     },
//     async updateBranchDistributionRequestItem(id, data) {
//       this.loading = true
//       try {
//         const res = await axios.put(`/api/production/branch_distribution_request_items/${id}`, data)
//         await this.fetchBranchDistributionRequestItems()
//         return res.data
//       } catch (err) {
//         this.error = err
//         throw err
//       } finally {
//         this.loading = false
//       }
//     },
//     async deleteBranchDistributionRequestItem(id) {
//       this.loading = true
//       try {
//         const res = await axios.delete(`/api/production/branch_distribution_request_items/${id}`)
//         await this.fetchBranchDistributionRequestItems()
//         return res.data
//       } catch (err) {
//         this.error = err
//         throw err
//       } finally {
//         this.loading = false
//       }
//     },
//   },
// })
