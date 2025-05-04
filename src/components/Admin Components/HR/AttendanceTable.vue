<script setup>
import { ref, onMounted, watch, onBeforeUnmount, computed } from 'vue'
import { useAttendanceLogic } from '@/composables/Admin Composables/Human Resource/useAttendanceLogic'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'
import { useAuthStore } from '@/stores/Authentication/authStore'
import { useAttendanceStore } from '@/stores/HR Management/attendanceStore'
import { useToast } from '@/composables/Admin Composables/User & Role/role/useToast'
import { TabulatorFull as Tabulator } from 'tabulator-tables'
import { PERMISSION_IDS } from '@/composables/Admin Composables/User & Role/role/permissionsId'
import { TriangleAlert } from 'lucide-vue-next'
import { useEmployeeScheduleStore } from '@/stores/HR Management/employeeScheduleStore'
import axios from 'axios'

const { formatDate, calculateOvertime } = useAttendanceLogic()
const employeeStore = useEmployeeStore()
const authStore = useAuthStore()
const attendanceStore = useAttendanceStore()
const { showToast } = useToast()
const employeeScheduleStore = useEmployeeScheduleStore()

const props = defineProps({
  records: {
    type: Array,
    required: true,
  },
})

// Remove the sort-related emits since we'll handle sorting internally
const emit = defineEmits(['view', 'delete'])

const tableRef = ref(null)
const isTableBuilt = ref(false)
let table = null

// Add these refs after other refs
const showApprovalModal = ref(false)
const selectedRecord = ref(null)
const showDeleteModal = ref(false)
const recordToDelete = ref(null)
const showRejectOTModal = ref(false)
const recordToRejectOT = ref(null)

// Status styling configuration
const statusClasses = {
  Present: 'badge badge-outline badge-success',
  Absent: 'badge badge-outline badge-error',
  Late: 'badge badge-outline badge-warning',
  'On Leave': 'badge badge-outline badge-info',
  'Day Off': 'badge badge-outline badge-neutral',
}

const approvalStatusClasses = {
  Pending: 'badge badge-outline badge-warning',
  Approved: 'badge badge-outline badge-success',
  Rejected: 'badge badge-outline badge-error',
}

const commonButtonClasses = 'btn btn-sm btn-circle border-none btn-ghost'

// Simplify getDefaultAttendanceData to only filter out soft-deleted employees
const getDefaultAttendanceData = (employees) => {
  // Filter out soft-deleted employees and Super Admin
  const filteredEmployees = employees.filter(
    (emp) => !emp.deleted_at && emp.roleInfo?.role_name !== 'Super Admin',
  )

  const currentDate = new Date()

  return filteredEmployees.map((employee) => ({
    id: employee.employee_id ? `absent-${employee.employee_id}` : `absent-${Date.now()}`,
    employee_id: employee.employee_id,
    full_name: employee.full_name,
    department: employee.department,
    signIn: '-',
    signOut: '-',
    workingHours: '-',
    status: 'Absent',
    date: currentDate,
  }))
}

const getType = (r) => r.attendanceType || r.attendance_type

function isDayOff(date, workDays) {
  if (!workDays) return false
  if (typeof workDays === 'string') {
    try {
      workDays = JSON.parse(workDays)
    } catch {
      workDays = []
    }
  }
  if (!Array.isArray(workDays)) workDays = []
  const dayOfWeek = new Date(date).toLocaleString('en-US', { weekday: 'long' })
  return !workDays.includes(dayOfWeek)
}

const mergeAttendanceWithEmployees = (attendanceRecords, employees) => {
  const filteredEmployees = employees.filter(
    (emp) => !emp.deleted_at && emp.roleInfo?.role_name !== 'Super Admin',
  )
  const rows = []
  const selectedDate = attendanceStore.selectedDate

  filteredEmployees.forEach((employee) => {
    // Get the active schedule for this employee
    const activeSchedule = getActiveSchedule(employee.employee_id)
    const scheduleTimeIn = activeSchedule?.timeIn || '08:00'
    const scheduleTimeOut = activeSchedule?.timeOut || '17:00'

    // Find the attendance record for this employee and date
    const record = attendanceRecords.find(
      (r) =>
        r.employee_id === employee.employee_id &&
        (r.attendanceType === 'regular' || r.attendance_type === 'regular') &&
        r.date === selectedDate,
    )

    if (record) {
      // May attendance record, sundan ang status
      rows.push({
        id: record.id,
        employee_id: record.employee_id,
        full_name: record.full_name || employee.full_name,
        department: record.department || employee.department,
        scheduleTimeIn,
        scheduleTimeOut,
        signIn: record.signIn || record.start_time || '-',
        signOut: record.signOut || record.end_time || '-',
        workingHours: record.workingHours ?? record.working_hours ?? '-',
        status: record.status || 'Present',
        approvalStatus: record.approvalStatus || record.approval_status || 'Pending',
        date: record.date,
        approved_by: record.approved_by,
      })
    } else {
      // Walang attendance record, check if day off
      let workDays = activeSchedule?.work_days
      if (typeof workDays === 'string') {
        try {
          workDays = JSON.parse(workDays)
        } catch {
          workDays = []
        }
      }
      if (!Array.isArray(workDays)) workDays = []
      const dayOfWeek = new Date(selectedDate).toLocaleString('en-US', { weekday: 'long' })
      const isDayOff = !workDays.includes(dayOfWeek)

      rows.push({
        id: isDayOff ? `dayoff-${employee.employee_id}` : `absent-${employee.employee_id}`,
        employee_id: employee.employee_id,
        full_name: employee.full_name,
        department: employee.department,
        scheduleTimeIn,
        scheduleTimeOut,
        signIn: '-',
        signOut: '-',
        workingHours: '-',
        status: isDayOff ? 'Day Off' : 'Absent',
        approvalStatus: isDayOff ? '' : 'Pending',
        date: selectedDate,
      })
    }
  })

  return rows
}

// Update the permission check to use HR_MANAGE_ATTENDANCE
const canManageAttendance = computed(() => {
  const userPermissions = authStore.currentUser?.permissions || []
  // Only allow users with HR_FULL_ACCESS
  return userPermissions.includes(PERMISSION_IDS.HR_FULL_ACCESS)
})

const attendanceEmployees = computed(() =>
  employeeStore.employees.filter((emp) => emp.roleInfo?.role_name !== 'Super Admin'),
)

const columns = [
  {
    title: 'Full Name',
    field: 'full_name',
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
    title: 'Scheduled Time',
    field: 'scheduleTimeIn',
    formatter: (cell) => {
      const data = cell.getRow().getData()
      return `${(data.scheduleTimeIn || '08:00').slice(0, 5)} - ${(data.scheduleTimeOut || '17:00').slice(0, 5)}`
    },
    headerSort: false,
  },
  {
    title: 'Time In',
    field: 'signIn',
    formatter: (cell) => {
      const value = cell.getValue()
      return value && value !== '-' ? value.slice(0, 5) : '-'
    },
    headerSort: true,
  },
  {
    title: 'Time Out',
    field: 'signOut',
    formatter: (cell) => {
      const value = cell.getValue()
      return value && value !== '-' ? value.slice(0, 5) : '-'
    },
    headerSort: true,
  },
  {
    title: 'Working Hours',
    field: 'workingHours',
    formatter: (cell) => {
      const value = cell.getValue()
      return value && value !== '-' ? Number(value).toFixed(2) : '-'
    },
    headerSort: true,
  },
  {
    title: 'Status',
    field: 'status',
    formatter: (cell) => {
      const status = cell.getValue()
      const record = cell.getRow().getData()
      let displayStatus = status
      let statusClass = statusClasses[displayStatus] || ''

      // If rejected, show "Rejected" badge
      if (record.approvalStatus === 'Rejected') {
        displayStatus = 'Rejected'
        statusClass = 'badge badge-outline badge-error'
      }

      return `<span class="px-2 py-1 text-xs font-medium rounded-full ${statusClass}">${displayStatus}</span>`
    },
  },
  {
    title: 'Approval Status',
    field: 'approvalStatus',
    formatter: (cell) => {
      const record = cell.getRow().getData()
      const status = cell.getValue()
      const statusClass = approvalStatusClasses[status] || ''
      if (record.overtimeProof || record.overtime_proof) {
        return `
          <span class="badge badge-warning">OT Pending</span>
          <span class="text-xs text-gray-500">Approve in Overtime tab</span>
        `
      } else {
        return `
          <div class="flex flex-col gap-1">
            <span class="px-2 py-1 text-xs font-medium rounded-full ${statusClass}">
              ${status}
            </span>
            ${
              status === 'Approved' && record.approved_by
                ? `<span class="text-xs text-gray-600">by ${record.approved_by}</span>`
                : ''
            }
          </div>
        `
      }
    },
  },
  {
    title: 'Action',
    formatter: (cell) => {
      const record = cell.getRow().getData()
      const isAbsentRecord = record.id && record.id.toString().startsWith('absent-')
      const isPending = record.approvalStatus === 'Pending'
      const isApproved = record.approvalStatus === 'Approved'
      const hasAttendance =
        record.signIn &&
        record.signIn !== '-' &&
        record.signIn !== 'N/A' &&
        record.signOut &&
        record.signOut !== '-' &&
        record.signOut !== 'N/A'
      const isRejected = record.approvalStatus === 'Rejected'
      if (isAbsentRecord || !hasAttendance || isRejected) {
        return ''
      }

      // Always show View button
      let actions = `
        <button class="${commonButtonClasses} hover:bg-primaryColor/80 view-button" title="View Attendance">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      `

      // Only show Approve/Reject if user has HR Full Access and record is pending
      if (canManageAttendance.value && isPending) {
        actions += `
          <button class="${commonButtonClasses} hover:bg-green-500 approve-button" title="Approve Attendance">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </button>
          <button class="${commonButtonClasses} hover:bg-red-400 reject-button" title="Reject Attendance">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        `
      }

      return `<div class="flex gap-2">${actions}</div>`
    },
    headerSort: false,
    cellClick: async (e, cell) => {
      const record = cell.getRow().getData()
      if (e.target.closest('.approve-button') && canManageAttendance.value) {
        if (record.approvalStatus === 'Approved') {
          showToast('This record is already approved', 'warning')
          return
        }
        openApprovalModal(record)
      } else if (e.target.closest('.view-button')) {
        emit('view', record)
      } else if (e.target.closest('.reject-button') && canManageAttendance.value) {
        if (record.approvalStatus === 'Approved') {
          showToast('Cannot reject an approved attendance record', 'error')
          return
        }
        openRejectOTModal(record)
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

// Modify the watch handler to prevent recursive updates
watch(
  [() => props.records, () => employeeStore.employees],
  async ([newRecords, employees]) => {
    if (isTableBuilt.value && table) {
      try {
        // Only use the props records, don't merge with store records here
        const mergedData = mergeAttendanceWithEmployees(newRecords, employees)
        table.setData(mergedData)
      } catch (error) {
        console.error('Error updating table data:', error)
      }
    }
  },
  { deep: true },
)

// Update the initTable function
const initTable = async () => {
  if (tableRef.value) {
    try {
      await employeeStore.loadEmployees()

      // Only call resetDailyAttendance if it exists
      if (typeof attendanceStore.resetDailyAttendance === 'function') {
        attendanceStore.resetDailyAttendance()
      }

      const initialData = mergeAttendanceWithEmployees(props.records, employeeStore.employees)

      console.log('Loaded employees:', employeeStore.employees)
      console.log('Loaded attendance records:', props.records)
      console.log(
        'Merged data:',
        mergeAttendanceWithEmployees(props.records, employeeStore.employees),
      )

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
        initialSort: [
          {
            column: 'full_name',
            dir: 'asc',
          },
        ],
        dataLoaded: function () {
          this.redraw(true)
        },
        rowFormatter: function (row) {
          const data = row.getData()
        },
      })

      // Add sort event listener if needed
      table.on('sorterChanged', function (column, dir) {
        console.log('Sort changed:', column.getField(), dir)
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
  console.log('Auth store current user:', authStore.currentUser)
  attendanceStore.loadRecords()
  initTable()
  window.addEventListener('attendance-updated', refreshTableData)
})

// Clean up on unmount
onBeforeUnmount(() => {
  if (table) {
    table.destroy()
    table = null
    isTableBuilt.value = false
  }
  // Remove event listener
  window.removeEventListener('attendance-updated', refreshTableData)
})

// Update the refreshTableData function
const refreshTableData = async () => {
  if (isTableBuilt.value && table) {
    try {
      // Load fresh data
      await attendanceStore.loadRecords()
      // Get fresh employee data
      await employeeStore.loadEmployees()
      // Merge attendance with employees to show correct status
      const mergedData = mergeAttendanceWithEmployees(
        attendanceStore.attendanceRecords,
        employeeStore.employees,
      )
      // Update the table with the merged data
      table.setData(mergedData)
    } catch (error) {
      console.error('Error refreshing table data:', error)
    }
  }
}

// Expose refreshTableData to parent components
defineExpose({
  refreshTableData,
})

// Add these methods after your existing code but before the end of the script setup
const openApprovalModal = (record) => {
  selectedRecord.value = record
  showApprovalModal.value = true
}

const closeApprovalModal = () => {
  showApprovalModal.value = false
  selectedRecord.value = null
}

const confirmApproval = async () => {
  try {
    // Get the current user's employee record from employeeStore
    const currentEmployee = employeeStore.employees.find(
      (emp) => emp.employee_id === authStore.currentUser.id,
    )

    if (!currentEmployee) {
      throw new Error('Employee information not found')
    }

    const approverDetails = {
      name: currentEmployee.full_name, // Use the full name from employee store
      userId: authStore.currentUser.id,
      timestamp: new Date().toISOString(),
    }
    console.log('Approver details before approval (detailed):', {
      name: approverDetails.name,
      userId: approverDetails.userId,
      timestamp: approverDetails.timestamp,
    })

    // Update the store
    const updatedRecord = await attendanceStore.approveAttendance(
      selectedRecord.value.id,
      approverDetails,
    )
    console.log('Updated record after approval (detailed):', {
      id: updatedRecord.id,
      approvalStatus: updatedRecord.approvalStatus,
      approvedBy: updatedRecord.approvedBy,
      approvedAt: updatedRecord.approvedAt,
    })

    // Find the row after refresh
    const row = table.getRow(selectedRecord.value.id)
    if (row) {
      const rowData = {
        ...updatedRecord,
        approvalStatus: 'Approved',
        approvedBy: approverDetails.name,
        approvedAt: approverDetails.timestamp,
      }
      console.log('Row data being updated (detailed):', {
        approvalStatus: rowData.approvalStatus,
        approvedBy: rowData.approvedBy,
        approvedAt: rowData.approvedAt,
      })
      row.update(rowData)
    }

    await refreshTableData()
    showToast('Attendance record approved successfully', 'success')
    closeApprovalModal()
  } catch (error) {
    console.error('Error approving record:', error)
    showToast('Failed to approve attendance record', 'error')
  }
}

const openDeleteModal = (record) => {
  recordToDelete.value = record
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  recordToDelete.value = null
}

const handleDelete = async () => {
  try {
    const record = recordToDelete.value
    if (!record) return

    // Delete the record
    const result = await attendanceStore.deleteRecord(record.id)

    if (result.success) {
      // Clear today's attendance for this employee
      await attendanceStore.clearTodayAttendance(record.employee_id)

      // Refresh the table data
      await refreshTableData()

      // Show success message
      showToast(
        'Attendance record deleted successfully. Employee can now re-enter attendance.',
        'success',
      )

      // Close modal
      closeDeleteModal()

      // Dispatch custom event with employee details
      window.dispatchEvent(
        new CustomEvent('attendance-deleted', {
          detail: {
            employeeId: record.employee_id,
            date: record.date,
          },
        }),
      )
    }
  } catch (error) {
    console.error('Error deleting record:', error)
    showToast('Failed to delete attendance record', 'error')
  }
}

function formatToYYYYMMDD(date) {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

attendanceStore.attendanceRecords.forEach((r) => {
  if (
    r.employee_id === '2025-50001' &&
    new Date(r.date).toISOString().split('T')[0] === '2025-04-27'
  ) {
    console.log(
      'Record:',
      r,
      'attendance_type:',
      r.attendance_type,
      'attendanceType:',
      r.attendanceType,
    )
  }
})

// Only show regular records for the selected date
const rows = computed(() => {
  const selectedDate = attendanceStore.selectedDate
  return attendanceStore.attendanceRecords
    .filter(
      (r) =>
        (r.attendanceType === 'regular' || r.attendance_type === 'regular') &&
        r.date === selectedDate,
    )
    .filter((r) => {
      const emp = employeeStore.employees.find((e) => e.employee_id === r.employee_id)
      return emp && emp.roleInfo?.role_name !== 'Super Admin'
    })
    .map((r) => ({
      id: r.id,
      employee_id: r.employee_id,
      full_name: r.full_name,
      department: r.department,
      signIn: r.signIn || '-',
      signOut: r.signOut || '-',
      workingHours: r.workingHours ?? '-',
      status: isDayOff(r.date, r.work_days) ? 'Day Off' : r.status || 'Absent',
      approvalStatus: r.approvalStatus || 'Pending',
      date: r.date,
      approved_by: r.approved_by,
    }))
})

// Add this new method
const rejectOvertime = async (record) => {
  try {
    await attendanceStore.rejectOvertime(record.id)
    showToast('Overtime request rejected. Regular attendance is preserved.', 'success')
  } catch (error) {
    console.error('Error rejecting overtime:', error)
    showToast('Failed to reject overtime', 'error')
  }
}

const openRejectOTModal = (record) => {
  recordToRejectOT.value = record
  showRejectOTModal.value = true
}

const closeRejectOTModal = () => {
  showRejectOTModal.value = false
  recordToRejectOT.value = null
}

const confirmRejectOT = async () => {
  if (recordToRejectOT.value) {
    await rejectOvertime(recordToRejectOT.value)
    closeRejectOTModal()
  }
}

function getActiveSchedule(employeeId) {
  // Find the active schedule for the employee
  return employeeScheduleStore.employeeSchedules.find(
    (sched) => sched.employee_id === employeeId && sched.deleted_at === null,
  )
}

const isMarkingAbsent = ref(false)

const handleMarkAllAbsent = async () => {
  console.log('Mark All Absent button clicked!')
  isMarkingAbsent.value = true
  try {
    const response = await axios.post(
      '/api/attendance/attendance/mark-all-absent',
      {},
      {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      },
    )
    if (response.data.success) {
      showToast('Successfully marked all scheduled employees as absent for today!', 'success')
      await refreshTableData()
    } else {
      showToast(response.data.message || 'Failed to mark absences.', 'error')
    }
  } catch (error) {
    showToast(error.response?.data?.message || 'Error marking absences. Please try again.', 'error')
  } finally {
    isMarkingAbsent.value = false
  }
}
</script>

<template>
  <div class="w-full bg-white shadow-md rounded-md">
    <div class="flex justify-between items-center">
      <h3 class="font-bold text-lg text-gray-800">Attendance Records</h3>
      <!-- Mark All Absent Button -->
      <div class="flex justify-end p-4" v-if="canManageAttendance">
        <button class="btn-primaryStyle" @click="handleMarkAllAbsent" :disabled="isMarkingAbsent">
          <span v-if="isMarkingAbsent" class="loading loading-spinner loading-xs"></span>
          Mark All Absent for Today
        </button>
      </div>
    </div>
    <div ref="tableRef"></div>
  </div>

  <!-- Approval Confirmation Modal -->
  <input type="checkbox" :checked="showApprovalModal" class="modal-toggle" />
  <div class="modal backdrop-blur-sm">
    <div class="modal-box bg-white">
      <!-- Header -->
      <div class="text-center mb-5">
        <h3 class="font-bold text-lg text-gray-800">Approve Attendance Record</h3>
        <p class="text-sm text-gray-600">Are you sure you want to approve this record?</p>
      </div>

      <!-- Content -->
      <div v-if="selectedRecord" class="space-y-4">
        <!-- Employee Info Section -->
        <div class="bg-gray-50 rounded-lg p-4 space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <p class="text-xs text-gray-600">Employee Name</p>
              <p class="font-medium text-gray-800">{{ selectedRecord.full_name }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-600">Department</p>
              <p class="font-medium text-gray-800">{{ selectedRecord.department }}</p>
            </div>
          </div>

          <!-- Attendance Details -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <p class="text-xs text-gray-600">Time In</p>
              <p class="font-medium text-gray-800">{{ selectedRecord.signIn }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-600">Time Out</p>
              <p class="font-medium text-gray-800">{{ selectedRecord.signOut }}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <p class="text-xs text-gray-600">Date</p>
              <p class="font-medium text-gray-800">
                {{ new Date(selectedRecord.date).toLocaleDateString() }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-600">Status</p>
              <p class="font-medium text-gray-800">{{ selectedRecord.status }}</p>
            </div>
          </div>
        </div>

        <!-- Warning Message -->
        <div class="text-sm text-gray-600 text-center flex items-center justify-center gap-2">
          <span class="text-warning flex items-center gap-2 text-sm"
            ><TriangleAlert class="w-4 h-4" />This action cannot be undone.</span
          >
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="modal-action justify-center mt-6">
        <button class="btn-secondaryStyle" @click="closeApprovalModal">Cancel</button>
        <button class="btn-primaryStyle" @click="confirmApproval">Approve</button>
      </div>
    </div>
  </div>

  <!-- Delete Confirmation Modal -->
  <input type="checkbox" :checked="showDeleteModal" class="modal-toggle" />
  <div class="modal backdrop-blur-sm">
    <div class="modal-box bg-white">
      <!-- Header -->
      <div class="text-center mb-5">
        <h3 class="font-bold text-lg text-gray-800">Delete Attendance Record</h3>
        <p class="text-sm text-gray-600">Are you sure you want to delete this attendance record?</p>
      </div>

      <!-- Content -->
      <div v-if="selectedRecord" class="space-y-4">
        <!-- Employee Info Section -->
        <div class="bg-gray-50 rounded-lg p-4 space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <p class="text-xs text-gray-600">Employee Name</p>
              <p class="font-medium text-gray-800">{{ selectedRecord.full_name }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-600">Department</p>
              <p class="font-medium text-gray-800">{{ selectedRecord.department }}</p>
            </div>
          </div>

          <!-- Warning Message -->
          <div class="text-sm text-red-600 text-center flex items-center justify-center gap-2">
            <span class="flex items-center gap-2">
              <TriangleAlert class="w-4 h-4" />
              After deletion, the employee will be able to re-enter their attendance for today.
            </span>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="modal-action justify-center mt-6">
        <button class="btn-secondaryStyle" @click="closeDeleteModal">Cancel</button>
        <button class="btn-primaryStyle bg-red-500 hover:bg-red-600" @click="handleDelete">
          Delete
        </button>
      </div>
    </div>
  </div>

  <!-- Reject OT Confirmation Modal -->
  <dialog :open="showRejectOTModal" class="modal">
    <div class="modal-box bg-white text-black">
      <h3 class="font-bold text-lg">Reject Overtime Request</h3>
      <div
        class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
      />
      <p class="py-4">
        Are you sure you want to <b>reject</b> the overtime request for
        <span class="font-semibold">{{ recordToRejectOT?.full_name }}</span> on
        <span class="font-semibold">{{ formatDate(recordToRejectOT?.date) }}</span
        >?
        <br />
        <span class="text-warning">This action cannot be undone.</span>
      </p>
      <div class="modal-action">
        <button class="btn-secondaryStyle" @click="closeRejectOTModal">Cancel</button>
        <button class="btn-errorStyle" @click="confirmRejectOT">Reject OT</button>
      </div>
    </div>
  </dialog>
</template>
