<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAttendanceStore } from '@/stores/HR Management/attendanceStore'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'
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
const {
  reportFilters,
  getAttendanceReport,
  reportSummary,
  departmentReportSummary,
  getDepartmentAttendanceReport,
  departmentEmployeeSummaries,
  mappedDepartmentAttendance,
} = storeToRefs(attendanceStore)

// Form state
const formData = ref({
  department: '',
  employeeName: '',
  startDate: '',
  endDate: '',
})

// Add a state to track if a report has been generated
const hasGeneratedReport = ref(false)

// Load initial data and reset report
onMounted(async () => {
  await employeeStore.loadEmployees()
  await attendanceStore.loadRecords()
  attendanceStore.resetReportFilters()
  hasGeneratedReport.value = false
})

const isDepartmentReport = ref(false)

const handleFormSubmit = async (employeeId) => {
  isDepartmentReport.value = employeeId === 'ALL'
  attendanceStore.setReportFilters({
    startDate: formData.value.startDate,
    endDate: formData.value.endDate,
    department: formData.value.department,
    employeeId,
  })
  hasGeneratedReport.value = true

  if (isDepartmentReport.value) {
    await attendanceStore.fetchDepartmentAttendance(
      formData.value.department,
      formData.value.startDate,
      formData.value.endDate,
    )
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
</script>

<template>
  <div class="attendance-report-container min-h-screen overflow-y-auto">
    <div class="report-container w-full flex flex-col justify-between gap-4 text-black">
      <AttendanceReportForm v-model:formData="formData" @submit="handleFormSubmit" />

      <AttendanceReportSummary
        v-if="hasGeneratedReport && (isDepartmentReport ? departmentReportSummary : reportSummary)"
        :employee-name="isDepartmentReport ? formData.department : formData.employeeName"
        :summary="isDepartmentReport ? departmentReportSummary : reportSummary"
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

      <AttendanceReportTable
        v-if="
          hasGeneratedReport &&
          (isDepartmentReport
            ? getDepartmentAttendanceReport.length > 0
            : getAttendanceReport.length > 0)
        "
        :records="isDepartmentReport ? getDepartmentAttendanceReport : getAttendanceReport"
        :is-department-report="isDepartmentReport"
        @generate-pdf="
          generatePDF(
            formData,
            isDepartmentReport ? departmentReportSummary : reportSummary,
            isDepartmentReport ? getDepartmentAttendanceReport : getAttendanceReport,
          )
        "
      >
        <template #default="{ records }">
          <tbody>
            <tr v-for="record in records" :key="record.date">
              <td>{{ record.date }}</td>
              <td>{{ record.signIn || '-' }}</td>
              <td>{{ record.signOut || '-' }}</td>
              <td>
                <span
                  :class="{
                    'bg-red-100 text-red-700 px-2 rounded': record.status === 'Absent',
                    'bg-green-100 text-green-700 px-2 rounded': record.status === 'Present',
                    'bg-yellow-100 text-yellow-700 px-2 rounded': record.status === 'Late',
                    'bg-blue-100 text-blue-700 px-2 rounded': record.status === 'On Leave',
                  }"
                >
                  {{ record.status }}
                </span>
              </td>
              <td>{{ record.workingHours || '-' }}</td>
            </tr>
          </tbody>
        </template>
      </AttendanceReportTable>

      <!-- Add a message when no data is found -->
      <div
        v-if="hasGeneratedReport && (!reportSummary || !getAttendanceReport?.length)"
        class="p-4 text-center text-gray-500 bg-white rounded-md shadow-md"
      >
        No attendance records found for the selected period.
      </div>

      <!-- Per-Employee Summary Table -->
      <div
        v-if="isDepartmentReport && departmentEmployeeSummaries.length"
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
              <tr v-for="emp in departmentEmployeeSummaries" :key="emp.name">
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

      <!-- Department Attendance Chart -->
      <div
        v-if="isDepartmentReport && departmentEmployeeSummaries.length"
        class="bg-white shadow-md rounded-md p-5 mb-4"
      >
        <h2 class="font-semibold mb-2">Department Attendance Chart</h2>
        <Bar
          :data="chartData"
          :options="{ responsive: true, plugins: { legend: { position: 'top' } } }"
        />
      </div>

      <AttendanceReportTable
        v-if="isDepartmentReport && hasGeneratedReport && mappedDepartmentAttendance.length"
        :records="mappedDepartmentAttendance"
        :is-department-report="true"
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
