<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAttendanceStore } from '@/stores/HR Management/attendanceStore'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'
import { useAttendanceLogic } from '@/composables/Admin Composables/Human Resource/useAttendanceLogic'
import { Printer } from 'lucide-vue-next'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// Store setup
const attendanceStore = useAttendanceStore()
const employeeStore = useEmployeeStore()

// Get reactive references
const { reportFilters, getAttendanceReport, reportSummary } = storeToRefs(attendanceStore)
const { employees } = storeToRefs(employeeStore)

// Form state
const formData = ref({
  department: '',
  employeeName: '',
  startDate: '',
  endDate: '',
})

// Computed properties
const filteredEmployees = computed(() => {
  if (!formData.value.department) return []
  return employees.value.filter((emp) => emp.department === formData.value.department)
})

// Handle form submission
const handleSubmit = () => {
  const selectedEmployee = employees.value.find(
    (emp) => emp.fullName === formData.value.employeeName,
  )

  if (!selectedEmployee) return

  attendanceStore.setReportFilters({
    startDate: formData.value.startDate,
    endDate: formData.value.endDate,
    department: formData.value.department,
    employeeId: selectedEmployee.id,
  })
}

// Load initial data
onMounted(() => {
  employeeStore.loadEmployees()
  attendanceStore.loadRecords()
})

// Add this function for PDF generation
const generatePDF = () => {
  if (!reportSummary.value || !getAttendanceReport.value.length) return

  const doc = new jsPDF()

  // Add title
  doc.setFontSize(18)
  doc.text('Attendance Report', 14, 20)

  // Add employee info
  doc.setFontSize(12)
  doc.text(`Employee: ${formData.value.employeeName}`, 14, 30)
  doc.text(`Department: ${formData.value.department}`, 14, 37)
  doc.text(`Period: ${formData.value.startDate} to ${formData.value.endDate}`, 14, 44)

  // Add summary section
  doc.setFontSize(14)
  doc.text('Summary', 14, 55)

  const summaryData = [
    ['Total Days', reportSummary.value.totalDays],
    ['Present Days', reportSummary.value.presentDays],
    ['Absent Days', reportSummary.value.absentDays],
    ['Late Days', reportSummary.value.lateDays],
    ['Total Hours', reportSummary.value.totalHours],
    ['Average Hours/Day', reportSummary.value.averageHoursPerDay],
  ]

  autoTable(doc, {
    startY: 60,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [70, 97, 20] },
  })

  // Add detailed attendance table
  doc.setFontSize(14)
  doc.text('Daily Attendance Details', 14, doc.lastAutoTable.finalY + 15)

  const tableData = getAttendanceReport.value.map((record) => [
    record.date,
    record.signIn,
    record.signOut,
    typeof record.workingHours === 'number' ? record.workingHours.toFixed(2) : '-',
    record.status,
  ])

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 20,
    head: [['Date', 'Time In', 'Time Out', 'Hours Worked', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [70, 97, 20] },
    styles: { fontSize: 10 },
    columnStyles: {
      4: {
        cellCallback: function (cell, opts) {
          switch (cell.raw) {
            case 'Present':
              cell.styles.textColor = [0, 128, 0]
              break
            case 'Absent':
              cell.styles.textColor = [255, 0, 0]
              break
            case 'Late':
              cell.styles.textColor = [255, 140, 0]
              break
          }
        },
      },
    },
  })

  // Add footer
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(10)
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' },
    )
  }

  // Save the PDF
  const fileName = `attendance_report_${formData.value.employeeName.replace(/\s+/g, '_')}_${formData.value.startDate}_${formData.value.endDate}.pdf`
  doc.save(fileName)
}
</script>

<template>
  <div class="attendance-report-container min-h-screen overflow-y-auto">
    <div class="report-container w-full flex flex-col justify-between gap-4 text-black">
      <!-- Search Form -->
      <div class="p-5 bg-white rounded-md shadow-md">
        <div class="flex flex-col gap-4">
          <div class="report-title">
            <h1 class="font-semibold">Attendance Report</h1>
          </div>

          <!-- Department -->
          <div class="flex gap-4 w-full">
            <div class="">
              <legend class="fieldset-legend text-black text-xs">Department</legend>
              <select
                v-model="formData.department"
                class="select focus:outline-none bg-white border-black text-black input-sm"
              >
                <option value="">Select Department</option>
                <option>HR Department</option>
                <option>Finance Department</option>
                <option>Sales Department</option>
                <option>Supply Chain Department</option>
                <option>CRM Department</option>
              </select>
            </div>

            <div class="w-full">
              <legend class="fieldset-legend text-black text-xs">Employee</legend>
              <select
                v-model="formData.employeeName"
                class="select focus:outline-none bg-white border-black text-black input-sm"
                :disabled="!formData.department"
              >
                <option value="">Select Employee</option>
                <option v-for="emp in filteredEmployees" :key="emp.id" :value="emp.fullName">
                  {{ emp.fullName }}
                </option>
              </select>
            </div>
          </div>

          <!-- Date Range -->
          <div class="flex gap-4 w-full justify-between items-end">
            <div class="flex gap-8 w-full">
              <div class="">
                <legend class="fieldset-legend text-black text-xs">From</legend>
                <input
                  v-model="formData.startDate"
                  type="date"
                  class="border-black border-1 rounded-md p-2 input-xs"
                />
              </div>

              <div class="w-full">
                <legend class="fieldset-legend text-black text-xs">To</legend>
                <input
                  v-model="formData.endDate"
                  type="date"
                  class="border-black border-1 rounded-md p-2 input-xs"
                />
              </div>
            </div>
            <div class="action-button">
              <button
                @click="handleSubmit"
                class="btn bg-primaryColor border-none btn-sm px-6 py-4 text-xs font-thin hover:bg-primaryColor/80"
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Employee Summary -->
      <div v-if="reportSummary" class="bg-white shadow-md rounded-md p-5">
        <div class="flex gap-4 flex-col">
          <div class="">
            <h1 class="font-semibold">{{ formData.employeeName }}</h1>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div class="stat-box p-3 bg-gray-50 rounded-md">
              <p class="text-gray-600">Total Days</p>
              <p class="text-xl font-semibold">{{ reportSummary.totalDays }}</p>
            </div>
            <div class="stat-box p-3 bg-gray-50 rounded-md">
              <p class="text-gray-600">Present Days</p>
              <p class="text-xl font-semibold">{{ reportSummary.presentDays }}</p>
            </div>
            <div class="stat-box p-3 bg-gray-50 rounded-md">
              <p class="text-gray-600">Absent Days</p>
              <p class="text-xl font-semibold text-red-600">{{ reportSummary.absentDays }}</p>
            </div>
            <div class="stat-box p-3 bg-gray-50 rounded-md">
              <p class="text-gray-600">Late Days</p>
              <p class="text-xl font-semibold">{{ reportSummary.lateDays }}</p>
            </div>
            <div class="stat-box p-3 bg-gray-50 rounded-md">
              <p class="text-gray-600">Total Hours</p>
              <p class="text-xl font-semibold">{{ reportSummary.totalHours }}</p>
            </div>
            <div class="stat-box p-3 bg-gray-50 rounded-md">
              <p class="text-gray-600">Average Hours/Day</p>
              <p class="text-xl font-semibold">{{ reportSummary.averageHoursPerDay }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Attendance Summary Table -->
      <div v-if="getAttendanceReport.length > 0" class="bg-white shadow-md rounded-md p-5">
        <div class="flex gap-4 flex-col">
          <div class="flex justify-between items-center">
            <div class="">
              <h1 class="font-semibold">Attendance Summary</h1>
            </div>

            <!-- print button -->
            <div class="">
              <button
                v-if="reportSummary"
                @click="generatePDF"
                class="btn bg-primaryColor border-none btn-sm px-6 py-4 text-xs font-thin hover:bg-primaryColor/80"
                title="Export as PDF"
              >
                <Printer class="w-4 h-4" />
              </button>
            </div>
          </div>

          <div class="overflow-x-auto border border-gray-300/50 shadow-lg">
            <table class="table text-black">
              <thead class="bg-primaryColor text-white">
                <tr>
                  <th>Date</th>
                  <th>Time In</th>
                  <th>Time Out</th>
                  <th>Worked Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="record in getAttendanceReport"
                  :key="record.date"
                  class="hover:bg-gray-50 border-b-1 border-gray-200"
                >
                  <td>{{ record.date }}</td>
                  <td>{{ record.signIn || '-' }}</td>
                  <td>{{ record.signOut || '-' }}</td>
                  <td>
                    {{
                      typeof record.workingHours === 'number'
                        ? parseFloat(record.workingHours).toFixed(2)
                        : '-'
                    }}
                  </td>
                  <td>
                    <span
                      :class="{
                        'base-class': true,
                        'px-2 py-1 rounded-full text-xs': true,
                        'bg-green-100 text-green-800': record.status === 'Present',
                        'bg-red-100 text-red-800': record.status === 'Absent',
                        'bg-yellow-100 text-yellow-800': record.status === 'Late',
                        'bg-blue-100 text-blue-800': record.status === 'On Leave',
                      }"
                    >
                      {{ record.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
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
