<script setup>
import { ref, computed } from 'vue'
import { Check, Eye, Plus } from 'lucide-vue-next'

// Dummy branches and payrolls
const branches = ref(['All Branches', 'Main', 'Tagaytay', 'Cavite'])
const selectedBranch = ref('All Branches')
const dateFrom = ref('')
const dateTo = ref('')
const search = ref('')

const payrolls = ref([
  {
    id: 1,
    employee: 'Juan Dela Cruz',
    period: '2024-06-01 to 2024-06-15',
    amount: 7000,
    method: 'Cash',
    date_released: '2024-06-16',
    status: 'Released',
    branch: 'Main',
  },
  {
    id: 2,
    employee: 'Maria Santos',
    period: '2024-06-01 to 2024-06-15',
    amount: 8000,
    method: '',
    date_released: '',
    status: 'Pending',
    branch: 'Tagaytay',
  },
])

const filteredPayrolls = computed(() =>
  payrolls.value.filter(
    (p) =>
      (selectedBranch.value === 'All Branches' || p.branch === selectedBranch.value) &&
      (!search.value || p.employee.toLowerCase().includes(search.value.toLowerCase())) &&
      (!dateFrom.value || p.date_released >= dateFrom.value || !p.date_released) &&
      (!dateTo.value || p.date_released <= dateTo.value || !p.date_released),
  ),
)
</script>

<template>
  <div class="w-full bg-white shadow-md rounded-md p-6">
    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-2 mb-4">
      <select v-model="selectedBranch" class="select select-sm border-primaryColor w-40">
        <option v-for="b in branches" :key="b" :value="b">{{ b }}</option>
      </select>
      <input v-model="dateFrom" type="date" class="input input-sm border-primaryColor" />
      <span>-</span>
      <input v-model="dateTo" type="date" class="input input-sm border-primaryColor" />
      <input
        v-model="search"
        type="text"
        placeholder="Search Employee"
        class="input input-sm w-64 border-primaryColor"
      />
      <button class="btn-primaryStyle ml-auto flex items-center gap-1">
        <Plus class="w-4 h-4" /> Add Cash Movement
      </button>
    </div>

    <!-- Payroll Disbursement Table -->
    <div class="overflow-x-auto">
      <table class="table w-full text-sm rounded-md border">
        <thead class="text-xs text-black">
          <tr class="bg-gray-100">
            <th>ID</th>
            <th>Employee</th>
            <th>Period</th>
            <th>Amount (₱)</th>
            <th>Method</th>
            <th>Date Released</th>
            <th>Status</th>
            <th>Branch</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody class="text-xs text-black">
          <tr v-for="p in filteredPayrolls" :key="p.id">
            <td>{{ p.id }}</td>
            <td>{{ p.employee }}</td>
            <td>{{ p.period }}</td>
            <td class="text-right">{{ p.amount.toLocaleString('en-PH') }}</td>
            <td>{{ p.method || '-' }}</td>
            <td>{{ p.date_released || '-' }}</td>
            <td>
              <span
                :class="{
                  'badge badge-success': p.status === 'Released',
                  'badge badge-warning': p.status === 'Pending',
                }"
              >
                {{ p.status }}
              </span>
            </td>
            <td>{{ p.branch }}</td>
            <td>
              <button class="btn-primaryStyle btn-xs flex items-center gap-1">
                <Check class="w-4 h-4" /> Release
              </button>
              <button class="btn-secondaryStyle btn-xs flex items-center gap-1">
                <Eye class="w-4 h-4" /> History
              </button>
            </td>
          </tr>
          <tr v-if="filteredPayrolls.length === 0">
            <td colspan="9" class="text-center text-gray-400 py-4">No payrolls found</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
