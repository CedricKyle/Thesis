<script setup>
import { ref, computed } from 'vue'
import { FileText, Search, Plus } from 'lucide-vue-next'

// Dummy data
const branches = ref(['All Branches', 'Main', 'Tagaytay', 'Cavite']) // Example branches

const transactions = ref([
  {
    id: 1,
    date: '2024-06-01',
    name: 'Juan Dela Cruz',
    product: 'Beef Steak',
    quantity: 2,
    unit_price: 350,
    total_price: 700,
    status: 'Completed',
    branch: 'Main',
  },
  {
    id: 2,
    date: '2024-06-02',
    name: 'Maria Santos',
    product: 'Pork Chop',
    quantity: 1,
    unit_price: 250,
    total_price: 250,
    status: 'Pending',
    branch: 'Tagaytay',
  },
])

const search = ref('')
const statusFilter = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const selectedBranch = ref('All Branches')

const filteredTransactions = computed(() =>
  transactions.value.filter(
    (t) =>
      (selectedBranch.value === 'All Branches' || t.branch === selectedBranch.value) &&
      (!search.value ||
        t.name.toLowerCase().includes(search.value.toLowerCase()) ||
        t.product.toLowerCase().includes(search.value.toLowerCase())) &&
      (!statusFilter.value || t.status === statusFilter.value) &&
      (!dateFrom.value || t.date >= dateFrom.value) &&
      (!dateTo.value || t.date <= dateTo.value),
  ),
)
</script>

<template>
  <div class="w-full bg-white shadow-md rounded-md p-6">
    <!-- Top Bar -->
    <div class="flex flex-wrap items-center gap-2 mb-4">
      <div class="flex gap-2">
        <select v-model="selectedBranch" class="select select-sm border-primaryColor w-40">
          <option v-for="b in branches" :key="b" :value="b">{{ b }}</option>
        </select>
        <input
          v-model="search"
          type="text"
          placeholder="Search Name/Product"
          class="input input-sm w-64 border-primaryColor"
        />
        <select v-model="statusFilter" class="select select-sm border-primaryColor w-40">
          <option value="">All Status</option>
          <option>Completed</option>
          <option>Pending</option>
          <option>Cancelled</option>
        </select>
        <input v-model="dateFrom" type="date" class="input input-sm border-primaryColor" />
        <span>-</span>
        <input v-model="dateTo" type="date" class="input input-sm border-primaryColor" />
      </div>
      <button class="btn-primaryStyle ml-auto flex items-center gap-1">
        <Plus class="w-4 h-4" /> Add Transaction
      </button>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="table w-full text-sm rounded-md border">
        <thead class="text-xs text-black">
          <tr class="bg-gray-100">
            <th>ID</th>
            <th>Date</th>
            <th>Name</th>
            <th>Product</th>
            <th>Quantity</th>
            <th>Unit Price (₱)</th>
            <th>Total Price (₱)</th>
            <th>Status</th>
            <th>Branch</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody class="text-xs text-black">
          <tr v-for="t in filteredTransactions" :key="t.id">
            <td>{{ t.id }}</td>
            <td>{{ t.date }}</td>
            <td>{{ t.name }}</td>
            <td>{{ t.product }}</td>
            <td>{{ t.quantity }}</td>
            <td class="text-right">{{ t.unit_price.toLocaleString('en-PH') }}</td>
            <td class="text-right">{{ t.total_price.toLocaleString('en-PH') }}</td>
            <td>
              <span
                :class="{
                  'badge badge-success': t.status === 'Completed',
                  'badge badge-warning': t.status === 'Pending',
                  'badge badge-error': t.status === 'Cancelled',
                }"
              >
                {{ t.status }}
              </span>
            </td>
            <td>{{ t.branch }}</td>
            <td>
              <button class="btn-secondaryStyle btn-xs flex items-center gap-1">
                <FileText class="w-4 h-4" /> View
              </button>
            </td>
          </tr>
          <tr v-if="filteredTransactions.length === 0">
            <td colspan="9" class="text-center text-gray-400 py-4">No transactions found</td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- Pagination, Export, etc. can be added here -->
  </div>
</template>
