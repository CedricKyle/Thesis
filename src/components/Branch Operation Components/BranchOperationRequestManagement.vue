<script setup>
import { ref, computed } from 'vue'

// Mock request data
const requests = ref([
  {
    request_id: 'REQ-001',
    branch: 'Main Branch',
    date: '2024-06-01',
    items: 3,
    status: 'pending',
    requested_by: 'Juan Dela Cruz',
  },
  {
    request_id: 'REQ-002',
    branch: 'North Branch',
    date: '2024-06-02',
    items: 2,
    status: 'approved',
    requested_by: 'Maria Santos',
  },
  {
    request_id: 'REQ-003',
    branch: 'South Branch',
    date: '2024-06-03',
    items: 1,
    status: 'rejected',
    requested_by: 'Pedro Reyes',
  },
])

const search = ref('')

const filteredRequests = computed(() =>
  requests.value.filter(
    (req) =>
      req.request_id.toLowerCase().includes(search.value.toLowerCase()) ||
      req.branch.toLowerCase().includes(search.value.toLowerCase()) ||
      req.requested_by.toLowerCase().includes(search.value.toLowerCase()),
  ),
)
</script>

<template>
  <div class="p-6 bg-white rounded shadow">
    <h2 class="text-lg font-bold mb-4 text-primaryColor">Branch Requests</h2>
    <div class="mb-4">
      <input
        v-model="search"
        type="text"
        placeholder="Search by request ID, branch, or requester..."
        class="input input-bordered w-full max-w-xs"
      />
    </div>
    <div class="overflow-x-auto">
      <table class="table w-full">
        <thead>
          <tr class="bg-primaryColor text-white">
            <th>Request ID</th>
            <th>Branch</th>
            <th>Date</th>
            <th>Items</th>
            <th>Status</th>
            <th>Requested By</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="req in filteredRequests" :key="req.request_id">
            <td>{{ req.request_id }}</td>
            <td>{{ req.branch }}</td>
            <td>{{ req.date }}</td>
            <td>{{ req.items }}</td>
            <td>
              <span
                :class="{
                  'badge badge-warning': req.status === 'pending',
                  'badge badge-success': req.status === 'approved',
                  'badge badge-error': req.status === 'rejected',
                }"
              >
                {{ req.status }}
              </span>
            </td>
            <td>{{ req.requested_by }}</td>
          </tr>
          <tr v-if="filteredRequests.length === 0">
            <td colspan="6" class="text-center text-gray-500">No requests found.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
