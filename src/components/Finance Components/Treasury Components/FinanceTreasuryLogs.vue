<script setup>
import { ref, computed } from 'vue'

// Branches and action types
const branches = ref(['All Branches', 'Main', 'Tagaytay', 'Cavite'])
const selectedBranch = ref('All Branches')
const dateFrom = ref('')
const dateTo = ref('')
const search = ref('')
const actionFilter = ref('')

// Action types for dropdown
const actionTypes = ref([
  'Released Payroll',
  'Cash In',
  'Cash Out',
  'Supply Request Approved',
  // Add more as needed
])

// Dummy logs data
const logs = ref([
  {
    id: 1,
    datetime: '2024-06-16 10:30',
    branch: 'Main',
    user: 'Juan Dela Cruz (Treasury)',
    action: 'Released Payroll',
    reference: 'Payroll #123',
    amount: 7000,
    remarks: 'Paid in cash',
  },
  // ... more logs ...
])

const filteredLogs = computed(() =>
  logs.value.filter(
    (log) =>
      (selectedBranch.value === 'All Branches' || log.branch === selectedBranch.value) &&
      (!actionFilter.value || log.action === actionFilter.value) &&
      (!search.value ||
        log.user.toLowerCase().includes(search.value.toLowerCase()) ||
        log.action.toLowerCase().includes(search.value.toLowerCase()) ||
        log.reference.toLowerCase().includes(search.value.toLowerCase()) ||
        log.remarks.toLowerCase().includes(search.value.toLowerCase())) &&
      (!dateFrom.value || log.datetime >= dateFrom.value) &&
      (!dateTo.value || log.datetime <= dateTo.value),
  ),
)
</script>

<template>
  <div class="w-full bg-white shadow-md rounded-md p-6">
    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-2 mb-4">
      <select
        v-model="selectedBranch"
        class="select select-sm border bg-white border-black text-black w-40"
      >
        <option v-for="b in branches" :key="b" :value="b">{{ b }}</option>
      </select>
      <select
        v-model="actionFilter"
        class="select select-sm border bg-white border-black text-black w-48"
      >
        <option value="">All Actions</option>
        <option v-for="a in actionTypes" :key="a" :value="a">{{ a }}</option>
      </select>
      <input
        v-model="dateFrom"
        type="date"
        class="input input-sm border bg-white border-black text-black"
      />
      <span>-</span>
      <input
        v-model="dateTo"
        type="date"
        class="input input-sm border bg-white border-black text-black"
      />
      <input
        v-model="search"
        type="text"
        placeholder="Search User/Action/Ref"
        class="input input-sm w-64 border bg-white border-black text-black"
      />
    </div>

    <!-- Logs Table -->
    <div class="overflow-x-auto">
      <table class="table w-full text-sm rounded-md border">
        <thead class="text-xs text-black">
          <tr class="bg-gray-100">
            <th>Date & Time</th>
            <th>Branch</th>
            <th>User</th>
            <th>Action</th>
            <th>Reference</th>
            <th class="text-right">Amount (₱)</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody class="text-xs text-black">
          <tr v-for="log in filteredLogs" :key="log.id">
            <td>{{ log.datetime }}</td>
            <td>{{ log.branch }}</td>
            <td>{{ log.user }}</td>
            <td>{{ log.action }}</td>
            <td>{{ log.reference }}</td>
            <td class="text-right">{{ log.amount ? log.amount.toLocaleString('en-PH') : '-' }}</td>
            <td>{{ log.remarks }}</td>
          </tr>
          <tr v-if="filteredLogs.length === 0">
            <td colspan="7" class="text-center text-gray-400 py-4">No logs found</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
