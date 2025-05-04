<script setup>
import { ref, computed, onMounted } from 'vue'
import { MoveRight, EyeIcon, CheckIcon, XIcon, BookCheck } from 'lucide-vue-next'
import { usePayrollStore } from '@/stores/HR Management/payrollStore'
import { useAttendanceStore } from '@/stores/HR Management/attendanceStore'
import { useLeavesStore } from '@/stores/HR Management/LeavesStore'
import Toast from '@/components/Admin Components/HR/Toast.vue'

const statusMap = {
  1: { label: 'For Review', color: 'badge badge-warning badge-outline text-xs font-thin' },
  2: { label: 'Approved', color: 'badge badge-info badge-outline text-xs font-thin' },
  3: { label: 'Rejected', color: 'badge badge-error badge-outline text-xs font-thin' },
  9: { label: 'Processed', color: 'badge badge-success badge-outline text-xs font-thin' },
}

const showViewModal = ref(false)
const selectedPayroll = ref(null)
const attendanceData = ref([])
const leaveData = ref([])
const deductionData = ref([])

// Dummy basis data
const budgetStatus = ref('Sufficient') // or 'Insufficient'
const tab = ref('attendance')

// Dummy data for each tab
const cashAdvanceData = ref([{ date: '2024-06-03', amount: 1000, status: 'Deducted' }])

const payrollStore = usePayrollStore()
const dateFrom = ref('')
const dateTo = ref('')

const forReviewPayrolls = computed(() =>
  payrollStore.payrolls.filter(
    (row) =>
      row.status === 1 &&
      (!dateFrom.value || row.start_date >= dateFrom.value) &&
      (!dateTo.value || row.end_date <= dateTo.value),
  ),
)

const attendanceStore = useAttendanceStore()
const leavesStore = useLeavesStore()

const showRejectModal = ref(false)
const rejectRemarks = ref('')
const payrollToReject = ref(null)

const showAuditLogModal = ref(false)
const auditLogs = ref([])

const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success') // or 'error', 'info'

const showApproveModal = ref(false)
const payrollToApprove = ref(null)

onMounted(() => {
  payrollStore.fetchPayrolls()
})

async function openViewModal(row) {
  selectedPayroll.value = row
  // Fetch attendance for this employee and period
  await attendanceStore.loadRecords()
  attendanceData.value = attendanceStore.getAttendanceByDateRange(
    row.start_date,
    row.end_date,
    row.employee_id,
  )
  // Fetch leaves for this employee and period
  await leavesStore.fetchLeaves()
  leaveData.value = leavesStore.leaves.filter(
    (l) => l.employee_id === row.employee_id && l.date >= row.start_date && l.date <= row.end_date,
  )
  // Deductions are already in row.deductions
  deductionData.value = row.deductions || []
  showViewModal.value = true
}

async function approvePayroll(row) {
  await payrollStore.approvePayroll(row.id)
  // Optionally, show a toast notification here
}

function openRejectModal(row) {
  payrollToReject.value = row
  showRejectModal.value = true
  rejectRemarks.value = ''
}

async function rejectPayroll() {
  try {
    await payrollStore.rejectPayroll(payrollToReject.value.id, rejectRemarks.value)
    triggerToast('Payroll rejected!', 'success')
  } catch (err) {
    triggerToast('Failed to reject payroll.', 'error')
  } finally {
    showRejectModal.value = false
  }
}

async function openAuditLogModal(row) {
  await payrollStore.fetchAuditLogs(row.id)
  auditLogs.value = payrollStore.auditLogs
  showAuditLogModal.value = true
}

function triggerToast(message, type = 'success') {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 2500)
}

async function confirmApprovePayroll() {
  try {
    await payrollStore.approvePayroll(payrollToApprove.value.id)
    triggerToast('Payroll approved!', 'success')
  } catch (err) {
    triggerToast('Failed to approve payroll.', 'error')
  } finally {
    showApproveModal.value = false
  }
}

function openApproveModal(row) {
  payrollToApprove.value = row
  showApproveModal.value = true
}
</script>

<template>
  <div class="w-full bg-white shadow-md rounded-md p-4">
    <div class="flex flex-wrap items-center gap-2 mb-4 justify-between">
      <div class="flex gap-2 items-center">
        <input
          type="text"
          placeholder="Search Employee"
          class="input input-sm w-72 bg-white border-primaryColor placeholder:text-gray-500"
        />
        <select class="select bg-white border-primaryColor text-black select-sm w-40">
          <option value="">All Status</option>
          <option value="1">For Review</option>
          <option value="2">Approved</option>
          <option value="3">Rejected</option>
          <option value="9">Processed</option>
        </select>
      </div>
      <div class="flex gap-2 items-center">
        <div class="">
          <button
            class="btn-primaryStyle"
            @click="payrollStore.fetchPayrolls({ start_date: dateFrom, end_date: dateTo })"
          >
            Filter
          </button>
        </div>
        <div class="flex items-center bg-white border border-black rounded-sm shadow-sm space-x-2">
          <input
            v-model="dateFrom"
            type="date"
            class="input input-sm focus:outline-none text-black bg-transparent"
            :max="dateTo"
          />
          <MoveRight class="w-10 h-6 text-black" />
          <input
            v-model="dateTo"
            type="date"
            class="w-full input input-sm focus:outline-none text-black bg-transparent"
            :min="dateFrom"
          />
        </div>
      </div>
    </div>
    <div class="overflow-x-auto">
      <table class="table text-black w-full text-xs border border-gray-300 rounded-md">
        <thead class="text-xs text-black">
          <tr>
            <th>No.</th>
            <th>Employee Name</th>
            <th>Month</th>
            <th>Quarter</th>
            <th>Week</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Payroll Date</th>
            <th>Days Present</th>
            <th>Total Hours Worked</th>
            <th>Regular Hour Pay</th>
            <th>Days Absent</th>
            <th>Absent Deduction</th>
            <th>Overtime Pay</th>
            <th>Rest Day Pay</th>
            <th>Rest Day Hours</th>
            <th>Tardiness Deduction</th>
            <th>Status</th>
            <th>Allowance</th>
            <th>Bonus</th>
            <th>Paid Holiday</th>
            <th>Deduction</th>
            <th>Gross Pay</th>
            <th>Salary Before Tax</th>
            <th>Net Pay</th>
            <th>Tax Deduction</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in forReviewPayrolls" :key="row.id">
            <td>{{ idx + 1 }}</td>
            <td>{{ row.employee?.full_name }}</td>
            <td>{{ row.month }}</td>
            <td>{{ row.quarter }}</td>
            <td>{{ row.week }}</td>
            <td>{{ row.start_date }}</td>
            <td>{{ row.end_date }}</td>
            <td>{{ row.payroll_date }}</td>
            <td>{{ row.days_present }}</td>
            <td>{{ row.total_hours_worked }}</td>
            <td>
              ₱{{ row.regular_hour_pay.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
            </td>
            <td>{{ row.days_absent }}</td>
            <td>
              ₱{{ row.absent_deduction.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
            </td>
            <td>₱{{ row.overtime_pay.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
            <td>
              ₱{{ (row.rest_day_pay ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
            </td>
            <td>
              {{ row.rest_day_hours?.toFixed(2) ?? '0.00' }}
            </td>
            <td>
              ₱{{ row.tardiness_deduction.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
            </td>
            <td>
              <span :class="statusMap[row.status]?.color">
                {{ statusMap[row.status]?.label || row.status }}
              </span>
            </td>
            <td>{{ row.allowance.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
            <td>{{ row.bonus.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
            <td>{{ row.paid_holiday.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
            <td>{{ row.deduction.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
            <td>{{ row.gross_pay.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
            <td>
              ₱{{ row.salary_before_tax.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
            </td>
            <td>{{ row.net_pay.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
            <td>{{ row.tax_deduction.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
            <td>
              <div class="flex gap-1">
                <!-- View Payroll -->
                <button
                  class="text-black hover:text-white hover:bg-primaryColor/80 rounded-full p-1 cursor-pointer"
                  title="View Payroll"
                  @click="openViewModal(row)"
                >
                  <EyeIcon class="w-4 h-4" />
                </button>
                <!-- Approve Payroll -->
                <button
                  class="text-black hover:text-white hover:bg-green-500/80 rounded-full p-1 cursor-pointer"
                  title="Approve Payroll"
                  @click="openApproveModal(row)"
                >
                  <CheckIcon class="w-4 h-4" />
                </button>
                <!-- Reject Payroll -->
                <button
                  class="text-black hover:text-white hover:bg-red-500/80 rounded-full p-1 cursor-pointer"
                  title="Reject Payroll"
                  @click="openRejectModal(row)"
                >
                  <XIcon class="w-4 h-4" />
                </button>
                <!-- Audit Log -->
                <button
                  class="text-black hover:text-white hover:bg-blue-500/80 rounded-full p-1 cursor-pointer"
                  title="Audit Log"
                  @click="openAuditLogModal(row)"
                >
                  <BookCheck class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!forReviewPayrolls.length">
            <td colspan="27" class="text-center py-4 text-gray-500">
              No payrolls for review found
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <dialog v-if="showViewModal" open class="modal z-50">
    <div class="modal-box bg-white text-black max-w-2xl">
      <h3 class="font-bold text-lg mb-2">Payroll Details</h3>

      <!-- Payroll Breakdown -->
      <div class="mb-2">
        <div class="flex justify-between">
          <p class="text-gray-500 text-sm font-thin">Employee Name:</p>
          <span class="text-black text-sm">
            {{ selectedPayroll.employee.full_name }}
          </span>
        </div>
        <div class="flex justify-between">
          <p class="text-gray-500 text-sm font-thin">Period:</p>
          <span class="text-black text-sm">
            {{ selectedPayroll.start_date }} to {{ selectedPayroll.end_date }}
          </span>
        </div>
        <div class="flex justify-between">
          <p class="text-gray-500 text-sm font-thin">Gross Pay:</p>
          <span class="text-black text-sm">₱{{ selectedPayroll.gross_pay }}</span>
        </div>
        <div class="flex justify-between">
          <p class="text-gray-500 text-sm font-thin">Rest Day Pay:</p>
          <span class="text-black text-sm">₱{{ selectedPayroll.rest_day_pay ?? 0 }}</span>
        </div>
        <div class="flex justify-between">
          <p class="text-gray-500 text-sm font-thin">Rest Day Hours:</p>
          <span class="text-black text-sm">
            {{ selectedPayroll.rest_day_hours?.toFixed(2) ?? '0.00' }}
          </span>
        </div>
      </div>

      <!-- Budget Status -->
      <div class="flex justify-between my-2">
        <p class="text-gray-500 text-sm font-thin">Budget Status:</p>
        <span
          :class="
            budgetStatus === 'Sufficient'
              ? 'badge badge-neutral badge-outline text-sm badge-sm'
              : 'badge badge-error badge-outline text-sm badge-sm'
          "
        >
          {{ budgetStatus }}
        </span>
      </div>

      <!-- Tabs -->
      <div>
        <div class="tabs tabs-bordered bg-primaryColor text-white">
          <a class="tab" :class="{ 'tab-active': tab === 'attendance' }" @click="tab = 'attendance'"
            >Attendance</a
          >
          <a class="tab" :class="{ 'tab-active': tab === 'leave' }" @click="tab = 'leave'">Leave</a>
          <a class="tab" :class="{ 'tab-active': tab === 'deductions' }" @click="tab = 'deductions'"
            >Deductions</a
          >
          <a
            class="tab"
            :class="{ 'tab-active': tab === 'cashadvance' }"
            @click="tab = 'cashadvance'"
            >Cash Advance</a
          >
        </div>
        <!-- Attendance Tab -->
        <div v-if="tab === 'attendance'" class="bg-white p-2 text-black">
          <h4 class="font-semibold mb-1">Attendance Summary</h4>
          <table class="table table-xs w-full">
            <thead class="text-xs text-black">
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Sign In</th>
                <th>Sign Out</th>
                <th>Hours</th>
                <th>OT</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in attendanceData" :key="a.date">
                <td>{{ a.date }}</td>
                <td>{{ a.status }}</td>
                <td>{{ a.signIn }}</td>
                <td>{{ a.signOut }}</td>
                <td>{{ a.workingHours }}</td>
                <td>
                  <span v-if="a.overtimeHours && Number(a.overtimeHours) > 0">
                    {{ a.overtimeHours }} hr
                  </span>
                  <span v-else>—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Leave Tab -->
        <div v-else-if="tab === 'leave'" class="bg-white p-2 text-black">
          <h4 class="font-semibold mb-1">Leave Summary</h4>
          <table class="table table-xs w-full">
            <thead class="text-xs text-black">
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="l in leaveData" :key="l.date">
                <td>{{ l.date }}</td>
                <td>{{ l.type }}</td>
                <td>{{ l.status }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Deductions Tab -->
        <div v-else-if="tab === 'deductions'" class="bg-white p-2 text-black">
          <h4 class="font-semibold mb-1">Mandatory Deductions</h4>
          <table class="table table-xs w-full">
            <thead class="text-xs text-black">
              <tr>
                <th>Type</th>
                <th>Description</th>
                <th>Hours</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in deductionData" :key="d.deduction_type">
                <td>{{ d.deduction_type }}</td>
                <td>{{ d.description }}</td>
                <td>-</td>
                <td>
                  ₱{{ Number(d.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
                </td>
              </tr>
              <tr>
                <td>Tax</td>
                <td>Withholding Tax</td>
                <td>-</td>
                <td>
                  ₱{{
                    selectedPayroll.tax_deduction
                      ? Number(selectedPayroll.tax_deduction).toLocaleString('en-PH', {
                          minimumFractionDigits: 2,
                        })
                      : '0.00'
                  }}
                </td>
              </tr>
              <tr>
                <td>Tardiness</td>
                <td>Tardiness Deduction</td>
                <td>
                  <span v-if="selectedPayroll.tardiness_hours">
                    {{ selectedPayroll.tardiness_hours }} hr/min
                  </span>
                  <span v-else-if="selectedPayroll.tardiness_minutes">
                    {{ selectedPayroll.tardiness_minutes }} min
                  </span>
                  <span v-else>-</span>
                </td>
                <td>
                  ₱{{
                    selectedPayroll.tardiness_deduction
                      ? Number(selectedPayroll.tardiness_deduction).toLocaleString('en-PH', {
                          minimumFractionDigits: 2,
                        })
                      : '0.00'
                  }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Cash Advance Tab -->
        <div
          v-else-if="tab === 'cashadvance'"
          class="bg-white p-2 text-black"
          style="border: 1px solid orange"
        >
          <h4 class="font-semibold mb-1">Cash Advance</h4>
          <table class="table table-xs w-full">
            <thead class="text-xs text-gray-500">
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in cashAdvanceData" :key="c.date">
                <td>{{ c.date }}</td>
                <td>₱{{ c.amount }}</td>
                <td>{{ c.status }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="modal-action">
        <button class="btn-secondaryStyle" @click="showViewModal = false">Close</button>
      </div>
    </div>
  </dialog>

  <dialog v-if="showApproveModal" open class="modal z-50">
    <div class="modal-box bg-white text-black max-w-md">
      <h3 class="font-bold text-lg mb-2">Approve Payroll</h3>
      <p>Are you sure you want to approve this payroll?</p>
      <div class="modal-action">
        <button class="btn-primaryStyle" @click="confirmApprovePayroll">Yes, Approve</button>
        <button class="btn-secondaryStyle" @click="showApproveModal = false">Cancel</button>
      </div>
    </div>
  </dialog>

  <dialog v-if="showAuditLogModal" open class="modal z-50">
    <div class="modal-box bg-white text-black max-w-lg">
      <h3 class="font-bold text-lg mb-2">Audit Log</h3>
      <div v-if="auditLogs.length">
        <table class="table table-xs w-full">
          <thead class="text-xs text-black">
            <tr>
              <th>Date</th>
              <th>User</th>
              <th>Action</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in auditLogs" :key="log.id">
              <td>{{ log.created_at || log.timestamp }}</td>
              <td>{{ log.user?.full_name || log.user_id }}</td>
              <td>{{ log.action }}</td>
              <td>{{ log.remarks || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else>
        <p class="text-gray-500">No audit logs found for this payroll.</p>
      </div>
      <div class="modal-action">
        <button class="btn-secondaryStyle" @click="showAuditLogModal = false">Close</button>
      </div>
    </div>
  </dialog>

  <Toast :show="showToast" :message="toastMessage" :type="toastType" />
</template>
