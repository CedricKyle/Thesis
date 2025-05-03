<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAttendanceStore } from '@/stores/HR Management/attendanceStore'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'
import { useEmployeeScheduleStore } from '@/stores/HR Management/employeeScheduleStore'
import AttendanceReportForm from '@/components/Admin Components/HR/Attendance Report/AttendanceReportForm.vue'
import AttendanceReportSummary from '@/components/Admin Components/HR/Attendance Report/AttendanceReportSummary.vue'
import AttendanceReportTable from '@/components/Admin Components/HR/Attendance Report/AttendanceReportTable.vue'
import { usePDFGenerator } from '@/composables/Admin Composables/Human Resource/usePDFGenerator'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const isDevelopment = import.meta.env.MODE === 'development'

// Store setup
const attendanceStore = useAttendanceStore()
const employeeStore = useEmployeeStore()
const employeeScheduleStore = useEmployeeScheduleStore()
const {
  reportFilters,
  getAttendanceReport,
  reportSummary,
  departmentReportSummary,
  getDepartmentAttendanceReport,
  departmentEmployeeSummaries,
  mappedDepartmentAttendance,
  departmentFullSummary,
  departmentFullEmployeeSummaries,
} = storeToRefs(attendanceStore)

// Form state
const formData = ref({
  department: '',
  employeeName: '',
  startDate: '',
  endDate: '',
})

// Error state
const error = ref(null)
const isLoading = ref(false)

// Add a state to track if a report has been generated
const hasGeneratedReport = ref(false)

// Helper to check if a date is a day off for the employee
function isDayOff(dateString, dayOffString) {
  if (!dayOffString) return false
  const dayOffs = dayOffString.split(',').map((d) => d.trim().toLowerCase())
  const date = new Date(dateString)
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  return dayOffs.includes(dayName)
}

// Load initial data and reset report
onMounted(async () => {
  try {
    isLoading.value = true
    error.value = null
    await employeeStore.loadEmployees()
    await attendanceStore.loadRecords()
    await employeeScheduleStore.fetchEmployeeSchedules()
    attendanceStore.resetReportFilters()
    hasGeneratedReport.value = false
  } catch (err) {
    error.value = 'Failed to load initial data. Please refresh the page.'
    console.error('Initialization error:', err)
  } finally {
    isLoading.value = false
  }
})

const isDepartmentReport = ref(false)

const handleFormSubmit = async (employeeId) => {
  try {
    isLoading.value = true
    error.value = null

    // If "ALL_DEPARTMENTS" is selected, treat as department report
    isDepartmentReport.value =
      employeeId === 'ALL' || formData.value.department === 'ALL_DEPARTMENTS'

    attendanceStore.setReportFilters({
      startDate: formData.value.startDate,
      endDate: formData.value.endDate,
      department: formData.value.department,
      employeeId,
    })

    if (isDepartmentReport.value) {
      await attendanceStore.fetchDepartmentAttendance(
        formData.value.department,
        formData.value.startDate,
        formData.value.endDate,
      )
    }

    hasGeneratedReport.value = true
  } catch (err) {
    error.value = 'Failed to generate report. Please try again.'
    console.error('Report generation error:', err)
    hasGeneratedReport.value = false
  } finally {
    isLoading.value = false
  }
}

// Watch for form data changes to reset report
watch(
  formData,
  () => {
    if (hasGeneratedReport.value) {
      attendanceStore.resetReportFilters()
      hasGeneratedReport.value = false
    }
  },
  { deep: true },
)

const { generatePDF } = usePDFGenerator()

const chartData = computed(() => ({
  labels: departmentEmployeeSummaries.value.map((emp) => emp.name),
  datasets: [
    {
      label: 'Present',
      data: departmentEmployeeSummaries.value.map((emp) => emp.present),
      backgroundColor: '#4ade80',
    },
    {
      label: 'Late',
      data: departmentEmployeeSummaries.value.map((emp) => emp.late),
      backgroundColor: '#facc15',
    },
    {
      label: 'Absent',
      data: departmentEmployeeSummaries.value.map((emp) => emp.absent),
      backgroundColor: '#f87171',
    },
    {
      label: 'On Leave',
      data: departmentEmployeeSummaries.value.map((emp) => emp.onLeave),
      backgroundColor: '#60a5fa',
    },
  ],
}))

const employeeChartData = computed(() => {
  if (!reportSummary.value) return { labels: [], datasets: [] }
  return {
    labels: ['Present', 'Late', 'Absent', 'On Leave'],
    datasets: [
      {
        label: 'Days',
        data: [
          reportSummary.value['Present Days'] || 0,
          reportSummary.value['Late Days'] || 0,
          reportSummary.value['Absent Days'] || 0,
          reportSummary.value['On Leave Days'] || 0,
        ],
        backgroundColor: ['#4ade80', '#facc15', '#f87171', '#60a5fa'],
      },
    ],
  }
})

// Chart for department report (uses full employee summaries)
const departmentChartData = computed(() => ({
  labels: departmentFullEmployeeSummaries.value.map((emp) => emp.name),
  datasets: [
    {
      label: 'Present',
      data: departmentFullEmployeeSummaries.value.map((emp) => emp.present),
      backgroundColor: '#466114',
    },
    {
      label: 'Late',
      data: departmentFullEmployeeSummaries.value.map((emp) => emp.late),
      backgroundColor: '#f87a14',
    },
    {
      label: 'Absent',
      data: departmentFullEmployeeSummaries.value.map((emp) => emp.absent),
      backgroundColor: '#f87171',
    },
    {
      label: 'On Leave',
      data: departmentFullEmployeeSummaries.value.map((emp) => emp.onLeave),
      backgroundColor: '#60a5fa',
    },
  ],
}))

const departmentMostStats = computed(() => {
  if (!isDepartmentReport.value || !departmentFullEmployeeSummaries.value.length) return {}

  const emps = departmentFullEmployeeSummaries.value

  // Find max values
  const maxPresent = Math.max(...emps.map((e) => e.present))
  const maxLate = Math.max(...emps.map((e) => e.late))
  const maxAbsent = Math.max(...emps.map((e) => e.absent))

  // Find all employees with the max value (and value > 0)
  const mostPresent = emps.filter((e) => e.present === maxPresent && maxPresent > 0)
  const mostLate = emps.filter((e) => e.late === maxLate && maxLate > 0)
  const mostAbsent = emps.filter((e) => e.absent === maxAbsent && maxAbsent > 0)

  return {
    mostPresent,
    mostLate,
    mostAbsent,
    maxPresent,
    maxLate,
    maxAbsent,
  }
})

const handleExportPDF = () => {
  if (isDepartmentReport.value) {
    console.log('Department PDF:', {
      summary: departmentFullSummary.value,
      records: mappedDepartmentAttendance.value,
      empSummaries: departmentFullEmployeeSummaries.value,
    })
    generatePDF(
      formData.value,
      departmentFullSummary.value,
      mappedDepartmentAttendance.value,
      departmentFullEmployeeSummaries.value,
    )
  } else {
    console.log('Employee PDF:', {
      summary: reportSummary.value,
      records: getAttendanceReport.value,
    })
    generatePDF(formData.value, reportSummary.value, getAttendanceReport.value, [])
  }
}

console.log(
  'Attendance Report Records:',
  isDepartmentReport.value ? mappedDepartmentAttendance.value : getAttendanceReport.value,
)

const correctedReportSummary = computed(() => {
  const records = getAttendanceReport.value || []
  if (!records.length) return {}

  // Get the employee's schedule (assuming only one schedule per employee)
  const schedule = employeeScheduleStore.employeeSchedules.find(
    (s) => s.employee_id === reportFilters.value.employeeId,
  )
  const dayOffString = schedule?.dayOff || ''

  // Only count scheduled workdays (exclude day offs)
  const workdayRecords = records.filter((r) => !isDayOff(r.date, dayOffString))

  const presentDays = workdayRecords.filter((r) => r.status === 'Present').length
  const lateDays = workdayRecords.filter((r) => r.status === 'Late').length
  const totalPresentDays = presentDays + lateDays
  const absentDays = workdayRecords.filter((r) => r.status === 'Absent').length
  const onLeaveDays = workdayRecords.filter((r) => r.status === 'On Leave').length
  const totalRegularHours = workdayRecords
    .filter((r) => r.status !== 'Absent' && r.status !== 'On Leave')
    .reduce((sum, r) => sum + Number(r.regular_hours || 0), 0)
  const totalHours = workdayRecords
    .filter((r) => r.status !== 'Absent' && r.status !== 'On Leave')
    .reduce((sum, r) => sum + Number(r.workingHours ?? r.hours_worked ?? 0), 0)
  const totalOvertime = workdayRecords
    .filter((r) => r.status !== 'Absent' && r.status !== 'On Leave')
    .reduce((sum, r) => sum + Number(r.overtime_hours || 0), 0)

  return {
    'Total Days': workdayRecords.length,
    'Present Days': presentDays,
    'Late Days': lateDays,
    'Total Present Days': totalPresentDays,
    'Absent Days': absentDays,
    'On Leave Days': onLeaveDays,
    'Regular Hours': totalRegularHours,
    'Total Hours': totalHours,
    'Total Overtime': totalOvertime,
    // ...other stats
  }
})

// Group mappedDepartmentAttendance by employee_id
const departmentEmployeeRecords = computed(() => {
  const map = {}
  mappedDepartmentAttendance.value.forEach((rec) => {
    if (!map[rec.full_name]) map[rec.full_name] = []
    map[rec.full_name].push(rec)
  })
  return map
})

const correctedDepartmentEmployeeSummaries = computed(() => {
  if (!mappedDepartmentAttendance.value.length) return []

  // Group records by employee
  const employeeMap = {}
  mappedDepartmentAttendance.value.forEach((rec) => {
    if (!employeeMap[rec.employee_id]) employeeMap[rec.employee_id] = []
    employeeMap[rec.employee_id].push(rec)
  })

  return Object.entries(employeeMap).map(([employee_id, records]) => {
    // Get employee name and department from first record
    const { full_name, department } = records[0] || {}

    // Get schedule for this employee
    const schedule = employeeScheduleStore.employeeSchedules.find(
      (s) => s.employee_id === employee_id,
    )
    const dayOffString = schedule?.dayOff || ''

    // Filter out day offs
    const filteredRecords = records.filter((r) => !isDayOff(r.date, dayOffString))

    const present = filteredRecords.filter((r) => r.status === 'Present').length
    const late = filteredRecords.filter((r) => r.status === 'Late').length
    const absent = filteredRecords.filter((r) => r.status === 'Absent').length
    const onLeave = filteredRecords.filter((r) => r.status === 'On Leave').length
    const totalHours = filteredRecords
      .filter((r) => r.status !== 'Absent' && r.status !== 'On Leave')
      .reduce((sum, r) => sum + Number(r.workingHours ?? r.hours_worked ?? 0), 0)
    const avgHours = filteredRecords.length ? (totalHours / filteredRecords.length).toFixed(2) : 0

    return {
      name: full_name,
      department,
      present,
      late,
      absent,
      onLeave,
      totalHours,
      avgHours,
    }
  })
})

const allRecords = computed(() => {
  // Combine all records from all employees, excluding their day offs
  return departmentFullEmployeeSummaries.value.flatMap((emp) => {
    const schedule = employeeScheduleStore.employeeSchedules.find(
      (s) => s.employee_id === emp.employee_id,
    )
    const dayOffString = schedule?.dayOff || ''
    return (emp.records || []).filter((r) => !isDayOff(r.date, dayOffString))
  })
})

const companyWideSummary = computed(() => {
  const records = allRecords.value
  if (!records.length) return {}

  const presentDays = records.filter((r) => r.status === 'Present' || r.status === 'Late').length
  const lateDays = records.filter((r) => r.status === 'Late').length
  const absentDays = records.filter((r) => r.status === 'Absent').length
  const onLeaveDays = records.filter((r) => r.status === 'On Leave').length
  const totalHours = records
    .filter((r) => r.status !== 'Absent' && r.status !== 'On Leave')
    .reduce((sum, r) => sum + Number(r.workingHours ?? r.hours_worked ?? 0), 0)
  const totalOvertime = records
    .filter((r) => r.status !== 'Absent' && r.status !== 'On Leave')
    .reduce((sum, r) => sum + Number(r.overtime_hours || 0), 0)

  return {
    'Total Days': records.length,
    'Present Days': presentDays,
    'Late Days': lateDays,
    'Absent Days': absentDays,
    'On Leave Days': onLeaveDays,
    'Total Hours': totalHours,
    'Total Overtime': totalOvertime,
    // ...other stats
  }
})

function getStatusWithDayOff(record, dayOffString) {
  if (isDayOff(record.date, dayOffString)) {
    return 'Day Off'
  }
  return record.status
}

const tableRecords = computed(() => {
  // Example: for individual report
  const records = getAttendanceReport.value || []
  const schedule = employeeScheduleStore.employeeSchedules.find(
    (s) => s.employee_id === reportFilters.value.employeeId,
  )
  const dayOffString = schedule?.dayOff || ''
  return records.map((r) => ({
    ...r,
    status: isDayOff(r.date, dayOffString) ? 'Day Off' : r.status,
  }))
})

const departmentTableRecords = computed(() => {
  return mappedDepartmentAttendance.value.map((rec) => {
    // Hanapin ang schedule ng employee
    const schedule = employeeScheduleStore.employeeSchedules.find(
      (s) => s.employee_id === rec.employee_id,
    )
    const dayOffString = schedule?.dayOff || ''
    return {
      ...rec,
      status: isDayOff(rec.date, dayOffString) ? 'Day Off' : rec.status,
    }
  })
})

const companyTableRecords = computed(() => {
  // Combine all records from all employees
  return mappedDepartmentAttendance.value.map((rec) => {
    const schedule = employeeScheduleStore.employeeSchedules.find(
      (s) => s.employee_id === rec.employee_id,
    )
    const dayOffString = schedule?.dayOff || ''
    return {
      ...rec,
      status: isDayOff(rec.date, dayOffString) ? 'Day Off' : rec.status,
    }
  })
})
</script>

<template>
  <div class="attendance-report-container min-h-screen overflow-y-auto">
    <div class="report-container w-full flex flex-col justify-between gap-4 text-black">
      <!-- Loading Indicator -->
      <div
        v-if="isLoading"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <div class="bg-white p-4 rounded-md shadow-lg">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primaryColor"></div>
          <p class="mt-2 text-sm">Loading...</p>
        </div>
      </div>

      <!-- Error Alert -->
      <div v-if="error" class="bg-red-50 text-red-700 p-4 rounded-md mb-4">
        {{ error }}
        <button @click="error = null" class="float-right text-red-700 hover:text-red-900">×</button>
      </div>

      <AttendanceReportForm v-model:formData="formData" @submit="handleFormSubmit" />

      <!-- Most Stats Cards -->
      <div
        v-if="isDepartmentReport && departmentFullEmployeeSummaries.length"
        class="flex flex-wrap gap-4 mb-2"
      >
        <!-- Most Present -->
        <div
          v-if="departmentMostStats.mostPresent && departmentMostStats.maxPresent > 0"
          class="flex-1 min-w-[200px] bg-green-50 rounded-md p-4 shadow text-center"
        >
          <div class="text-xs text-gray-500 mb-1">Most Present</div>
          <div class="text-lg font-bold text-green-700 flex flex-col items-center gap-1">
            <template v-for="emp in departmentMostStats.mostPresent" :key="emp.name">
              <div>
                {{ emp.name }}
                <div
                  v-if="formData.department === 'ALL_DEPARTMENTS'"
                  class="text-xs text-gray-500 font-normal"
                >
                  {{ emp.department || 'No Department' }}
                </div>
              </div>
            </template>
          </div>
          <div class="text-2xl font-semibold text-green-800">
            {{ departmentMostStats.maxPresent }}
          </div>
        </div>
        <!-- Most Late -->
        <div
          v-if="departmentMostStats.mostLate && departmentMostStats.maxLate > 0"
          class="flex-1 min-w-[200px] bg-yellow-50 rounded-md p-4 shadow text-center"
        >
          <div class="text-xs text-gray-500 mb-1">Most Late</div>
          <div class="text-lg font-bold text-yellow-700 flex flex-col items-center gap-1">
            <template v-for="emp in departmentMostStats.mostLate" :key="emp.name">
              <div>
                {{ emp.name }}
                <div
                  v-if="formData.department === 'ALL_DEPARTMENTS'"
                  class="text-xs text-gray-500 font-normal"
                >
                  {{ emp.department || 'No Department' }}
                </div>
              </div>
            </template>
          </div>
          <div class="text-2xl font-semibold text-yellow-800">
            {{ departmentMostStats.maxLate }}
          </div>
        </div>
        <!-- Most Absent -->
        <div
          v-if="departmentMostStats.mostAbsent && departmentMostStats.maxAbsent > 0"
          class="flex-1 min-w-[200px] bg-red-50 rounded-md p-4 shadow text-center"
        >
          <div class="text-xs text-gray-500 mb-1">Most Absent</div>
          <div class="text-lg font-bold text-red-700 flex flex-col items-center gap-1">
            <template v-for="emp in departmentMostStats.mostAbsent" :key="emp.name">
              <div>
                {{ emp.name }}
                <div
                  v-if="formData.department === 'ALL_DEPARTMENTS'"
                  class="text-xs text-gray-500 font-normal"
                >
                  {{ emp.department || 'No Department' }}
                </div>
              </div>
            </template>
          </div>
          <div class="text-2xl font-semibold text-red-800">
            {{ departmentMostStats.maxAbsent }}
          </div>
        </div>
      </div>

      <AttendanceReportSummary
        v-if="hasGeneratedReport && !isDepartmentReport && correctedReportSummary"
        :employee-name="formData.employeeName"
        :summary="correctedReportSummary"
      />

      <!-- Employee Attendance Chart -->
      <div
        v-if="hasGeneratedReport && !isDepartmentReport && reportSummary"
        class="bg-white shadow-md rounded-md p-5 mb-4"
      >
        <h2 class="font-semibold mb-2">Employee Attendance Chart</h2>
        <Bar
          :data="employeeChartData"
          :options="{ responsive: true, plugins: { legend: { display: false } } }"
        />
      </div>

      <!-- Department Attendance Chart -->
      <div
        v-if="isDepartmentReport && departmentFullEmployeeSummaries.length"
        class="bg-white shadow-md rounded-md p-5 mb-4"
      >
        <h2 class="font-semibold mb-2">Department Attendance Chart</h2>
        <Bar
          :data="departmentChartData"
          :options="{ responsive: true, plugins: { legend: { position: 'top' } } }"
        ></Bar>
      </div>

      <!-- Per-Employee Summary Table -->
      <div
        v-if="isDepartmentReport && departmentFullEmployeeSummaries.length"
        class="bg-white shadow-md rounded-md p-5 mb-4"
      >
        <h2 class="font-semibold mb-2">Per-Employee Attendance Summary</h2>
        <div class="overflow-x-auto">
          <table class="min-w-full text-xs md:text-sm">
            <thead>
              <tr>
                <th class="px-2 py-1">Employee</th>
                <th class="px-2 py-1">Present</th>
                <th class="px-2 py-1">Late</th>
                <th class="px-2 py-1">Absent</th>
                <th class="px-2 py-1">On Leave</th>
                <th class="px-2 py-1">Total Hours</th>
                <th class="px-2 py-1">Avg Hours/Day</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="emp in correctedDepartmentEmployeeSummaries" :key="emp.name">
                <td class="px-2 py-1">{{ emp.name }}</td>
                <td class="px-2 py-1">{{ emp.present }}</td>
                <td class="px-2 py-1">{{ emp.late }}</td>
                <td class="px-2 py-1">{{ emp.absent }}</td>
                <td class="px-2 py-1">{{ emp.onLeave }}</td>
                <td class="px-2 py-1">{{ emp.totalHours }}</td>
                <td class="px-2 py-1">{{ emp.avgHours }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tabulator Table -->
      <AttendanceReportTable
        v-if="
          hasGeneratedReport &&
          ((isDepartmentReport && mappedDepartmentAttendance.length > 0) ||
            (!isDepartmentReport && getAttendanceReport.length > 0))
        "
        :records="isDepartmentReport ? departmentTableRecords : tableRecords"
        :is-department-report="isDepartmentReport"
        :selected-department="formData.department"
        :form-data="formData"
        :summary="isDepartmentReport ? departmentFullSummary : reportSummary"
        :department-employee-summaries="departmentFullEmployeeSummaries"
        @generate-pdf="handleExportPDF"
      />

      <!-- Add a message when no data is found -->
      <div
        v-if="
          hasGeneratedReport &&
          ((isDepartmentReport && mappedDepartmentAttendance.length === 0) ||
            (!isDepartmentReport && (!reportSummary || !getAttendanceReport?.length)))
        "
        class="p-4 text-center text-gray-500 bg-white rounded-md shadow-md"
      >
        No attendance records found for the selected period.
      </div>

      <!-- Company-Wide Summary -->
      <AttendanceReportSummary
        v-if="hasGeneratedReport && isDepartmentReport && companyWideSummary"
        employee-name="All Employees"
        :summary="companyWideSummary"
      />
    </div>
  </div>
</template>

<style scoped>
.fieldset-legend {
  margin-bottom: 0.5rem;
}

input[type='date']::-webkit-calendar-picker-indicator {
  filter: invert(0%) brightness(0%);
  cursor: pointer;
}
</style>
