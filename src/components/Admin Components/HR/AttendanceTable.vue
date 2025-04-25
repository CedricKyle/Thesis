<script setup>
import { ref, onMounted, watch, onBeforeUnmount, computed } from 'vue'
import { useAttendanceLogic } from '@/composables/Admin Composables/Human Resource/useAttendanceLogic'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'
import { useAuthStore } from '@/stores/Authentication/authStore'
import { TabulatorFull as Tabulator } from 'tabulator-tables'

const { formatDate, calculateOvertime } = useAttendanceLogic()
const employeeStore = useEmployeeStore()
const authStore = useAuthStore()

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

// Simplify getDefaultAttendanceData to only filter out soft-deleted employees
const getDefaultAttendanceData = (employees) => {
  // Filter out soft-deleted employees and Super Admin
  const filteredEmployees = employees.filter((emp) => !emp.deleted_at && emp.role !== 'Super Admin')

  return filteredEmployees.map((employee) => ({
    id: `absent-${employee.employee_id}`,
    employee_id: employee.employee_id,
    full_name: employee.full_name,
    department: employee.department,
    signIn: '-',
    signOut: '-',
    workingHours: '-',
    status: 'Absent',
  }))
}

// Simplify mergeAttendanceWithEmployees
const mergeAttendanceWithEmployees = (attendanceRecords, employees) => {
  // Filter out soft-deleted employees and Super Admin
  const filteredEmployees = employees.filter((emp) => !emp.deleted_at && emp.role !== 'Super Admin')

  const defaultAttendance = getDefaultAttendanceData(filteredEmployees)

  // Filter attendance records
  const filteredAttendance = attendanceRecords.filter((record) => {
    const employee = employees.find((emp) => emp.employee_id === record.employee_id)
    return employee && !employee.deleted_at && employee.role !== 'Super Admin'
  })

  // Create a map of existing attendance records by employee_id
  const attendanceMap = new Map(filteredAttendance.map((record) => [record.employee_id, record]))

  // Return either the actual attendance record or the default one
  return defaultAttendance.map((defaultRecord) => {
    return attendanceMap.get(defaultRecord.employee_id) || defaultRecord
  })
}

const columns = [
  {
    title: 'Full Name',
    field: 'full_name',
    sorter: 'string',
  },
  {
    title: 'Department',
    field: 'department',
    sorter: 'string',
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
      const statusClass = statusClasses[status] || ''
      return `<span class="px-2 py-1 text-xs font-medium rounded-full ${statusClass}">${status}</span>`
    },
  },
  {
    title: 'Action',
    formatter: (cell) => {
      const record = cell.getRow().getData()
      if (record.id.toString().startsWith('absent-')) {
        // Only show check-in button for absent employees
        return `
          `
      }

      return `
        <div class="flex gap-2">
          <button class="${commonButtonClasses} hover:bg-primaryColor/80 view-button">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>

          <div class="flex gap-2">
            <button class="${commonButtonClasses} hover:bg-secondaryColor/80 check-in-button">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </button>
          </div>
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
      } else if (e.target.closest('.check-in-button')) {
        emit('checkIn', record)
      }
    },
  },
]

const initTable = async () => {
  if (tableRef.value) {
    // Load employees first
    await employeeStore.loadEmployees()

    // Merge attendance records with employee data
    const mergedData = mergeAttendanceWithEmployees(props.records, employeeStore.employees)

    table = new Tabulator(tableRef.value, {
      data: mergedData,
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

// Update watch to handle merged data
watch(
  [() => props.records, () => employeeStore.employees],
  ([newRecords, employees]) => {
    if (isTableBuilt.value && table && employees) {
      const mergedData = mergeAttendanceWithEmployees(newRecords, employees)
      table.setData(mergedData)
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
