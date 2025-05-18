import axios from 'axios'

export const productionDistributionAPI = {
  // Get all branch requests
  async getAllBranchRequests(filters = {}) {
    try {
      return await axios.get('/api/production/branch-requests', { params: filters })
    } catch (error) {
      console.error('Error fetching branch requests:', error)
      throw error
    }
  },

  // Get branch requests for a specific branch
  async getBranchRequests(branchId) {
    try {
      return await axios.get('/api/production/branch-requests', { 
        params: { branch_id: branchId } 
      })
    } catch (error) {
      console.error(`Error fetching branch requests for branch ${branchId}:`, error)
      throw error
    }
  },

  // Get a single branch request by ID
  async getBranchRequestById(requestId) {
    try {
      return await axios.get(`/api/production/branch-requests/${requestId}`)
    } catch (error) {
      console.error(`Error fetching branch request ${requestId}:`, error)
      throw error
    }
  },

  // Create a new branch request
  async createBranchRequest(requestData) {
    try {
      return await axios.post('/api/production/branch-requests', requestData)
    } catch (error) {
      console.error('Error creating branch request:', error)
      throw error
    }
  },

  // Update a branch request's status
  async updateRequestStatus(requestId, status, notes = null) {
    try {
      return await axios.patch(`/api/production/branch-requests/${requestId}/status`, { 
        status,
        notes,
        processed_at: new Date().toISOString()
      })
    } catch (error) {
      console.error(`Error updating branch request ${requestId} status:`, error)
      throw error
    }
  },

  // Create a new distribution
  async createDistribution(distributionData) {
    try {
      return await axios.post('/api/production/distributions', distributionData)
    } catch (error) {
      console.error('Error creating distribution:', error)
      throw error
    }
  },

  // Get all distributions
  async getAllDistributions(filters = {}) {
    try {
      return await axios.get('/api/production/distributions', { params: filters })
    } catch (error) {
      console.error('Error fetching distributions:', error)
      throw error
    }
  },
  
  // Get distributions for a specific branch
  async getBranchDistributions(branchId) {
    try {
      return await axios.get('/api/production/distributions', { 
        params: { branch_id: branchId } 
      })
    } catch (error) {
      console.error(`Error fetching distributions for branch ${branchId}:`, error)
      throw error
    }
  },
  
  // Get a single distribution by ID
  async getDistributionById(distributionId) {
    try {
      return await axios.get(`/api/production/distributions/${distributionId}`)
    } catch (error) {
      console.error(`Error fetching distribution ${distributionId}:`, error)
      throw error
    }
  },
  
  // Update distribution status (received, canceled, etc.)
  async updateDistributionStatus(distributionId, status, notes = null) {
    try {
      return await axios.patch(`/api/production/distributions/${distributionId}/status`, {
        status,
        notes,
        updated_at: new Date().toISOString()
      })
    } catch (error) {
      console.error(`Error updating distribution ${distributionId} status:`, error)
      throw error
    }
  },

  // Branch Distribution Requests

  // Get all branch distribution requests
  async getAllBranchDistributionRequests(filters = {}) {
    try {
      // Call the root endpoint that returns branch requests
      return await axios.get('/api/production/production-distribution/', { params: filters })
    } catch (error) {
      console.error('Error fetching branch distribution requests:', error)
      throw error
    }
  },

  // Get a single branch distribution request by ID
  async getBranchDistributionRequestById(id) {
    try {
      return await axios.get(`/api/production/production-distribution/branch-request/${id}`)
    } catch (error) {
      console.error(`Error fetching branch distribution request ${id}:`, error)
      throw error
    }
  },

  // Create a new branch distribution request
  async createBranchDistributionRequest(data) {
    try {
      // Add current timestamp to the request data
      const requestData = {
        ...data,
        requested_at: new Date().toISOString()
      };
      
      console.log('Submitting branch distribution request:', requestData);
      return await axios.post('/api/production/production-distribution/branch-request', requestData)
    } catch (error) {
      console.error('Error creating branch distribution request:', error)
      
      // Show detailed error information
      if (error.response && error.response.data) {
        console.error('Server error response:', error.response.data);
      }
      
      throw error
    }
  },

  // Update a branch distribution request
  async updateBranchDistributionRequest(id, data) {
    try {
      return await axios.put(`/api/production/branch_distribution_requests/${id}`, data)
    } catch (error) {
      console.error(`Error updating branch distribution request ${id}:`, error)
      throw error
    }
  },

  // Update branch distribution request status
  async updateBranchDistributionRequestStatus(id, status, notes = null) {
    try {
      return await axios.patch(`/api/production/production-distribution/branch-request/${id}/status`, {
        status,
        notes,
        updated_at: new Date().toISOString()
      })
    } catch (error) {
      console.error(`Error updating branch distribution request ${id} status:`, error)
      throw error
    }
  },

  // Delete a branch distribution request
  async deleteBranchDistributionRequest(id) {
    try {
      return await axios.delete(`/api/production/branch_distribution_requests/${id}`)
    } catch (error) {
      console.error(`Error deleting branch distribution request ${id}:`, error)
      throw error
    }
  },

  // Branch Distribution Request Items

  // Get all branch distribution request items
  async getAllBranchDistributionRequestItems(filters = {}) {
    try {
      return await axios.get('/api/production/branch_distribution_request_items', { params: filters })
    } catch (error) {
      console.error('Error fetching branch distribution request items:', error)
      throw error
    }
  },

  // Get branch distribution request items by request ID
  async getItemsByRequestId(requestId) {
    try {
      return await axios.get('/api/production/branch_distribution_request_items', { 
        params: { request_id: requestId }
      })
    } catch (error) {
      console.error(`Error fetching items for request ${requestId}:`, error)
      throw error
    }
  },

  // Get a single branch distribution request item by ID
  async getBranchDistributionRequestItemById(id) {
    try {
      return await axios.get(`/api/production/branch_distribution_request_items/${id}`)
    } catch (error) {
      console.error(`Error fetching branch distribution request item ${id}:`, error)
      throw error
    }
  },

  // Create a new branch distribution request item
  async createBranchDistributionRequestItem(data) {
    try {
      return await axios.post('/api/production/branch_distribution_request_items', data)
    } catch (error) {
      console.error('Error creating branch distribution request item:', error)
      throw error
    }
  },

  // Create multiple branch distribution request items
  async createBranchDistributionRequestItems(items) {
    try {
      return await axios.post('/api/production/branch_distribution_request_items/batch', { items })
    } catch (error) {
      console.error('Error creating multiple branch distribution request items:', error)
      throw error
    }
  },

  // Update a branch distribution request item
  async updateBranchDistributionRequestItem(id, data) {
    try {
      return await axios.put(`/api/production/branch_distribution_request_items/${id}`, data)
    } catch (error) {
      console.error(`Error updating branch distribution request item ${id}:`, error)
      throw error
    }
  },

  // Delete a branch distribution request item
  async deleteBranchDistributionRequestItem(id) {
    try {
      return await axios.delete(`/api/production/branch_distribution_request_items/${id}`)
    } catch (error) {
      console.error(`Error deleting branch distribution request item ${id}:`, error)
      throw error
    }
  }
}

export default productionDistributionAPI 