<script setup>
import { ref, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAttendanceStore } from '@/stores/HR Management/attendanceStore'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'
import AttendanceReportForm from '@/components/Admin Components/HR/Attendance Report/AttendanceReportForm.vue'
import AttendanceReportSummary from '@/components/Admin Components/HR/Attendance Report/AttendanceReportSummary.vue'
import AttendanceReportTable from '@/components/Admin Components/HR/Attendance Report/AttendanceReportTable.vue'
import { usePDFGenerator } from '@/composables/Admin Composables/Human Resource/usePDFGenerator'

// Add this import for environment variables
const isDevelopment = import.meta.env.MODE === 'development'

// Store setup
const attendanceStore = useAttendanceStore()
const employeeStore = useEmployeeStore()
const { reportFilters, getAttendanceReport, reportSummary } = storeToRefs(attendanceStore)

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
  // Reset report data on mount
  attendanceStore.resetReportFilters()
  hasGeneratedReport.value = false

  console.log('Initial store state:', {
    employees: employeeStore.employees,
    attendanceRecords: attendanceStore.records,
  })
})

const handleFormSubmit = (employeeId) => {
  console.log('Form submitted with:', {
    startDate: formData.value.startDate,
    endDate: formData.value.endDate,
    department: formData.value.department,
    employeeId,
  })

  attendanceStore.setReportFilters({
    startDate: formData.value.startDate,
    endDate: formData.value.endDate,
    department: formData.value.department,
    employeeId,
  })

  // Add logs to check the state after setting filters
  console.log('After setting filters:', {
    hasReport: hasGeneratedReport.value,
    reportSummary: reportSummary.value,
    reportLength: getAttendanceReport.value?.length,
    attendanceReport: getAttendanceReport.value,
  })

  hasGeneratedReport.value = true
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

// Add a watch to monitor the reactive properties
watch(
  [reportSummary, getAttendanceReport],
  ([newSummary, newReport]) => {
    console.log('Report data updated:', {
      summary: newSummary,
      reportLength: newReport?.length,
      report: newReport,
    })
  },
  { deep: true },
)

const { generatePDF } = usePDFGenerator()
</script>

<template>
  <div class="attendance-report-container min-h-screen overflow-y-auto">
    <div class="report-container w-full flex flex-col justify-between gap-4 text-black">
      <AttendanceReportForm v-model:formData="formData" @submit="handleFormSubmit" />

      <!-- Change process.env to use isDevelopment -->
      <div v-if="isDevelopment" class="text-sm text-gray-500">
        Has Generated Report: {{ hasGeneratedReport }} Has Summary: {{ !!reportSummary }} Report
        Length: {{ getAttendanceReport?.length }}
      </div>

      <AttendanceReportSummary
        v-if="hasGeneratedReport && reportSummary"
        :employee-name="formData.employeeName"
        :summary="reportSummary"
      />

      <AttendanceReportTable
        v-if="hasGeneratedReport && getAttendanceReport?.length > 0"
        :records="getAttendanceReport"
        @generate-pdf="generatePDF(formData, reportSummary, getAttendanceReport)"
      />

      <!-- Add a message when no data is found -->
      <div
        v-if="hasGeneratedReport && (!reportSummary || !getAttendanceReport?.length)"
        class="p-4 text-center text-gray-500 bg-white rounded-md shadow-md"
      >
        No attendance records found for the selected period.
      </div>
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
