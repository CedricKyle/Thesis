<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import { useAttendanceLogic } from '@/composables/Admin Composables/Human Resource/useAttendanceLogic'
import { TabulatorFull as Tabulator } from 'tabulator-tables'

const { formatDate, calculateOvertime } = useAttendanceLogic()

const props = defineProps({
  records: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['view', 'delete'])
const tableRef = ref(null)
const isTableBuilt = ref(false)
let table = null

// Status styling configuration
const statusClasses = {
  Present: 'bg-green-100 text-green-800',
  Absent: 'bg-red-100 text-red-800',
  Late: 'bg-yellow-100 text-yellow-800',
  'On Leave': 'bg-blue-100 text-blue-800',
}

const commonButtonClasses = 'btn btn-sm btn-circle border-none btn-ghost'

const columns = [
  {
    title: 'Name',
    field: 'name',
    sorter: 'string',
    headerSort: true,
  },
  {
    title: 'Department',
    field: 'department',
    sorter: 'string',
    headerSort: true,
  },
  {
    title: 'Time In',
    field: 'signIn',
    formatter: (cell) => cell.getValue() || '-',
  },
  {
    title: 'Time Out',
    field: 'signOut',
    formatter: (cell) => cell.getValue() || '-',
  },
  {
    title: 'Working Hours',
    field: 'workingHours',
    formatter: (cell) => cell.getValue() || '-',
  },
  {
    title: 'Status',
    field: 'status',
    formatter: (cell) => {
      const status = cell.getValue()
      const record = cell.getRow().getData()
      const overtimeHours = calculateOvertime(record.signOut)
      const baseStatus = status.split(' + ')[0]

      const statusBadge = `<span class="px-2 py-1 text-xs font-medium rounded-full ${statusClasses[baseStatus]}">${baseStatus}</span>`

      return overtimeHours > 0
        ? `${statusBadge}<span class="ml-1 px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">OT: ${overtimeHours}h</span>`
        : statusBadge
    },
    headerSort: false,
  },
  {
    title: 'Action',
    formatter: (cell) => {
      const record = cell.getRow().getData()
      if (record.id.toString().startsWith('absent-')) return ''

      return `
        <div class="flex gap-2">
          <button class="${commonButtonClasses} hover:bg-primaryColor/80 view-button">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
          <button class="${commonButtonClasses} hover:bg-secondaryColor/80 check-button">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </button>
          <button class="${commonButtonClasses} hover:bg-red-400 delete-button">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>`
    },
    headerSort: false,
    cellClick: (e, cell) => {
      const record = cell.getRow().getData()
      if (e.target.closest('.view-button')) {
        emit('view', record)
      } else if (e.target.closest('.delete-button')) {
        emit('delete', record)
      }
    },
  },
]

const initTable = () => {
  if (tableRef.value) {
    table = new Tabulator(tableRef.value, {
      data: props.records,
      columns,
      layout: 'fitColumns',
      responsiveLayout: 'collapse',
      height: '100%',
      pagination: true,
      paginationSize: 10,
      paginationSizeSelector: [10, 25, 50],
      placeholder: 'No attendance records available',
      cssClass: 'custom-tabulator',
    })

    table.on('tableBuilt', () => {
      isTableBuilt.value = true
    })
  }
}

onMounted(() => {
  initTable()
})

watch(
  () => props.records,
  (newData) => {
    if (isTableBuilt.value && table) {
      table.setData(newData)
    }
  },
  { deep: true },
)

onBeforeUnmount(() => {
  if (table) {
    table.destroy()
    table = null
  }
})
</script>

<template>
  <div class="w-full bg-white shadow-md rounded-md">
    <div ref="tableRef"></div>
  </div>
</template>
