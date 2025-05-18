import { defineStore } from 'pinia'
import axios from '@/plugins/axios'
export const useInventoryStore = defineStore('inventory', {
  state: () => ({
    // Products
    products: [],
    selectedProduct: null,
    productPriceHistory: [],

    // Stock Movements
    stockIns: [],
    stockOuts: [],
    stockAdjustments: [],

    // Loading States
    loading: false,
    error: null,
    success: null,
  }),

  actions: {
    // Reset Messages
    resetMessages() {
      this.error = null
      this.success = null
    },

    // ============ INVENTORY PRODUCTS ============
    async fetchProducts(showArchived = false) {
      try {
        this.loading = true
        const response = await axios.get('/api/inventory', {
          params: { showArchived },
        })
        this.products = response.data.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to fetch products'
      } finally {
        this.loading = false
      }
    },

    async createProduct(formData) {
      try {
        this.loading = true
        const response = await axios.post('/api/inventory', formData)
        this.products.push(response.data.data)
        this.success = 'Product created successfully'
        return response.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to create product'
        throw err
      } finally {
        this.loading = false
      }
    },

    async updateProduct(id, formData) {
      try {
        this.loading = true
        const response = await axios.put(`/api/inventory/${id}`, formData)
        const index = this.products.findIndex((p) => p.id === id)
        if (index !== -1) this.products[index] = response.data.data
        this.success = 'Product updated successfully'
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to update product'
        throw err
      } finally {
        this.loading = false
      }
    },

    async deleteProduct(id) {
      try {
        this.loading = true
        // Change PATCH to DELETE
        await axios.delete(`/api/inventory/${id}`)
        // Remove from local products array
        this.products = this.products.filter((p) => p.id !== id)
        this.success = 'Product deleted successfully'
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to delete product'
        throw err
      } finally {
        this.loading = false
      }
    },

    async restoreProduct(id) {
      try {
        this.loading = true
        // Call restore endpoint
        const response = await axios.patch(`/api/inventory/restore/${id}`)
        // Add back to products array
        this.products.push(response.data.data)
        this.success = 'Product restored successfully'
        return response.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to restore product'
        throw err
      } finally {
        this.loading = false
      }
    },

    // ============ STOCK IN ============
    async createStockIn(formData) {
      try {
        this.loading = true
        const response = await axios.post('/api/stock-in', formData)
        this.stockIns.unshift(response.data.data)
        // Update product quantity in products array
        const product = this.products.find((p) => p.id === response.data.data.product_id)
        if (product) {
          product.quantity = parseFloat(product.quantity) + parseFloat(response.data.data.quantity)
        }
        this.success = 'Stock in recorded successfully'
        return response.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to record stock in'
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchStockIns() {
      try {
        this.loading = true
        const response = await axios.get('/api/stock-in')
        this.stockIns = response.data.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to fetch stock ins'
      } finally {
        this.loading = false
      }
    },

    // ============ STOCK OUT ============
    async createStockOut(formData) {
      try {
        this.loading = true
        const response = await axios.post('/api/stock-out', formData)
        this.stockOuts.unshift(response.data.data)
        // Update product quantity in products array
        const product = this.products.find((p) => p.id === response.data.data.product_id)
        if (product) {
          product.quantity = parseFloat(product.quantity) - parseFloat(response.data.data.quantity)
        }
        this.success = 'Stock out recorded successfully'
        return response.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to record stock out'
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchStockOuts() {
      try {
        this.loading = true
        const response = await axios.get('/api/stock-out')
        this.stockOuts = response.data.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to fetch stock outs'
      } finally {
        this.loading = false
      }
    },

    // ============ STOCK ADJUSTMENT ============
    async createStockAdjustment(formData) {
      try {
        this.loading = true
        const response = await axios.post('/api/stock-adjustment', formData)
        this.stockAdjustments.unshift(response.data.data)
        // Update product quantity in products array
        const product = this.products.find((p) => p.id === response.data.data.product_id)
        if (product) {
          product.quantity = parseFloat(response.data.data.new_quantity)
        }
        this.success = 'Stock adjustment recorded successfully'
        return response.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to record adjustment'
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchStockAdjustments() {
      try {
        this.loading = true
        const response = await axios.get('/api/stock-adjustment')
        this.stockAdjustments = response.data.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to fetch adjustments'
      } finally {
        this.loading = false
      }
    },

    async deleteStockAdjustment(id) {
      try {
        this.loading = true
        await axios.delete(`/api/stock-adjustment/${id}`)
        this.stockAdjustments = this.stockAdjustments.filter((a) => a.id !== id)
        this.success = 'Adjustment deleted successfully'
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to delete adjustment'
      } finally {
        this.loading = false
      }
    },

    async restoreStockAdjustment(id) {
      try {
        this.loading = true
        const response = await axios.patch(`/api/stock-adjustment/restore/${id}`)
        this.stockAdjustments.push(response.data.data)
        this.success = 'Adjustment restored successfully'
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to restore adjustment'
      } finally {
        this.loading = false
      }
    },

    // ============ PRICE HISTORY ============
    async fetchPriceHistory(productId) {
      try {
        this.loading = true
        const response = await axios.get(`/api/inventory/price-history/${productId}`)
        this.productPriceHistory = response.data.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to fetch price history'
      } finally {
        this.loading = false
      }
    },

    async fetchProductMovements(productId) {
      try {
        this.loading = true
        // Fetch all movements for this product
        const [ins, outs, adjustments] = await Promise.all([
          axios.get('/api/stock-in'),
          axios.get('/api/stock-out'),
          axios.get('/api/stock-adjustment'),
        ])
        // Filter by productId
        const stockIns = ins.data.data.filter((m) => m.product_id == productId)
        const stockOuts = outs.data.data.filter((m) => m.product_id == productId)
        const stockAdjustments = adjustments.data.data.filter((m) => m.product_id == productId)
        // Combine and sort by date (descending)
        const allMovements = [
          ...stockIns.map((m) => ({
            date: m.date,
            type: 'Stock In',
            quantity: m.quantity,
            remarks: m.remarks || '',
          })),
          ...stockOuts.map((m) => ({
            date: m.date,
            type: 'Stock Out',
            quantity: '-' + m.quantity,
            remarks: m.remarks || '',
          })),
          ...stockAdjustments.map((m) => ({
            date: m.created_at?.split('T')[0] || m.date,
            type: 'Adjustment',
            quantity: m.new_quantity - m.old_quantity,
            remarks: m.remarks || m.reason || '',
          })),
        ].sort((a, b) => new Date(b.date) - new Date(a.date))
        return allMovements
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to fetch product movements'
        return []
      } finally {
        this.loading = false
      }
    },
  },

  getters: {
    // Get product by ID
    getProductById: (state) => (id) => {
      return state.products.find((p) => p.id === id)
    },

    // Get total products count
    totalProducts: (state) => state.products.length,

    // Get products below reorder level (example)
    lowStockProducts: (state) => {
      return state.products.filter((p) => parseFloat(p.quantity) < 10) // adjust threshold as needed
    },

    // Get total value of inventory
    totalInventoryValue: (state) => {
      return state.products.reduce((total, product) => {
        return total + parseFloat(product.quantity) * parseFloat(product.price)
      }, 0)
    },
  },
})
