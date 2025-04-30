<script setup>
import { ref, computed } from 'vue'
import { EyeIcon, SendIcon, CheckIcon, XIcon, BookCheck } from 'lucide-vue-next'

// Simulate user role (change to 'HR' or 'Finance' to test)
const userRole = ref('HR') // or 'Finance'

const payrolls = ref([
  {
    id: 1,
    employee_name: 'Juan Dela Cruz',
    department: 'Sales',
    pay_period: '2024-06-01 to 2024-06-15',
    days_of_present: 10,
    days_of_absent: 1,
    hours_late: 2,
    over_time: 5,
    bonus: 1000,
    advance_payments: 200,
    mandatory_deductions: 500,
    tax: 300,
    gross_deduction: 1000,
    gross_salary: 20000,
    net_pay: 19000,
    status: 'Processed',
    remarks: 'On time',
    created_at: '2024-06-16',
  },
  {
    id: 2,
    employee_name: 'Maria Santos',
    department: 'Sales',
    pay_period: '2024-06-01 to 2024-06-15',
    days_of_present: 12,
    days_of_absent: 0,
    hours_late: 0,
    over_time: 8,
    bonus: 1200,
    advance_payments: 300,
    mandatory_deductions: 400,
    tax: 250,
    gross_deduction: 800,
    gross_salary: 18000,
    net_pay: 17050,
    status: 'For Review',
    remarks: '',
    created_at: '2024-06-16',
  },
  {
    id: 3,
    employee_name: 'Pedro Rodriguez',
    department: 'Sales',
    pay_period: '2024-06-01 to 2024-06-15',
    days_of_present: 15,
    days_of_absent: 0,
    hours_late: 0,
    over_time: 10,
    bonus: 1500,
    advance_payments: 400,
    mandatory_deductions: 300,
    tax: 200,
    gross_deduction: 600,
    gross_salary: 16000,
    net_pay: 15000,
    status: 'Approved',
    remarks: '',
    created_at: '2024-06-16',
  },
])

const search = ref('')
const statusFilter = ref('')
const filteredPayrolls = computed(() =>
  payrolls.value.filter(
    (row) =>
      (!search.value || row.employee_name.toLowerCase().includes(search.value.toLowerCase())) &&
      (!statusFilter.value || row.status === statusFilter.value),
  ),
)

const payrollHistory = computed(() => payrolls.value.filter((row) => row.status === 'Processed'))

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
  const date = new Date(`${year}-${month}-01`) // Corrected this line
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
          placeholder="Search Employee Name"
          class="input-search input-sm w-72"
        />
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

    <!-- Payroll Table -->
    <div class="overflow-x-auto">
      <table class="table text-black w-full text-xs border border-gray-300 rounded-md">
        <thead class="text-black text-xs">
          <tr class="border border-gray-300 rounded-md text-xs">
            <th>No.</th>
            <th>Employee Name</th>
            <th>Department</th>
            <th>Pay Period</th>
            <th>Present</th>
            <th>Absent</th>
            <th>Late (hrs)</th>
            <th>Overtime</th>
            <th>Bonus</th>
            <th>Advance</th>
            <th>Deductions</th>
            <th>Tax</th>
            <th>Gross Deduction</th>
            <th>Gross Salary</th>
            <th>Net Pay</th>
            <th>Status</th>
            <th>Remarks</th>
            <th>Date Processed</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in filteredPayrolls"
            :key="row.id"
            class="border border-gray-300 rounded-md"
          >
            <td>{{ row.id }}</td>
            <td>{{ row.employee_name }}</td>
            <td>{{ row.department }}</td>
            <td>{{ getPayPeriodMonth(row.pay_period) }}</td>
            <td>{{ row.days_of_present }}</td>
            <td>{{ row.days_of_absent }}</td>
            <td>{{ row.hours_late }}</td>
            <td>{{ row.over_time }}</td>
            <td>₱{{ Number(row.bonus).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
            <td>
              ₱{{
                Number(row.advance_payments).toLocaleString('en-PH', { minimumFractionDigits: 2 })
              }}
            </td>
            <td>
              ₱{{
                Number(row.mandatory_deductions).toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                })
              }}
            </td>
            <td>₱{{ Number(row.tax).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
            <td>
              ₱{{
                Number(row.gross_deduction).toLocaleString('en-PH', { minimumFractionDigits: 2 })
              }}
            </td>
            <td>
              ₱{{ Number(row.gross_salary).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
            </td>
            <td>
              ₱{{ Number(row.net_pay).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
            </td>
            <td>
              <span
                :class="[ 'badge', row.status === 'Processed'
                    ? 'badge badge-outline badge-success text-xs'
                    : row.status === 'Approved'
                      ? 'badge badge-outline badge-info text-xs'
                      : row.status === 'For Review'
                        ? 'badge badge-outline badge-warning text-xs'
                        : row.status === 'Rejected'
                          ? 'badge badge-outline badge-error text-xs'
                          : 'badge badge-outline badge-neutral text-xs', ]"
              >
                {{ row.status }}
              </span>
            </td>
            <td>{{ row.remarks || '-' }}</td>
            <td>{{ row.created_at }}</td>
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
              <th>Employee Name</th>
              <th>Department</th>
              <th>Pay Period</th>
              <th>Present</th>
              <th>Absent</th>
              <th>Late (hrs)</th>
              <th>Overtime</th>
              <th>Bonus</th>
              <th>Advance</th>
              <th>Deductions</th>
              <th>Tax</th>
              <th>Gross Deduction</th>
              <th>Gross Salary</th>
              <th>Net Pay</th>
              <th>Status</th>
              <th>Remarks</th>
              <th>Date Processed</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in payrollHistory"
              :key="row.id"
              class="border border-gray-300 rounded-md"
            >
              <td>{{ row.id }}</td>
              <td>{{ row.employee_name }}</td>
              <td>{{ row.department }}</td>
              <td>{{ getPayPeriodMonth(row.pay_period) }}</td>
              <td>{{ row.days_of_present }}</td>
              <td>{{ row.days_of_absent }}</td>
              <td>{{ row.hours_late }}</td>
              <td>{{ row.over_time }}</td>
              <td>
                ₱{{ Number(row.bonus).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
              </td>
              <td>
                ₱{{
                  Number(row.advance_payments).toLocaleString('en-PH', { minimumFractionDigits: 2 })
                }}
              </td>
              <td>
                ₱{{
                  Number(row.mandatory_deductions).toLocaleString('en-PH', {
                    minimumFractionDigits: 2,
                  })
                }}
              </td>
              <td>₱{{ Number(row.tax).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
              <td>
                ₱{{
                  Number(row.gross_deduction).toLocaleString('en-PH', { minimumFractionDigits: 2 })
                }}
              </td>
              <td>
                ₱{{
                  Number(row.gross_salary).toLocaleString('en-PH', { minimumFractionDigits: 2 })
                }}
              </td>
              <td>
                ₱{{ Number(row.net_pay).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
              </td>
              <td>
                <span
                  :class="[ 'badge', row.status === 'Processed'
                    ? 'badge badge-outline badge-success text-xs'
                    : row.status === 'Approved'
                      ? 'badge badge-outline badge-info text-xs'
                      : row.status === 'For Review'
                        ? 'badge badge-outline badge-warning text-xs'
                        : row.status === 'Rejected'
                          ? 'badge badge-outline badge-error text-xs'
                          : 'badge badge-outline badge-neutral text-xs', ]"
                >
                  {{ row.status }}
                </span>
              </td>
              <td>{{ row.remarks || '-' }}</td>
              <td>{{ row.created_at }}</td>
            </tr>
            <tr v-if="!payrollHistory.length">
              <td colspan="16" class="text-center py-4 text-gray-500">No payroll history found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modals here as before -->
  </div>
</template>
