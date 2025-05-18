<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { useToast } from 'vue-toastification'
import { productionDistributionAPI } from '@/services/main branch/productionDistributionAPI'

// Configure axios base URL for API requests
axios.defaults.baseURL = 'http://localhost:3000'; // Make sure this matches your backend server port

const toast = useToast()

// State variables
const inventory = ref([])
const loading = ref(false)
const searchQuery = ref('')
const selectedCategories = ref([])
const showRequestModal = ref(false)
const requestItems = ref([])
const currentBranch = ref(null)
const remarks = ref('')

// Product request information
const selectedProducts = ref([])

// Track branch requests
const branchRequests = ref([])
const showRequestsModal = ref(false)

// Categories for filtering
const categories = [
  'Food Ingredients',
  'Kitchen Equipment',
  'Packaging Materials',
  'Cleaning Supplies',
  'Raw Materials',
  'Others',
]

// Fetch inventory data
const fetchInventory = async () => {
  loading.value = true
  inventory.value = [] // Clear previous inventory
  try {
    console.log('[FE] Attempting to fetch inventory from:', axios.defaults.baseURL + '/api/branch-operation/inventory');
    const response = await axios.get('/api/branch-operation/inventory')
    console.log('[FE] Raw API Response:', JSON.parse(JSON.stringify(response)));
    
    if (response && response.data) {
      if (response.data.success && Array.isArray(response.data.data)) {
        inventory.value = response.data.data;
        console.log('[FE] Inventory data successfully loaded into inventory.value:', JSON.parse(JSON.stringify(inventory.value)));
      } else if (Array.isArray(response.data)) {
        // Fallback if data is directly an array (e.g. if success/data wrapper is missing)
        inventory.value = response.data;
        console.log('[FE] Inventory data loaded directly into inventory.value (no success/data wrapper):', JSON.parse(JSON.stringify(inventory.value)));
      } else {
        console.error('[FE] Unexpected API response data structure. Expected { success: true, data: [] } or []. Received:', JSON.parse(JSON.stringify(response.data)));
        toast.error('Received unexpected data format from server.');
      }
    } else {
      console.error('[FE] No data received in API response.', JSON.parse(JSON.stringify(response)));
      toast.error('No data received from server.');
    }
  } catch (error) {
    console.error('[FE] Error fetching inventory:', error);
    if (error.response) {
      console.error('[FE] Error response data:', JSON.parse(JSON.stringify(error.response.data)));
      console.error('[FE] Error response status:', error.response.status);
      console.error('[FE] Error response headers:', JSON.parse(JSON.stringify(error.response.headers)));
      toast.error(`Failed to load inventory: ${error.response.data?.message || error.response.statusText || 'Server error'}`);
    } else if (error.request) {
      console.error('[FE] Error request data:', error.request);
      toast.error('Failed to load inventory: No response from server. Check network or backend.');
    } else {
      console.error('[FE] Error message:', error.message);
      toast.error(`Failed to load inventory: ${error.message}`);
    }
  } finally {
    loading.value = false;
    console.log('[FE] fetchInventory finished. Current inventory.value length:', inventory.value.length);
  }
};

// Apply filters to inventory
const filteredInventory = computed(() => {
  console.log('[FE] Computing filteredInventory. Raw inventory.value:', JSON.parse(JSON.stringify(inventory.value)));
  
  if (!Array.isArray(inventory.value)) {
    console.error('[FE] inventory.value is not an array in filteredInventory. Current value:', inventory.value);
    return [];
  }

  const result = inventory.value.filter((item) => {
    // Ensure item is an object and has necessary properties
    if (typeof item !== 'object' || item === null || !item.item_name || !item.item_code) {
      console.warn('[FE] Invalid item structure in inventory.value:', item);
      return false;
    }

    // Add status based on quantity vs reorder_point if not present
    if (!item.status) {
      if (item.quantity <= 0) {
        item.status = 'Out of Stock'
      } else if (item.quantity < item.reorder_point) {
        item.status = 'Low Stock'
      } else {
        item.status = 'In Stock'
      }
    }

    const matchesSearch = 
      item.item_name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.item_code.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    const matchesCategories = 
      selectedCategories.value.length === 0 || 
      selectedCategories.value.includes(item.category)
    
    return matchesSearch && matchesCategories
  });
  
  console.log('[FE] Computed filteredInventory result:', JSON.parse(JSON.stringify(result)));
  return result;
})

// Add item to request
const addToRequest = (item) => {
  const existingItem = selectedProducts.value.find(p => p.id === item.id)
  
  if (existingItem) {
    toast.warning(`${item.item_name} is already in your request`)
    return
  }
  
  selectedProducts.value.push({
    id: item.id,
    item_code: item.item_code,
    item_name: item.item_name,
    unit: item.unit,
    requested_quantity: 1,
    category: item.category
  })
  
  toast.success(`Added ${item.item_name} to request`)
}

// Remove item from request
const removeFromRequest = (itemId) => {
  selectedProducts.value = selectedProducts.value.filter(item => item.id !== itemId)
}

// Submit request to branch distribution
const submitRequest = async () => {
  if (selectedProducts.value.length === 0) {
    toast.error('Please add at least one product to your request')
    return
  }
  
  loading.value = true
  try {
    // Ensure we have a valid branch
    if (!currentBranch.value) {
      currentBranch.value = {
        id: 1,
        name: 'Main Branch'
      }
    }
    
    // Format request items for API
    const requestData = {
      branch_id: currentBranch.value.id,
      branch_name: currentBranch.value.name,
      remarks: remarks.value || '',
      items: selectedProducts.value.map(item => ({
        product_id: item.id || 0,
        product_code: item.item_code || '',
        product_name: item.item_name,
        quantity: item.requested_quantity || 1,
        unit: item.unit || 'pcs',
        category: item.category || 'Others'
      }))
    }
    
    console.log('Submitting distribution request:', JSON.stringify(requestData, null, 2));
    
    // Make the API request with the correct endpoint
    const response = await axios.post('/api/production/production-distribution/branch-request', requestData);
    
    console.log('Request submission response:', response.data);
    
    toast.success('Request submitted successfully')
    selectedProducts.value = []
    remarks.value = ''
    showRequestModal.value = false
    
    // Refresh the branch requests
    fetchBranchRequests()
  } catch (error) {
    console.error('Error submitting request:', error);
    let errorMessage = 'Failed to submit request';
    
    if (error.response) {
      console.error('Response error data:', error.response.data);
      console.error('Response status:', error.response.status);
      errorMessage = error.response.data?.message || errorMessage;
    }
    
    toast.error(errorMessage);
  } finally {
    loading.value = false
  }
}

// Fetch the branch requests for this branch
const fetchBranchRequests = async () => {
  loading.value = true
  try {
    console.log('Fetching branch distribution requests...');
    
    // Match the exact endpoint in our backend routes
    const response = await axios.get('/api/production/production-distribution/branch-requests');
    
    console.log('Branch distribution requests response:', response.data);
    
    // Process the response data
    if (response.data && Array.isArray(response.data)) {
      branchRequests.value = response.data;
    } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
      branchRequests.value = response.data.data;
    } else {
      console.error('Unexpected response format:', response.data);
      branchRequests.value = [];
    }
    
    console.log(`Loaded ${branchRequests.value.length} branch distribution requests`);
  } catch (error) {
    console.error('Error fetching branch distribution requests:', error);
    toast.error('Failed to load request history');
    branchRequests.value = [];
  } finally {
    loading.value = false
  }
}

// Fetch branch request details including items
const viewRequestDetails = async (requestId) => {
  loading.value = true
  try {
    console.log('Fetching request details for request ID:', requestId);
    
    // Match the exact endpoint in our backend routes
    const response = await axios.get(`/api/production/production-distribution/branch-request/${requestId}`);
    
    console.log('Request details response:', response.data);
    
    // Find the request in our list
    const requestIndex = branchRequests.value.findIndex(r => r.id === requestId || r.request_id === requestId);
    
    if (requestIndex !== -1) {
      // Update the request with items
      if (response.data && response.data.items) {
        // If response has items property directly
        branchRequests.value[requestIndex].items = response.data.items;
      } else if (response.data && response.data.data && response.data.data.items) {
        // If items are nested in data property
        branchRequests.value[requestIndex].items = response.data.data.items;
      } else {
        // Try to find items
        const itemsResponse = await axios.get(`/api/production/production-distribution/branch-request-items/${requestId}`);
        if (itemsResponse.data && Array.isArray(itemsResponse.data)) {
          branchRequests.value[requestIndex].items = itemsResponse.data;
        } else {
          console.error('Could not find items for request', requestId);
          branchRequests.value[requestIndex].items = [];
        }
      }
    } else {
      console.error('Request not found in branchRequests:', requestId);
    }
  } catch (error) {
    console.error('Error fetching request details:', error);
    toast.error('Failed to load request details');
  } finally {
    loading.value = false
  }
}

// Show the modal with request history
const viewRequestHistory = () => {
  fetchBranchRequests()
  showRequestsModal.value = true
}

// Fetch current branch information
const fetchCurrentBranch = async () => {
  try {
    // Since we don't have a current-branch API endpoint yet, use a placeholder branch
    // Replace this with an actual API call when available
    currentBranch.value = {
      id: 1,
      name: 'Main Branch'
    }
    /* 
    // Original API call - uncomment when endpoint is available
    const response = await axios.get('/api/current-branch')
    currentBranch.value = response.data
    */
  } catch (error) {
    console.error('Error fetching current branch:', error)
    toast.error('Failed to load branch information')
  }
}

// Test database schema
const testDbSchema = async () => {
  try {
    console.log('Testing database schema...');
    const response = await axios.get('/api/production/production-distribution/test-schema');
    console.log('Database schema response:', response.data);
    
    // Now test a minimal request to see what happens
    const testRequest = {
      branch_id: 1,
      branch_name: 'Main Branch',
      remarks: 'Test request',
      items: [
        {
          product_id: 1,
          product_code: 'TEST-001',
          product_name: 'Test Product',
          quantity: 1,
          unit: 'pcs',
          category: 'Others'
        }
      ]
    };
    
    console.log('Submitting test request:', testRequest);
    
    try {
      const submitResponse = await axios.post('/api/production/production-distribution/branch-request', testRequest);
      console.log('Test request success:', submitResponse.data);
      toast.success('Test request submitted successfully');
    } catch (submitError) {
      console.error('Test request failed:', submitError.response?.data || submitError.message);
      toast.error('Test request failed: ' + (submitError.response?.data?.error || submitError.message));
    }
  } catch (error) {
    console.error('Schema test failed:', error);
    toast.error('Schema test failed: ' + error.message);
  }
};

// Load data on component mount
onMounted(async () => {
  loading.value = true
  try {
    // Test database connection and schema
    await testDbSchema();
    
    // Continue with regular data loading
    await fetchCurrentBranch()
    await fetchInventory()
    await fetchBranchRequests()
  } catch (error) {
    console.error('Error during initial data loading:', error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="p-4">
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Branch Inventory Management</h1>
      <p class="text-gray-600">Manage and monitor your branch inventory</p>
    </div>

    <!-- Inventory Controls -->
    <div class="bg-white rounded-lg shadow p-4 mb-6">
      <div class="flex flex-wrap justify-between items-center gap-4 mb-4">
        <!-- Search Field -->
        <div class="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search items..."
            v-model="searchQuery"
            class="input input-bordered w-full"
          />
        </div>

        <!-- Category Filter -->
        <div class="flex flex-wrap gap-2">
          <template v-for="category in categories" :key="category">
            <button
              @click="
                selectedCategories.includes(category)
                  ? selectedCategories = selectedCategories.filter(c => c !== category)
                  : selectedCategories.push(category)
              "
              :class="[
                'btn btn-sm',
                selectedCategories.includes(category)
                  ? 'btn-primary'
                  : 'btn-outline'
              ]"
            >
              {{ category }}
            </button>
          </template>
        </div>

        <!-- Request Buttons -->
        <div class="flex gap-2">
          <button
            @click="viewRequestHistory"
            class="btn btn-outline btn-info"
          >
            View Request History
          </button>
          <button
            @click="showRequestModal = true"
            class="btn btn-primary"
            :disabled="loading"
          >
            <span class="mr-2">Request Distribution</span>
            <span v-if="selectedProducts.length > 0" class="badge badge-light">{{ selectedProducts.length }}</span>
          </button>
        </div>
      </div>

      <!-- Inventory Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="stat bg-base-200 rounded-lg">
          <div class="stat-title">Total Items</div>
          <div class="stat-value">{{ inventory.length }}</div>
        </div>
        <div class="stat bg-base-200 rounded-lg">
          <div class="stat-title">Low Stock Items</div>
          <div class="stat-value text-warning">{{ inventory.filter(i => i.status === 'Low Stock').length }}</div>
        </div>
        <div class="stat bg-base-200 rounded-lg">
          <div class="stat-title">Out of Stock Items</div>
          <div class="stat-value text-error">{{ inventory.filter(i => i.status === 'Out of Stock').length }}</div>
        </div>
      </div>

      <!-- Inventory Table -->
      <div class="overflow-x-auto">
        <table class="table w-full">
          <thead>
            <tr>
              <th>Item Code</th>
              <th>Name</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Unit</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="text-center py-4">Loading inventory data...</td>
            </tr>
            <tr v-else-if="filteredInventory.length === 0">
              <td colspan="7" class="text-center py-4">No items found</td>
            </tr>
            <tr v-for="item in filteredInventory" :key="item.id" :class="{
              'bg-warning bg-opacity-10': item.status === 'Low Stock',
              'bg-error bg-opacity-10': item.status === 'Out of Stock'
            }">
              <td>{{ item.item_code }}</td>
              <td>{{ item.item_name }}</td>
              <td>{{ item.category }}</td>
              <td>{{ item.quantity }}</td>
              <td>{{ item.unit }}</td>
              <td>
                <span :class="{
                  'badge badge-success': item.status === 'In Stock',
                  'badge badge-warning': item.status === 'Low Stock',
                  'badge badge-error': item.status === 'Out of Stock'
                }">{{ item.status }}</span>
              </td>
              <td>
                <button
                  @click="addToRequest(item)"
                  class="btn btn-xs btn-primary"
                  :disabled="selectedProducts.some(p => p.id === item.id)"
                >
                  Request
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Request Distribution Modal -->
  <div class="modal" :class="{ 'modal-open': showRequestModal }">
    <div class="modal-box w-11/12 max-w-4xl">
      <h3 class="font-bold text-lg mb-4">Request Product Distribution</h3>
      
      <div class="mb-4">
        <p class="font-medium">Branch: {{ currentBranch?.name || 'Unknown Branch' }}</p>
      </div>
      
      <div class="mb-4">
        <label class="label font-medium">Remarks</label>
        <textarea 
          v-model="remarks" 
          class="textarea textarea-bordered w-full" 
          placeholder="Additional notes for your request"
        ></textarea>
      </div>
      
      <!-- Selected Products Table -->
      <div class="overflow-x-auto mb-4">
        <table class="table w-full">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Unit</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="selectedProducts.length === 0">
              <td colspan="5" class="text-center py-4">No products selected</td>
            </tr>
            <tr v-for="product in selectedProducts" :key="product.id">
              <td>{{ product.item_name }}</td>
              <td>{{ product.category }}</td>
              <td>
                <input 
                  type="number" 
                  v-model.number="product.requested_quantity"
                  min="1"
                  class="input input-bordered input-sm w-20"
                />
              </td>
              <td>{{ product.unit }}</td>
              <td>
                <button 
                  @click="removeFromRequest(product.id)" 
                  class="btn btn-xs btn-error"
                >
                  Remove
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="modal-action">
        <button 
          @click="showRequestModal = false" 
          class="btn btn-ghost"
        >
          Cancel
        </button>
        <button 
          @click="submitRequest" 
          class="btn btn-primary" 
          :disabled="loading || selectedProducts.length === 0"
        >
          {{ loading ? 'Submitting...' : 'Submit Request' }}
        </button>
      </div>
    </div>
    <div class="modal-backdrop" @click="showRequestModal = false"></div>
  </div>

  <!-- Request History Modal -->
  <div class="modal" :class="{ 'modal-open': showRequestsModal }">
    <div class="modal-box w-11/12 max-w-4xl">
      <h3 class="font-bold text-lg mb-4">Request History</h3>
      
      <div class="overflow-x-auto">
        <table class="table w-full">
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Branch</th>
              <th>Status</th>
              <th>Requested At</th>
              <th>Approved At</th>
              <th>Rejected At</th>
              <th>Rejection Reason</th>
              <th>Items</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="10" class="text-center py-4">Loading request history...</td>
            </tr>
            <tr v-else-if="branchRequests.length === 0">
              <td colspan="10" class="text-center py-4">No request history found</td>
            </tr>
            <tr v-for="request in branchRequests" :key="request.id">
              <td>{{ request.request_id }}</td>
              <td>{{ request.branch_name }}</td>
              <td>
                <span :class="{
                  'badge badge-success': request.status === 'approved',
                  'badge badge-warning': request.status === 'pending',
                  'badge badge-error': request.status === 'rejected'
                }">{{ request.status }}</span>
              </td>
              <td>{{ request.requested_at }}</td>
              <td>{{ request.approved_at }}</td>
              <td>{{ request.rejected_at }}</td>
              <td>{{ request.rejection_reason }}</td>
              <td>
                <div class="overflow-x-auto">
                  <table class="table w-full">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="item in request.items" :key="item.id">
                        <td>{{ item.product_name }}</td>
                        <td>{{ item.quantity }}</td>
                        <td>{{ item.unit }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </td>
              <td>
                <button 
                  @click="viewRequestDetails(request.id)" 
                  class="btn btn-xs btn-primary"
                >
                  View
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="modal-action">
        <button 
          @click="showRequestsModal = false" 
          class="btn btn-ghost"
        >
          Close
        </button>
      </div>
    </div>
    <div class="modal-backdrop" @click="showRequestsModal = false"></div>
  </div>
</template>
