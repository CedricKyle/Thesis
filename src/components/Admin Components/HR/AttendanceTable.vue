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
const { formatDate, calculateOvertime } = useAttendanceLogic()
const employeeStore = useEmployeeStore()
const authStore = useAuthStore()
const attendanceStore = useAttendanceStore()
const { showToast } = useToast()

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

// Simplify mergeAttendanceWithEmployees
const mergeAttendanceWithEmployees = (attendanceRecords, employees) => {
  const filteredEmployees = employees.filter(
    (emp) => !emp.deleted_at && emp.roleInfo?.role_name !== 'Super Admin',
  )
  const rows = []

  filteredEmployees.forEach((employee) => {
    const selectedDate = attendanceStore.selectedDate

    // Use only attendanceType
    const getType = (r) => r.attendanceType

    // Find the regular attendance record for this employee and date
    const regular = attendanceRecords.find(
      (r) =>
        r.employee_id === employee.employee_id &&
        getType(r) === 'regular' &&
        r.date === selectedDate,
    )

    // Find the approved overtime record for this employee and date
    const overtime = attendanceRecords.find(
      (r) =>
        r.employee_id === employee.employee_id &&
        getType(r) === 'overtime' &&
        r.date === selectedDate &&
        (r.approvalStatus === 'Approved' || r.approval_status === 'Approved'),
    )

    if (regular) {
      rows.push({
        id: regular.id,
        employee_id: regular.employee_id,
        full_name: regular.full_name || employee.full_name,
        department: regular.department || employee.department,
        signIn: regular.signIn || regular.time_in || '-',
        signOut: regular.signOut || regular.time_out || '-',
        workingHours: regular.workingHours ?? regular.working_hours ?? '-',
        overtimeHours: overtime
          ? (overtime.overtimeHours ?? overtime.overtime_hours ?? '-')
          : (regular.overtimeHours ?? regular.overtime_hours ?? '-'),
        status: regular.status || 'Present',
        approvalStatus: regular.approvalStatus || regular.approval_status || 'Pending',
        overtimeProof:
          regular.overtimeProof ||
          regular.overtime_proof ||
          (overtime && (overtime.overtimeProof || overtime.overtime_proof)) ||
          null,
        isOvertime: false,
        date: regular.date,
        approved_by: regular.approved_by,
      })
    } else {
      // If no regular record, show as absent
      rows.push({
        id: `absent-${employee.employee_id}`,
        employee_id: employee.employee_id,
        full_name: employee.full_name,
        department: employee.department,
        signIn: '-',
        signOut: '-',
        workingHours: '-',
        overtimeHours: '-',
        status: 'Absent',
        approvalStatus: 'Pending',
        overtimeProof: null,
        isOvertime: false,
        date: selectedDate,
      })
    }
  })

  return rows
}

// Update the permission check to use HR_MANAGE_ATTENDANCE
const canManageAttendance = computed(() => {
  const userRole = authStore.currentUser?.role
  const userPermissions = authStore.currentUser?.permissions || []

  // Allow Super Admin or users with specific permissions
  return (
    userRole === 'Super Admin' ||
    userPermissions.some(
      (permission) =>
        permission === PERMISSION_IDS.HR_MANAGE_ATTENDANCE ||
        permission === PERMISSION_IDS.HR_FULL_ACCESS,
    )
  )
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
    title: 'Time In',
    field: 'signIn',
    formatter: (cell) => {
      const value = cell.getValue()
      if (!value || value === '-' || value === 'N/A') return value
      const timeParts = value.split(':')
      return timeParts.slice(0, 2).join(':')
    },
    headerSort: true,
    sorter: (a, b) => {
      if (a === '-' || a === 'N/A') return 1
      if (b === '-' || b === 'N/A') return -1
      return a.localeCompare(b)
    },
  },
  {
    title: 'Time Out',
    field: 'signOut',
    formatter: (cell) => {
      const value = cell.getValue()
      if (!value || value === '-' || value === 'N/A') return value
      const timeParts = value.split(':')
      return timeParts.slice(0, 2).join(':')
    },
    headerSort: true,
    sorter: (a, b) => {
      if (a === '-' || a === 'N/A') return 1
      if (b === '-' || b === 'N/A') return -1
      return a.localeCompare(b)
    },
  },
  {
    title: 'Working Hours',
    field: 'workingHours',
    formatter: (cell) => {
      const record = cell.getRow().getData()
      if (record.isOvertime) return '-'
      if (
        record.status === 'Absent' ||
        record.workingHours === '-' ||
        record.workingHours === null ||
        record.workingHours === undefined ||
        Number(record.workingHours) === 0
      ) {
        return '-'
      }
      return `${Number(record.workingHours).toFixed(2)}`
    },
    headerSort: true,
  },
  {
    title: 'Overtime Hours',
    field: 'overtimeHours',
    formatter: (cell) => {
      const record = cell.getRow().getData()
      return record.overtimeHours && record.overtimeHours > 0
        ? `${Number(record.overtimeHours).toFixed(2)}`
        : '-'
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
      if (record.isOvertime) {
        displayStatus = 'Overtime'
      } else if (record.signIn === '-' || record.signIn === 'N/A') {
        displayStatus = 'Absent'
      }
      const statusClass = record.isOvertime
        ? 'badge badge-outline badge-info'
        : statusClasses[displayStatus] || ''
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
    },
  },
  {
    title: 'Overtime Proof',
    field: 'overtimeProof',
    formatter: (cell) => {
      let value = cell.getValue()
      console.log('Overtime Proof value:', value)
      if (!value) return '-'
      value = value.replace(/\\/g, '/')
      const url = value.startsWith('http')
        ? value
        : `http://localhost:3000/${value.replace(/^\//, '')}`
      return `<img src="${url}" alt="Overtime Proof" style="max-width:30px;max-height:30px;border-radius:4px;cursor:pointer;" onclick="window.open('${url}','_blank')" />`
    },
    headerSort: false,
  },
  {
    title: 'Action',
    formatter: (cell) => {
      const record = cell.getRow().getData()
      const isAbsentRecord = record.id && record.id.toString().startsWith('absent-')
      const isPending = record.approvalStatus === 'Pending'
      const isApproved = record.approvalStatus === 'Approved'
      const hasAttendance =
        (record.isOvertime && record.overtimeProof) ||
        (record.signIn &&
          record.signIn !== '-' &&
          record.signIn !== 'N/A' &&
          record.signOut &&
          record.signOut !== '-' &&
          record.signOut !== 'N/A')
      const hasOT = !!record.overtimeProof
      const showRejectOT = hasOT && record.approvalStatus !== 'Approved'
      if (isAbsentRecord || !hasAttendance) {
        return ''
      }
      return `
        <div class="flex gap-2">
          <button class="${commonButtonClasses} hover:bg-primaryColor/80 view-button">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
          ${
            isPending
              ? `
            <button class="${commonButtonClasses} hover:bg-green-500 approve-button"
                    title="Approve Attendance">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </button>
          `
              : ''
          }
          ${
            !isApproved
              ? `
            <button class="${commonButtonClasses} hover:bg-red-400 delete-button">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          `
              : ''
          }
          ${
            showRejectOT
              ? `<button 
                  title="Reject OT"
                  class="${commonButtonClasses} hover:bg-yellow-500 text-black reject-ot-button">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                </button>`
              : ''
          }
        </div>`
    },
    headerSort: false,
    cellClick: async (e, cell) => {
      const record = cell.getRow().getData()
      // Defensive: Prevent double approval
      if (e.target.closest('.approve-button') && canManageAttendance.value) {
        if (record.approvalStatus === 'Approved') {
          showToast('This record is already approved', 'warning')
          return
        }
        openApprovalModal(record)
      } else if (e.target.closest('.view-button')) {
        emit('view', record)
      } else if (e.target.closest('.delete-button') && canManageAttendance.value) {
        if (record.approvalStatus === 'Approved') {
          showToast('Cannot delete an approved attendance record', 'error')
          return
        }
        openDeleteModal(record)
      } else if (e.target.closest('.reject-ot-button')) {
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
          if (data.isOvertime) {
            row.getElement().style.background = '#e6f7ff'
            row.getElement().style.fontWeight = 'bold'
          }
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

console.log('Selected date:', attendanceStore.selectedDate)
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
      overtimeHours: r.overtimeHours ?? '-',
      status: r.status || 'Absent',
      approvalStatus: r.approvalStatus || 'Pending',
      overtimeProof: r.overtimeProof || null,
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
</script>

<template>
  <div class="w-full bg-white shadow-md rounded-md">
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
