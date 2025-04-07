<script setup>
import { ref, onMounted, watch } from 'vue'
import { Printer } from 'lucide-vue-next'
import { TabulatorFull as Tabulator } from 'tabulator-tables'

const props = defineProps({
  records: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['generate-pdf'])
const tableRef = ref(null)
let table = null

// Define columns for Tabulator
const columns = [
  {
    title: 'Date',
    field: 'date',
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
    title: 'Worked Hours',
    field: 'workingHours',
    formatter: (cell) => {
      const value = cell.getValue()
      return typeof value === 'number' ? parseFloat(value).toFixed(2) : '-'
    },
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
    headerSort: true,
  },
]

onMounted(() => {
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
})

// Watch for data changes
watch(
  () => props.records,
  (newData) => {
    if (table) {
      table.setData(newData)
    }
  },
  { deep: true },
)
</script>

<template>
  <div class="bg-white shadow-md rounded-md p-5">
    <div class="flex gap-4 flex-col">
      <div class="flex justify-between items-center">
        <h1 class="font-semibold">Attendance Summary</h1>
        <button
          @click="$emit('generate-pdf')"
          class="btn bg-primaryColor border-none btn-sm px-6 py-4 text-xs font-thin hover:bg-primaryColor/80"
          title="Export as PDF"
        >
          <Printer class="w-4 h-4" />
        </button>
      </div>

      <div class="overflow-x-auto border border-gray-300/50 shadow-lg">
        <div ref="tableRef"></div>
      </div>
    </div>
  </div>
</template>
