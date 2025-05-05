<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Printer } from 'lucide-vue-next'
import { usePayrollStore } from '@/stores/HR Management/payrollStore'

const payrollStore = usePayrollStore()
const selectedMonth = ref(new Date().getMonth() + 1)
const selectedYear = ref(new Date().getFullYear())
const search = ref('')

const rowsPerPage = ref(10)
const currentPage = ref(1)

const filteredLogs = computed(() => {
  if (!payrollStore.auditLogs) return []
  if (!search.value) return payrollStore.auditLogs
  const term = search.value.toLowerCase()
  return payrollStore.auditLogs.filter(
    (log) =>
      (log.action || '').toLowerCase().includes(term) ||
      (log.employee?.full_name || log.employee_id || '').toLowerCase().includes(term) ||
      (log.actor?.full_name || log.user_id || '').toLowerCase().includes(term) ||
      (log.remarks || '').toLowerCase().includes(term),
  )
})

const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value
  return filteredLogs.value.slice(start, start + rowsPerPage.value)
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredLogs.value.length / rowsPerPage.value)),
)

watch(filteredLogs, () => {
  if (currentPage.value > totalPages.value) currentPage.value = 1
})

const printableAuditLog = ref(null)

function printAuditLog() {
  const printContents = printableAuditLog.value.innerHTML
  const printWindow = window.open('', '', 'height=600,width=800')
  printWindow.document.write('<html><head><title>Audit Log</title>')
  printWindow.document.write(
    '<style>body{font-family:sans-serif;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #333;padding:4px;}</style>',
  )
  printWindow.document.write('</head><body >')
  printWindow.document.write(printContents)
  printWindow.document.write('</body></html>')
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
  printWindow.close()
}

function getMonthDateRange(month, year) {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0)
  return {
    start_date: start.toISOString().slice(0, 10),
    end_date: end.toISOString().slice(0, 10),
  }
}

function filterAuditLogs() {
  const { start_date, end_date } = getMonthDateRange(selectedMonth.value, selectedYear.value)
  payrollStore.fetchGlobalAuditLogs({ start_date, end_date })
}

onMounted(() => {
  filterAuditLogs()
})
</script>

<template>
  <div class="bg-white p-4 rounded-md shadow max-h-[600px] overflow-y-auto mt-2">
    <h3 class="font-semibold text-black mb-2">Audit Log</h3>

    <!-- FILTERS -->
    <div class="flex items-center mb-2 justify-between">
      <div class="flex gap-2">
        <select
          v-model="selectedMonth"
          class="select bg-white border border-black text-black select-sm cursor-pointer"
          @change="filterAuditLogs"
        >
          <option v-for="m in 12" :key="m" :value="m">
            {{ new Date(0, m - 1).toLocaleString('default', { month: 'long' }) }}
          </option>
        </select>
        <select
          v-model="selectedYear"
          class="select bg-white border border-black text-black select-sm cursor-pointer"
          @change="filterAuditLogs"
        >
          <option v-for="y in [2023, 2024, 2025]" :key="y" :value="y">{{ y }}</option>
        </select>
        <button class="btn-primaryStyle" @click="filterAuditLogs">Filter</button>
      </div>
      <div class="flex gap-2">
        <input
          v-model="search"
          type="text"
          placeholder="Search action, employee, remarks..."
          class="search-input input-sm w-80 border border-gray-300 rounded px-2 py-1 mr-2 placeholder:text-gray-500 text-black"
        />
        <button class="btn-primaryStyle" @click="printAuditLog">
          <Printer class="w-3 h-3" /> Print Audit Log
        </button>
      </div>
    </div>

    <div ref="printableAuditLog" id="printable-audit-log">
      <table class="table text-black w-full text-xs border border-gray-300 rounded-md">
        <thead class="text-black text-xs">
          <tr>
            <th>Date</th>
            <th>Action</th>
            <th>By User</th>
            <th>Employee</th>
            <th>Payroll Period</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody class="text-black text-xs">
          <tr v-for="log in paginatedLogs" :key="log.id">
            <td>{{ new Date(log.created_at).toLocaleString() }}</td>
            <td>{{ log.action.replace(/_/g, ' ') }}</td>
            <td>{{ log.actor?.full_name || log.user_id }}</td>
            <td>{{ log.employee?.full_name || log.employee_id }}</td>
            <td>
              {{
                log.payroll?.start_date ? new Date(log.payroll.start_date).toLocaleDateString() : ''
              }}
              to
              {{ log.payroll?.end_date ? new Date(log.payroll.end_date).toLocaleDateString() : '' }}
            </td>
            <td>{{ log.remarks || '-' }}</td>
          </tr>
          <tr v-if="!paginatedLogs.length">
            <td colspan="6" class="text-center py-4 text-gray-500">No audit logs found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex items-center gap-2 mt-4">
      <span class="text-black text-xs">Page</span>
      <select
        class="select !bg-white !border-black !text-black select-xs w-16"
        v-model="currentPage"
        :disabled="totalPages <= 1"
        @change="() => $nextTick(() => window.scrollTo(0, 0))"
      >
        <option v-for="page in totalPages" :key="page" :value="page">
          {{ page }}
        </option>
      </select>
      <span class="text-black text-xs">of {{ totalPages }}</span>
    </div>
  </div>
</template>
