<script setup>
import { ref, computed } from 'vue'
import { EyeIcon, SendIcon, CheckIcon, XIcon, BookCheck } from 'lucide-vue-next'

// Simulate user role (change to 'HR' or 'Finance' to test)
const userRole = ref('HR') // or 'Finance'

const payrolls = ref([
  {
    employee_id: 1,
    month: 6,
    quarter: 2,
    week: 24,
    start_date: '2024-06-01',
    end_date: '2024-06-15',
    payroll_date: '2024-06-16T10:00:00+08:00',
    days_present: 10,
    total_hours_worked: 80,
    regular_hour_pay: 16000,
    days_absent: 1,
    absent_deduction: 1000,
    overtime_pay: 2000,
    tardiness_deduction: 500,
    status: 9,
    allowance: 0,
    bonus: 0,
    paid_holiday: 0,
    deduction: 1500,
    gross_pay: 18000,
    salary_before_tax: 17000,
    net_pay: 16000,
    tax_deduction: 1000,
  },
  {
    employee_id: 2,
    month: 6,
    quarter: 2,
    week: 24,
    start_date: '2024-06-01',
    end_date: '2024-06-15',
    payroll_date: '2024-06-16T10:00:00+08:00',
    days_present: 12,
    total_hours_worked: 96,
    regular_hour_pay: 19200,
    days_absent: 0,
    absent_deduction: 0,
    overtime_pay: 2500,
    tardiness_deduction: 0,
    status: 1,
    allowance: 0,
    bonus: 1200,
    paid_holiday: 0,
    deduction: 950,
    gross_pay: 21700,
    salary_before_tax: 20750,
    net_pay: 19800,
    tax_deduction: 950,
  },
  {
    employee_id: 3,
    month: 6,
    quarter: 2,
    week: 24,
    start_date: '2024-06-01',
    end_date: '2024-06-15',
    payroll_date: '2024-06-16T10:00:00+08:00',
    days_present: 15,
    total_hours_worked: 120,
    regular_hour_pay: 24000,
    days_absent: 0,
    absent_deduction: 0,
    overtime_pay: 3000,
    tardiness_deduction: 0,
    status: 2,
    allowance: 0,
    bonus: 1500,
    paid_holiday: 0,
    deduction: 1200,
    gross_pay: 28500,
    salary_before_tax: 27300,
    net_pay: 26100,
    tax_deduction: 1200,
  },
])

const search = ref('')
const statusFilter = ref('')
const selectedMonth = ref('') // '' means all months
const filteredPayrolls = computed(() =>
  payrolls.value.filter(
    (row) =>
      (!search.value || row.employee_id.toString().includes(search.value)) &&
      (!statusFilter.value || row.status === statusFilter.value) &&
      (!selectedMonth.value || row.month === Number(selectedMonth.value)),
  ),
)

const payrollHistory = computed(() => payrolls.value.filter((row) => row.status === 9))

const showViewModal = ref(false)
const showApproveModal = ref(false)
const showRejectModal = ref(false)
const selectedPayroll = ref(null)
const remarks = ref('')

// Helper to extract month and year from pay_period string
function getPayPeriodMonth(payPeriod) {
  // Example input: "2024-06-01 to 2024-06-15"
  // Output: "June 2024"
  const match = payPeriod.match(/^(\d{4})-(\d{2})/)
  if (!match) return payPeriod
  const year = match[1]
  const month = match[2]
  const date = new Date(`${year}-${month}-01`)
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' })
}

function openViewModal(row) {
  selectedPayroll.value = row
  showViewModal.value = true
}
function openApproveModal(row) {
  selectedPayroll.value = row
  showApproveModal.value = true
}
function openRejectModal(row) {
  selectedPayroll.value = row
  showRejectModal.value = true
}
function submitToFinance(row) {
  row.status = 'For Review'
}
function markAsPaid(row) {
  row.status = 'Processed'
}
function approvePayroll() {
  selectedPayroll.value.status = 'Approved'
  showApproveModal.value = false
}
function rejectPayroll() {
  selectedPayroll.value.status = 'Rejected'
  selectedPayroll.value.remarks = remarks.value
  showRejectModal.value = false
}
const generatePayroll = () => {
  alert('Generate Payroll logic goes here!')
}
const exportPayroll = () => {
  alert('Export logic goes here!')
}
</script>

<template>
  <div class="w-full bg-white shadow-md rounded-md p-4">
    <!-- Top Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
      <div class="flex gap-2">
        <input
          v-model="search"
          type="text"
          placeholder="Search Employee ID"
          class="input-search input-sm w-72"
        />
        <select
          v-model="selectedMonth"
          class="select bg-white border-primaryColor text-black select-sm w-32"
        >
          <option value="">All Months</option>
          <option v-for="m in 12" :key="m" :value="m">
            {{ new Date(0, m - 1).toLocaleString('en-US', { month: 'long' }) }}
          </option>
        </select>
        <select
          v-model="statusFilter"
          class="select bg-white border-primaryColor text-black select-sm w-40"
        >
          <option value="">All Status</option>
          <option>Draft</option>
          <option>For Review</option>
          <option>Approved</option>
          <option>Rejected</option>
          <option>Processed</option>
        </select>
      </div>
      <div class="flex gap-2">
        <button class="btn-primaryStyle" @click="generatePayroll">Generate Payroll</button>
        <button class="btn-secondaryStyle" @click="exportPayroll">Export</button>
      </div>
    </div>
    <div class="overflow-x-auto">
      <table class="table text-black w-full text-xs border border-gray-300 rounded-md">
        <thead class="text-black text-xs">
          <tr class="border border-gray-300 rounded-md text-xs">
            <th>No.</th>
            <th>Employee ID</th>
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
          <tr
            v-for="(row, idx) in filteredPayrolls"
            :key="row.employee_id"
            class="border border-gray-300 rounded-md"
          >
            <td>{{ idx + 1 }}</td>
            <td>{{ row.employee_id }}</td>
            <td>{{ row.month }}</td>
            <td>{{ row.quarter }}</td>
            <td>{{ row.week }}</td>
            <td>{{ row.start_date }}</td>
            <td>{{ row.end_date }}</td>
            <td>{{ row.payroll_date }}</td>
            <td>{{ row.days_present }}</td>
            <td>{{ row.total_hours_worked }}</td>
            <td>
              ₱{{
                (row.regular_hour_pay ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })
              }}
            </td>
            <td>{{ row.days_absent }}</td>
            <td>
              ₱{{ row.absent_deduction.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
            </td>
            <td>₱{{ row.overtime_pay.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
            <td>
              ₱{{ row.tardiness_deduction.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
            </td>
            <td>{{ row.status }}</td>
            <td>₱{{ row.allowance.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
            <td>₱{{ row.bonus.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
            <td>₱{{ row.paid_holiday.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
            <td>₱{{ row.deduction.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
            <td>₱{{ row.gross_pay.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
            <td>
              ₱{{ row.salary_before_tax.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
            </td>
            <td>₱{{ row.net_pay.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
            <td>₱{{ row.tax_deduction.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
            <td>
              <div class="flex gap-1">
                <button
                  class="text-black hover:text-white hover:bg-primaryColor/80 rounded-full p-1 cursor-pointer"
                  title="View Payroll"
                  @click="openViewModal(row)"
                >
                  <EyeIcon class="w-4 h-4" />
                </button>
                <button
                  v-if="userRole === 'HR' && row.status === 'Draft'"
                  class="text-black hover:text-white hover:bg-primaryColor/80 rounded-full p-1 cursor-pointer"
                  title="Submit to Finance"
                  @click="submitToFinance(row)"
                >
                  <SendIcon class="w-4 h-4" />
                </button>
                <button
                  v-if="userRole === 'Finance' && row.status === 'For Review'"
                  class="text-black hover:text-white hover:bg-primaryColor/80 rounded-full p-1 cursor-pointer"
                  title="Approve Payroll"
                  @click="openApproveModal(row)"
                >
                  <CheckIcon class="w-4 h-4" />
                </button>
                <button
                  v-if="userRole === 'Finance' && row.status === 'For Review'"
                  class="text-black hover:text-white hover:bg-primaryColor/80 rounded-full p-1 cursor-pointer"
                  title="Reject Payroll"
                  @click="openRejectModal(row)"
                >
                  <XIcon class="w-4 h-4" />
                </button>
                <button
                  v-if="(userRole === 'HR' || userRole === 'Finance') && row.status === 'Approved'"
                  class="text-black hover:text-white hover:bg-primaryColor/80 rounded-full p-1 cursor-pointer"
                  title="Mark as Paid"
                  @click="markAsPaid(row)"
                >
                  <BookCheck class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!filteredPayrolls.length">
            <td colspan="17" class="text-center py-4 text-gray-500">No payroll found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Payroll History Table -->
    <div class="mt-8 text-black">
      <h3 class="font-semibold mb-2 text-black">Payroll History</h3>
      <div class="overflow-x-auto">
        <table class="table text-black w-full text-xs border border-gray-300 rounded-md">
          <thead class="text-black text-xs">
            <tr class="border border-gray-300 rounded-md">
              <th>No.</th>
              <th>Employee ID</th>
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
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, idx) in payrollHistory"
              :key="row.employee_id"
              class="border border-gray-300 rounded-md"
            >
              <td>{{ idx + 1 }}</td>
              <td>{{ row.employee_id }}</td>
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
                ₱{{ row.tardiness_deduction.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
              </td>
              <td>{{ row.status }}</td>
              <td>₱{{ row.allowance.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
              <td>₱{{ row.bonus.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
              <td>₱{{ row.paid_holiday.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
              <td>₱{{ row.deduction.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
              <td>₱{{ row.gross_pay.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
              <td>
                ₱{{ row.salary_before_tax.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
              </td>
              <td>₱{{ row.net_pay.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
              <td>
                ₱{{ row.tax_deduction.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
              </td>
            </tr>
            <tr v-if="!payrollHistory.length">
              <td colspan="24" class="text-center py-4 text-gray-500">No payroll history found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- View Modal -->
    <dialog v-if="showViewModal" open class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-md text-black">Payroll Details</h3>
        <div class="divider"></div>
        <div class="text-black">
          <div v-for="(val, key) in selectedPayroll" :key="key" class="flex justify-between">
            <span class="font-semibold">{{ key }}:</span>
            <span>{{ val }}</span>
          </div>
        </div>
        <div class="modal-action">
          <button class="btn-secondaryStyle" @click="showViewModal = false">Close</button>
        </div>
      </div>
    </dialog>

    <!-- Approve Modal -->
    <dialog v-if="showApproveModal" open class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-md text-black">Approve Payroll</h3>
        <div class="divider"></div>
        <p>Are you sure you want to approve this payroll?</p>
        <div class="modal-action">
          <button class="btn-secondaryStyle" @click="showApproveModal = false">Cancel</button>
          <button class="btn-primaryStyle" @click="approvePayroll">Approve</button>
        </div>
      </div>
    </dialog>

    <!-- Reject Modal -->
    <dialog v-if="showRejectModal" open class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-md text-black">Reject Payroll</h3>
        <div class="divider"></div>
        <textarea v-model="remarks" class="textarea w-full" placeholder="Enter remarks"></textarea>
        <div class="modal-action">
          <button class="btn-secondaryStyle" @click="showRejectModal = false">Cancel</button>
          <button class="btn-errorStyle" @click="rejectPayroll">Reject</button>
        </div>
      </div>
    </dialog>
  </div>
</template>
