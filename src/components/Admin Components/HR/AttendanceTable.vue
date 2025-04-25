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
  Present: 'badge badge-outline badge-success',
  Absent: 'badge badge-outline badge-error',
  Late: 'badge badge-outline badge-warning',
  'On Leave': 'badge badge-outline badge-info',
}

const commonButtonClasses = 'btn btn-sm btn-circle border-none btn-ghost'

// Simplify getDefaultAttendanceData to only filter out soft-deleted employees
const getDefaultAttendanceData = (employees) => {
  // Filter out soft-deleted employees and Super Admin
  const filteredEmployees = employees.filter((emp) => !emp.deleted_at && emp.role !== 'Super Admin')

  const currentDate = new Date()

  return filteredEmployees.map((employee) => ({
    id: employee.employee_id ? `absent-${employee.employee_id}` : `absent-${Date.now()}`, // Ensure id is always set
    employee_id: employee.employee_id,
    full_name: employee.full_name,
    department: employee.department,
    signIn: '-',
    signOut: '-',
    workingHours: '-',
    status: 'Absent', // Always default to Absent if no time in
    date: currentDate,
  }))
}

// Simplify mergeAttendanceWithEmployees
const mergeAttendanceWithEmployees = (attendanceRecords, employees) => {
  // Filter out soft-deleted employees and Super Admin
  const filteredEmployees = employees.filter((emp) => !emp.deleted_at && emp.role !== 'Super Admin')

  const defaultAttendance = getDefaultAttendanceData(filteredEmployees)

  // Filter and format attendance records
  const filteredAttendance = attendanceRecords
    .filter((record) => {
      const employee = employees.find((emp) => emp.employee_id === record.employee_id)
      return employee && !employee.deleted_at && employee.role !== 'Super Admin'
    })
    .map((record) => {
      // Determine status based on signIn and signOut
      let status = 'Absent'
      if (record.signIn && record.signIn !== '-') {
        status = record.status || 'Present' // Use existing status or default to Present if signed in
      }

      // Calculate working hours
      let workingHours = '-'
      if (record.signIn && record.signOut && record.signIn !== '-' && record.signOut !== '-') {
        try {
          const [inHours, inMinutes] = record.signIn.split(':').map(Number)
          const [outHours, outMinutes] = record.signOut.split(':').map(Number)

          let inTotalMinutes = inHours * 60 + inMinutes
          let outTotalMinutes = outHours * 60 + outMinutes

          if (outTotalMinutes < inTotalMinutes) {
            outTotalMinutes += 24 * 60
          }

          const diffMinutes = outTotalMinutes - inTotalMinutes

          if (diffMinutes >= 0) {
            const hours = Math.floor(diffMinutes / 60)
            const minutes = diffMinutes % 60
            workingHours = `${hours}:${minutes.toString().padStart(2, '0')}`
          }
        } catch (error) {
          console.error('Error calculating working hours:', error)
          workingHours = '-'
        }
      }

      return {
        ...record,
        workingHours,
        status, // Use the determined status
      }
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
    formatter: (cell) => {
      const value = cell.getValue()

      // If no value or explicitly set to '-', return dash
      if (!value || value === '-') return '-'

      // If it's already in HH:MM format, return as is
      if (typeof value === 'string' && value.includes(':')) {
        return value
      }

      // If it's a number (in minutes), convert to HH:MM format
      if (typeof value === 'number') {
        const hours = Math.floor(value / 60)
        const minutes = value % 60
        return `${hours}:${minutes.toString().padStart(2, '0')}`
      }

      return '-'
    },
  },
  {
    title: 'Status',
    field: 'status',
    formatter: (cell) => {
      const status = cell.getValue()
      const record = cell.getRow().getData()

      // Default to Absent if no sign in
      let displayStatus = status
      if (record.signIn === '-') {
        displayStatus = 'Absent'
      }

      const statusClass = statusClasses[displayStatus] || ''
      return `<span class="px-2 py-1 text-xs font-medium rounded-full ${statusClass}">${displayStatus}</span>`
    },
  },
  {
    title: 'Action',
    formatter: (cell) => {
      const record = cell.getRow().getData()
      // Check if id exists and is a string or can be converted to string
      const isAbsentRecord = record.id && record.id.toString().startsWith('absent-')

      if (isAbsentRecord) {
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
    cellClick: async (e, cell) => {
      const record = cell.getRow().getData()
      if (e.target.closest('.view-button')) {
        emit('view', record)
      } else if (e.target.closest('.delete-button')) {
        try {
          await emit('delete', record)
          // Refresh the table after successful deletion
          await refreshTableData()
        } catch (error) {
          console.error('Error deleting record:', error)
        }
      } else if (e.target.closest('.check-in-button')) {
        emit('checkIn', record)
      }
    },
  },
]

// Add a function to update localStorage when data changes
const updateLocalStorage = (mergedData) => {
  try {
    localStorage.setItem('attendanceRecords', JSON.stringify(mergedData))
  } catch (error) {
    console.error('Error saving to localStorage:', error)
  }
}

// Update the watch handler to include localStorage update
watch(
  [() => props.records, () => employeeStore.employees],
  ([newRecords, employees]) => {
    if (isTableBuilt.value && table) {
      try {
        const mergedData = mergeAttendanceWithEmployees(newRecords, employees)
        table.setData(mergedData)
        updateLocalStorage(mergedData) // Save to localStorage after updating table
      } catch (error) {
        console.error('Error updating table data:', error)
      }
    }
  },
  { deep: true },
)

// Update initTable to load from localStorage if available
const initTable = async () => {
  if (tableRef.value) {
    try {
      await employeeStore.loadEmployees()

      // Try to load from localStorage first
      let initialData = []
      const savedData = localStorage.getItem('attendanceRecords')
      if (savedData) {
        try {
          initialData = JSON.parse(savedData)
        } catch (error) {
          console.error('Error parsing localStorage data:', error)
        }
      }

      // If no saved data or error parsing, merge with current records
      if (!initialData.length) {
        initialData = mergeAttendanceWithEmployees(props.records, employeeStore.employees)
      }

      table = new Tabulator(tableRef.value, {
        data: initialData,
        columns,
        layout: 'fitColumns',
        responsiveLayout: 'collapse',
        height: '100%',
        pagination: true,
        paginationSize: 10,
        paginationSizeSelector: [10, 25, 50],
        placeholder: 'No attendance records available',
        cssClass: 'custom-tabulator',
        dataLoaded: function () {
          this.redraw(true)
        },
      })

      table.on('tableBuilt', () => {
        isTableBuilt.value = true
      })
    } catch (error) {
      console.error('Error initializing table:', error)
    }
  }
}

// Simplify the mounted hook
onMounted(() => {
  initTable()
})

// Clean up on unmount
onBeforeUnmount(() => {
  if (table) {
    table.destroy()
    table = null
    isTableBuilt.value = false
  }
})

// Add this function to refresh the table data
const refreshTableData = async () => {
  if (isTableBuilt.value && table) {
    try {
      const mergedData = mergeAttendanceWithEmployees(props.records, employeeStore.employees)
      table.setData(mergedData)
      updateLocalStorage(mergedData)
    } catch (error) {
      console.error('Error refreshing table data:', error)
    }
  }
}

// Expose refreshTableData to parent components
defineExpose({
  refreshTableData,
})
</script>

<template>
  <div class="w-full bg-white shadow-md rounded-md">
    <div ref="tableRef"></div>
  </div>
</template>
