<script setup>
import { ref, computed } from 'vue'
import { Printer } from 'lucide-vue-next'

const props = defineProps({
  logs: { type: Array, required: false, default: () => [] },
})

const search = ref('')

const filteredLogs = computed(() => {
  if (!props.logs) return []
  if (!search.value) return props.logs
  const term = search.value.toLowerCase()
  return props.logs.filter(
    (log) =>
      (log.action || '').toLowerCase().includes(term) ||
      (log.employee?.full_name || log.employee_id || '').toLowerCase().includes(term) ||
      (log.user?.email || log.user_id || '').toLowerCase().includes(term) ||
      (log.remarks || '').toLowerCase().includes(term),
  )
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
</script>

<template>
  <div class="bg-white p-4 rounded-md shadow max-h-[600px] overflow-y-auto mt-2">
    <h3 class="font-semibold text-black mb-2">Audit Log</h3>

    <div class="flex items-center mb-2 justify-between">
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
          <tr v-for="log in filteredLogs" :key="log.id">
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
          <tr v-if="!filteredLogs.length">
            <td colspan="6" class="text-center py-4 text-gray-500">No audit logs found</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
