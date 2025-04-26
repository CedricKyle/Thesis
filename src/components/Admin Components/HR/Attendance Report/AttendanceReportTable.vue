<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import { Printer } from 'lucide-vue-next'
import { TabulatorFull as Tabulator } from 'tabulator-tables'
import { useAttendanceLogic } from '@/composables/Admin Composables/Human Resource/useAttendanceLogic'

const { calculateOvertime } = useAttendanceLogic()

const props = defineProps({
  records: {
    type: Array,
    required: true,
  },
  isDepartmentReport: {
    type: Boolean,
    default: false,
  },
  selectedDepartment: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['generate-pdf'])
const tableRef = ref(null)
const isTableBuilt = ref(false)
let table = null

// Define columns for Tabulator
const columns = [
  ...(props.isDepartmentReport
    ? [
        {
          title: 'Employee',
          field: 'full_name',
          sorter: 'string',
        },
        ...(props.selectedDepartment === 'ALL_DEPARTMENTS'
          ? [
              {
                title: 'Department',
                field: 'department',
                sorter: 'string',
              },
            ]
          : []),
      ]
    : []),
  {
    title: 'Date',
    field: 'date',
    sorter: 'string',
    headerSort: true,
    formatter: (cell) => {
      const date = new Date(cell.getValue())
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    },
  },
  // Only show these columns if NOT all departments
  ...(props.selectedDepartment !== 'ALL_DEPARTMENTS'
    ? [
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
      ]
    : []),
  {
    title: 'Status',
    field: 'status',
    formatter: function (cell) {
      const status = cell.getValue()
      const statusClasses = {
        Present: 'bg-green-100 text-green-800',
        'Present + OT': 'bg-green-100 text-green-800',
        Absent: 'bg-red-100 text-red-800',
        Late: 'bg-yellow-100 text-yellow-800',
        'Late + OT': 'bg-yellow-100 text-yellow-800',
        'On Leave': 'bg-blue-100 text-blue-800',
      }

      return `<span class="px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status]}">${status}</span>`
    },
    headerSort: true,
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

// Clean up on component unmount
onBeforeUnmount(() => {
  if (table) {
    table.destroy()
    table = null
  }
})
</script>

<template>
  <div class="bg-white shadow-md rounded-md p-5">
    <div class="flex gap-4 flex-col shadow-lg">
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

<style>
/* Add these styles to ensure proper alignment of status badges */
.tabulator-cell span {
  display: inline-block;
  vertical-align: middle;
}

.tabulator-cell span + span {
  margin-left: 0.25rem;
}
</style>
