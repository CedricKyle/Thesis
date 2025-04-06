<script setup>
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAttendanceStore } from '@/stores/HR Management/attendanceStore'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'
import AttendanceReportForm from '@/components/Admin Components/HR/Attendance Report/AttendanceReportForm.vue'
import AttendanceReportSummary from '@/components/Admin Components/HR/Attendance Report/AttendanceReportSummary.vue'
import AttendanceReportTable from '@/components/Admin Components/HR/Attendance Report/AttendanceReportTable.vue'
import { usePDFGenerator } from '@/composables/Admin Composables/Human Resource/usePDFGenerator'

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

// Load initial data
onMounted(() => {
  employeeStore.loadEmployees()
  attendanceStore.loadRecords()
})

const handleFormSubmit = (employeeId) => {
  attendanceStore.setReportFilters({
    startDate: formData.value.startDate,
    endDate: formData.value.endDate,
    department: formData.value.department,
    employeeId,
  })
}

const { generatePDF } = usePDFGenerator()
</script>

<template>
  <div class="attendance-report-container min-h-screen overflow-y-auto">
    <div class="report-container w-full flex flex-col justify-between gap-4 text-black">
      <AttendanceReportForm v-model:formData="formData" @submit="handleFormSubmit" />

      <AttendanceReportSummary
        v-if="reportSummary"
        :employee-name="formData.employeeName"
        :summary="reportSummary"
      />

      <AttendanceReportTable
        v-if="getAttendanceReport.length"
        :records="getAttendanceReport"
        @generate-pdf="generatePDF(formData, reportSummary, getAttendanceReport)"
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
