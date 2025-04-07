<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import { Eye, X } from 'lucide-vue-next'
import { useAttendanceLogic } from '@/composables/Admin Composables/Human Resource/useAttendanceLogic'
import { TabulatorFull as Tabulator } from 'tabulator-tables'

const { formatDate } = useAttendanceLogic()

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

// Define columns for Tabulator
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
    formatter: function (cell) {
      const status = cell.getValue()
      const statusClasses = {
        Present: 'bg-green-100 text-green-800',
        Absent: 'bg-red-100 text-red-800',
        Late: 'bg-yellow-100 text-yellow-800',
        'On Leave': 'bg-blue-100 text-blue-800',
      }
      return `<span class="px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status]}">${status}</span>`
    },
    headerSort: false,
  },
  {
    title: 'Action',
    formatter: function (cell) {
      const record = cell.getRow().getData()
      if (record.id.toString().startsWith('absent-')) return ''

      return `
        <div class="flex gap-2">
          <button class="btn btn-sm btn-circle hover:bg-primaryColor/80 border-none btn-ghost view-button">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
          <button class="btn btn-sm btn-circle hover:bg-red-400 border-none btn-ghost delete-button">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>`
    },
    headerSort: false,
    cellClick: function (e, cell) {
      const record = cell.getRow().getData()
      if (e.target.closest('.view-button')) {
        emit('view', record)
      } else if (e.target.closest('.delete-button')) {
        emit('delete', record)
      }
    },
  },
]

// Initialize table
const initTable = async () => {
  if (tableRef.value) {
    table = new Tabulator(tableRef.value, {
      data: props.records,
      columns: columns,
      layout: 'fitColumns',
      responsiveLayout: 'collapse',
      height: '100%',
      pagination: true,
      paginationSize: 10,
      paginationSizeSelector: [10, 25, 50],
      placeholder: 'No attendance records available',
      cssClass: 'custom-tabulator',
    })

    // Wait for table to be fully built
    await table.on('tableBuilt', function () {
      isTableBuilt.value = true
      console.log(
        'Table built, checking classes:',
        tableRef.value.classList.contains('custom-tabulator'),
      )
      console.log('Table element:', tableRef.value)
    })
  }
}

onMounted(async () => {
  await initTable()
})

// Watch for data changes
watch(
  () => props.records,
  async (newData) => {
    if (isTableBuilt.value && table) {
      await table.setData(newData)
    }
  },
  { deep: true },
)

// Clean up
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
