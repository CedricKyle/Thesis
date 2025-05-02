<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { EyeIcon, SendIcon, CheckIcon, XIcon, BookCheck, MoveRight } from 'lucide-vue-next'
import { usePayrollStore } from '@/stores/HR Management/payrollStore'
import { usePermissions } from '@/composables/Admin Composables/User & Role/role/usePermissions'
import { PERMISSION_IDS } from '@/composables/Admin Composables/User & Role/role/permissionsId'
import { useUserStore } from '@/stores/Users & Role/userStore'
import { useAuthStore } from '@/stores/Authentication/authStore'
import { usePayrollExport } from '@/composables/Admin Composables/Human Resource/usePayrollExport'

const userStore = useUserStore()
const currentUserRole = computed(() => userStore.currentUser.role)
const { hasPermission } = usePermissions(currentUserRole)

const payrollStore = usePayrollStore()

const authStore = useAuthStore()

const { downloadPayrollHistoryPDF, printPayrollHistory } = usePayrollExport()

onMounted(() => {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  dateFrom.value = `${yyyy}-${mm}-01`
  dateTo.value = `${yyyy}-${mm}-15` // or last day of month
  fetchPayrollsByDate()
})

const payrolls = ref([
  // ...sample objects...
])

const search = ref('')
const statusFilter = ref('')
const selectedMonth = ref('') // '' means all months
const filteredPayrolls = computed(() =>
  payrollStore.payrolls.filter(
    (row) =>
      (!search.value || row.employee_id.toString().includes(search.value)) &&
      (!statusFilter.value || row.status === Number(statusFilter.value)) &&
      (!selectedMonth.value || row.month === Number(selectedMonth.value)),
  ),
)

const payrollHistory = computed(() =>
  Array.isArray(payrollStore.payrolls)
    ? payrollStore.payrolls.filter((row) => row.status == 9)
    : [],
)

const showViewModal = ref(false)
const showApproveModal = ref(false)
const showRejectModal = ref(false)
const selectedPayroll = ref(null)
const remarks = ref('')

const statusMap = {
  0: { label: 'Draft', color: 'badge badge-neutral badge-outline text-xs font-thin' },
  1: { label: 'For Review', color: 'badge badge-warning badge-outline text-xs font-thin' },
  2: { label: 'Approved', color: 'badge badge-info badge-outline text-xs font-thin' },
  3: { label: 'Rejected', color: 'badge badge-error badge-outline text-xs font-thin' },
  9: { label: 'Processed', color: 'badge badge-success badge-outline text-xs font-thin' },
}

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
  payrollStore.submitPayroll(row.id).then(() => {
    if (currentDateRange.value.start_date && currentDateRange.value.end_date) {
      payrollStore.fetchPayrolls(currentDateRange.value)
    }
  })
}
function markAsPaid(row) {
  payrollStore.processPayroll(row.id).then(() => {
    if (currentDateRange.value.start_date && currentDateRange.value.end_date) {
      payrollStore.fetchPayrolls(currentDateRange.value)
    }
  })
}
async function approvePayroll(row) {
  await payrollStore.approvePayroll(row.id)
  await payrollStore.fetchPayrolls(currentDateRange.value)
}
function rejectPayroll(row, remarks) {
  payrollStore.rejectPayroll(row.id, remarks).then(() => {
    if (currentDateRange.value.start_date && currentDateRange.value.end_date) {
      payrollStore.fetchPayrolls(currentDateRange.value)
    }
  })
}
function editPayroll(row, updates) {
  payrollStore.editPayroll(row.id, updates)
}
const generatePayroll = async () => {
  if (!dateFrom.value || !dateTo.value) {
    alert('Please select both start and end dates.')
    return
  }
  try {
    await payrollStore.generatePayroll({
      start_date: dateFrom.value,
      end_date: dateTo.value,
    })
    // Optionally, refetch payrolls after generation
    await payrollStore.fetchPayrolls({
      start_date: dateFrom.value,
      end_date: dateTo.value,
    })
    alert('Payroll generated successfully!')
  } catch (err) {
    alert('Failed to generate payroll: ' + (err?.response?.data?.message || err.message))
  }
}
const showPayrollExportModal = ref(false)
function exportPayroll() {
  showPayrollExportModal.value = true
}

const showAuditLogModal = ref(false)
const selectedPayrollId = ref(null)

function openAuditLogModal(row) {
  selectedPayrollId.value = row.id
  payrollStore.fetchAuditLogs(row.id)
  showAuditLogModal.value = true
}

const dateFrom = ref('')
const dateTo = ref('')

const currentDateRange = ref({ start_date: '', end_date: '' })

function fetchPayrollsByDate() {
  if (dateFrom.value && dateTo.value) {
    currentDateRange.value = {
      start_date: dateFrom.value,
      end_date: dateTo.value,
    }
    currentPage.value = 1
    payrollStore.fetchPayrolls(currentDateRange.value)
  }
}

const rowsPerPage = ref(10)

// Main payroll table
const currentPage = ref(1)
const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredPayrolls.value.length / rowsPerPage.value)),
)
const paginatedPayrolls = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value
  return filteredPayrolls.value.slice(start, start + rowsPerPage.value)
})

// Watch for data changes and reset page if needed
watch(filteredPayrolls, () => {
  if (currentPage.value > totalPages.value) currentPage.value = 1
})

// Payroll history
const historyPage = ref(1)
const historyTotalPages = computed(() => Math.ceil(payrollHistory.value.length / rowsPerPage.value))
const paginatedPayrollHistory = computed(() =>
  payrollHistory.value.slice(
    (historyPage.value - 1) * rowsPerPage.value,
    historyPage.value * rowsPerPage.value,
  ),
)

const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success') // 'success', 'error', 'warning', 'info'

function showToastMessage(message, type = 'success') {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

const confirmModal = ref(false)
const confirmActionType = ref('') // 'generate', 'submit', 'approve', 'reject', etc.
const confirmActionPayload = ref(null)

function openGeneratePayrollModal() {
  confirmActionType.value = 'generate'
  confirmModal.value = true
}

function openConfirmModal(type, payload = null) {
  confirmActionType.value = type
  confirmActionPayload.value = payload
  confirmModal.value = true
}

async function handleConfirmAction() {
  try {
    if (confirmActionType.value === 'generate') {
      await payrollStore.generatePayroll({
        start_date: dateFrom.value,
        end_date: dateTo.value,
      })
      await payrollStore.fetchPayrolls({
        start_date: dateFrom.value,
        end_date: dateTo.value,
      })
      showToastMessage('Payroll generated successfully!', 'success')
    } else if (confirmActionType.value === 'submit') {
      await payrollStore.submitPayroll(confirmActionPayload.value.id)
      await payrollStore.fetchPayrolls(currentDateRange.value)
      showToastMessage('Payroll submitted for review!', 'success')
    }
    // Repeat for approve, reject, process, etc.
    confirmModal.value = false
  } catch (err) {
    showToastMessage(err?.response?.data?.message || err.message, 'error')
    confirmModal.value = false
  }
}

const showEditModal = ref(false)

async function saveEditedPayroll() {
  await payrollStore.editPayroll(selectedPayroll.value.id, {
    ...selectedPayroll.value,
    status: 0,
  })
  showEditModal.value = false
  fetchPayrollsByDate()
  showToastMessage('Payroll updated. Please resubmit for review.', 'success')
}

function openEditPayrollModal(row) {
  selectedPayroll.value = { ...row }
  showEditModal.value = true
}
</script>

<template>
  <div class="w-full bg-white shadow-md rounded-md p-4">
    <!-- Top Bar -->
    <div class="flex flex-wrap items-center gap-2 mb-4">
      <input
        v-model="search"
        type="text"
        placeholder="Search Employee ID"
        class="input-search input-sm w-72"
      />

      <select
        v-model="statusFilter"
        class="select bg-white border-primaryColor text-black select-sm w-40"
      >
        <option value="">All Status</option>
        <option v-for="(info, key) in statusMap" :key="key" :value="Number(key)">
          {{ info.label }}
        </option>
      </select>
      <div class="flex flex-col"></div>
      <button class="btn-primaryStyle" @click="fetchPayrollsByDate">Filter</button>

      <div class="ml-auto flex items-center gap-2">
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
        <div class="">
          <button class="btn-primaryStyle" @click="openGeneratePayrollModal">
            Generate Payroll
          </button>
        </div>
      </div>
    </div>
    <div class="overflow-x-auto">
      <table class="table text-black w-full text-xs border border-gray-300 rounded-md">
        <thead class="text-black text-xs">
          <tr class="border border-gray-300 rounded-md text-xs">
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
            v-for="(row, idx) in paginatedPayrolls"
            :key="row.employee_id"
            class="border border-gray-300 rounded-md"
          >
            <td>{{ (currentPage - 1) * rowsPerPage + idx + 1 }}</td>
            <td>{{ row.employee?.full_name || row.employee_id }}</td>
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
            <td>
              <span
                v-if="statusMap[row.status]"
                :class="[
                  'px-2 py-1 rounded-full text-xs font-semibold',
                  statusMap[row.status].color,
                ]"
              >
                {{ statusMap[row.status].label }}
              </span>
              <span v-else>{{ row.status }}</span>
            </td>
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
                  v-if="
                    authStore.hasPermission(PERMISSION_IDS.HR_MANAGE_PAYROLL) && row.status === 0
                  "
                  class="text-black hover:text-white hover:bg-primaryColor/80 rounded-full p-1 cursor-pointer"
                  title="Submit to Finance"
                  @click="openConfirmModal('submit', row)"
                >
                  <SendIcon class="w-4 h-4" />
                </button>
                <button
                  v-if="
                    authStore.hasPermission(PERMISSION_IDS.FINANCE_MANAGE_PAYROLL) &&
                    row.status === 1
                  "
                  class="text-black hover:text-white hover:bg-primaryColor/80 rounded-full p-1 cursor-pointer"
                  title="Approve Payroll"
                  @click="approvePayroll(row)"
                >
                  <CheckIcon class="w-4 h-4" />
                </button>
                <button
                  v-if="
                    authStore.hasPermission(PERMISSION_IDS.FINANCE_MANAGE_PAYROLL) &&
                    row.status === 1
                  "
                  class="text-black hover:text-white hover:bg-primaryColor/80 rounded-full p-1 cursor-pointer"
                  title="Reject Payroll"
                  @click="openRejectModal(row)"
                >
                  <XIcon class="w-4 h-4" />
                </button>
                <button
                  v-if="
                    (authStore.hasPermission(PERMISSION_IDS.HR_MANAGE_PAYROLL) ||
                      authStore.hasPermission(PERMISSION_IDS.FINANCE_MANAGE_PAYROLL)) &&
                    row.status === 2
                  "
                  class="text-black hover:text-white hover:bg-primaryColor/80 rounded-full p-1 cursor-pointer"
                  title="Mark as Paid"
                  @click="markAsPaid(row)"
                >
                  <BookCheck class="w-4 h-4" />
                </button>
                <button
                  v-if="
                    authStore.hasPermission(PERMISSION_IDS.HR_MANAGE_PAYROLL) && row.status === 3
                  "
                  class="text-black hover:text-white hover:bg-primaryColor/80 rounded-full p-1 cursor-pointer"
                  title="Edit Payroll"
                  @click="openEditPayrollModal(row)"
                >
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m-2 2h6v2H7v-2z" />
                  </svg>
                </button>
                <button
                  class="text-black hover:text-white hover:bg-primaryColor/80 rounded-full p-1 cursor-pointer"
                  title="View Audit Log"
                  @click="openAuditLogModal(row)"
                >
                  <BookCheck class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!paginatedPayrolls.length">
            <td colspan="17" class="text-center py-4 text-gray-500">No payroll found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Main Table Pagination -->
    <div class="flex items-center gap-2 mt-4">
      <span class="text-black text-xs">Page</span>
      <select
        class="select !bg-white !border-black !text-black select-xs w-16"
        v-model="currentPage"
        :disabled="totalPages <= 1"
        @change="() => $nextTick(() => window.scrollTo(0, 0))"
      >
        <option v-for="page in totalPages" :key="page" :value="page">
          {{ page }}
        </option>
      </select>
      <span class="text-black text-xs">of {{ totalPages }}</span>
    </div>

    <!-- Payroll History Table -->
    <div class="mt-8 text-black">
      <div class="flex justify-between mb-2">
        <h3 class="font-semibold text-black">Payroll History</h3>
        <button class="btn-secondaryStyle" @click="exportPayroll">Export</button>
      </div>
      <div class="overflow-x-auto">
        <table class="table text-black w-full text-xs border border-gray-300 rounded-md">
          <thead class="text-black text-xs">
            <tr class="border border-gray-300 rounded-md">
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
            <tr v-for="(row, idx) in paginatedPayrollHistory" :key="row.id">
              <td>{{ idx + 1 }}</td>
              <td>{{ row.employee?.full_name || row.employee_id }}</td>
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
              <td>
                <span
                  v-if="statusMap[row.status]"
                  :class="[
                    'px-2 py-1 rounded-full text-xs font-semibold',
                    statusMap[row.status].color,
                  ]"
                >
                  {{ statusMap[row.status].label }}
                </span>
                <span v-else>{{ row.status }}</span>
              </td>
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
            <tr v-if="!Array.isArray(paginatedPayrollHistory) || !paginatedPayrollHistory.length">
              <td colspan="24" class="text-center py-4 text-gray-500">No payroll history found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- View Modal -->
    <dialog v-if="showViewModal" open class="modal">
      <div class="modal-box bg-white text-black max-w-lg">
        <h3 class="font-bold text-lg mb-2">Payroll Details</h3>
        <div class="divider"></div>

        <div v-if="selectedPayroll" class="flex flex-col gap-4">
          <!-- Employee Info -->
          <div class="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-lg">
            <div class="text-gray-500 text-sm">Employee Name</div>
            <div class="text-sm">
              {{ selectedPayroll.employee?.full_name || selectedPayroll.employee_id }}
            </div>
            <div class="text-gray-500 text-sm">Payroll Period</div>
            <div class="text-sm">
              {{ selectedPayroll.start_date }} to {{ selectedPayroll.end_date }}
            </div>
            <div class="text-gray-500 text-sm">Payroll Date</div>
            <div class="text-sm">{{ new Date(selectedPayroll.payroll_date).toLocaleString() }}</div>
            <div class="text-gray-500 text-sm">Status</div>
            <div>
              <span
                v-if="statusMap[selectedPayroll.status]"
                :class="['badge', statusMap[selectedPayroll.status].color]"
              >
                {{ statusMap[selectedPayroll.status].label }}
              </span>
            </div>
          </div>

          <!-- Payroll Breakdown -->
          <div>
            <h4 class="font-semibold text-primaryColor mb-1">Payroll Breakdown</h4>
            <div class="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-lg">
              <div class="text-gray-500 text-sm">Days Present</div>
              <div class="text-sm">{{ selectedPayroll.days_present }} days</div>
              <div class="text-gray-500 text-sm">Days Absent</div>
              <div class="text-sm">{{ selectedPayroll.days_absent }} days</div>
              <div class="text-gray-500 text-sm">Total Hours Worked</div>
              <div class="text-sm">{{ selectedPayroll.total_hours_worked }} hours</div>
              <div class="text-gray-500 text-sm">Regular Hour Pay</div>
              <div class="text-sm">
                ₱{{
                  selectedPayroll.regular_hour_pay.toLocaleString('en-PH', {
                    minimumFractionDigits: 2,
                  })
                }}
              </div>
              <div class="text-gray-500 text-sm">Overtime Pay</div>
              <div class="text-sm">
                ₱{{
                  selectedPayroll.overtime_pay.toLocaleString('en-PH', { minimumFractionDigits: 2 })
                }}
              </div>
              <div class="text-gray-500 text-sm">Tardiness Deduction</div>
              <div class="text-sm">
                ₱{{
                  selectedPayroll.tardiness_deduction.toLocaleString('en-PH', {
                    minimumFractionDigits: 2,
                  })
                }}
              </div>
              <div class="text-gray-500 text-sm">Absent Deduction</div>
              <div class="text-sm">
                ₱{{
                  selectedPayroll.absent_deduction.toLocaleString('en-PH', {
                    minimumFractionDigits: 2,
                  })
                }}
              </div>
            </div>
          </div>

          <!-- Deductions & Net Pay -->
          <div>
            <h4 class="font-semibold text-primaryColor mb-1">Deductions & Net Pay</h4>
            <div class="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-lg">
              <div class="text-gray-500 text-sm">Total Deduction</div>
              <div class="text-sm">
                ₱{{
                  selectedPayroll.deduction.toLocaleString('en-PH', { minimumFractionDigits: 2 })
                }}
              </div>
              <div class="text-gray-500 text-sm">Gross Pay</div>
              <div class="text-sm">
                ₱{{
                  selectedPayroll.gross_pay.toLocaleString('en-PH', { minimumFractionDigits: 2 })
                }}
              </div>
              <div class="text-gray-500 text-sm">Net Pay</div>
              <div class="font-bold text-sm text-green-600">
                ₱{{ selectedPayroll.net_pay.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
              </div>
            </div>
          </div>

          <!-- Remarks -->
          <div v-if="selectedPayroll.remarks" class="bg-yellow-50 p-3 rounded-lg">
            <div class="text-gray-500 text-sm font-semibold">Remarks:</div>
            <div>{{ selectedPayroll.remarks }}</div>
          </div>
        </div>

        <div class="modal-action">
          <button class="btn-primaryStyle" @click="showViewModal = false">Close</button>
        </div>
      </div>
    </dialog>

    <!-- Approve Modal -->
    <dialog v-if="showApproveModal" open class="modal">
      <div class="modal-box bg-white w-96 text-black">
        <h3 class="font-bold text-md text-black">Approve Payroll</h3>
        <div class="divider"></div>
        <p>Are you sure you want to approve this payroll?</p>
        <div class="modal-action">
          <button class="btn-secondaryStyle" @click="showApproveModal = false">Cancel</button>
          <button class="btn-primaryStyle" @click="approvePayroll(selectedPayroll.value)">
            Approve
          </button>
        </div>
      </div>
    </dialog>

    <!-- Reject Modal -->
    <dialog v-if="showRejectModal" open class="modal">
      <div class="modal-box bg-white w-96 text-black">
        <h3 class="font-bold text-md text-black">Reject Payroll</h3>
        <div class="divider"></div>
        <textarea v-model="remarks" class="textarea w-full" placeholder="Enter remarks"></textarea>
        <div class="modal-action">
          <button class="btn-secondaryStyle" @click="showRejectModal = false">Cancel</button>
          <button
            class="btn-errorStyle"
            @click="rejectPayroll(selectedPayroll.value, remarks.value)"
          >
            Reject
          </button>
        </div>
      </div>
    </dialog>

    <!-- Audit Log Modal -->
    <dialog v-if="showAuditLogModal" open class="modal">
      <div class="modal-box bg-white text-black max-w-lg">
        <h3 class="font-bold text-lg mb-2">Audit Log</h3>
        <div class="divider"></div>

        <div v-if="payrollStore.auditLogs.length" class="flex flex-col gap-3">
          <div
            v-for="log in payrollStore.auditLogs"
            :key="log.id"
            class="bg-gray-50 p-3 rounded-lg flex flex-col gap-1"
          >
            <div class="flex justify-between items-center">
              <span class="font-semibold text-primaryColor capitalize">
                {{ log.action.replace(/_/g, ' ') }}
              </span>
              <span class="text-xs text-gray-500">
                {{ new Date(log.created_at).toLocaleString() }}
              </span>
            </div>
            <div class="flex gap-2 text-sm">
              <span class="text-gray-500">By User:</span>
              <span class="font-medium">{{ log.user_id }}</span>
            </div>
            <div
              v-if="log.remarks"
              class="text-xs text-yellow-700 bg-yellow-100 rounded px-2 py-1 mt-1"
            >
              <span class="font-semibold">Remarks:</span> {{ log.remarks }}
            </div>
          </div>
        </div>
        <div v-else class="text-center text-gray-500 py-4">
          No audit log entries found for this payroll.
        </div>

        <div class="modal-action">
          <button class="btn-primaryStyle" @click="showAuditLogModal = false">Close</button>
        </div>
      </div>
    </dialog>

    <!-- Payroll History Pagination -->
    <div class="flex items-center gap-2 mt-4">
      <span class="text-black text-xs">Page</span>
      <select
        class="select !bg-white !border-black !text-black select-xs w-16"
        v-model="historyPage"
        :disabled="historyTotalPages <= 1"
        @change="() => $nextTick(() => window.scrollTo(0, 0))"
      >
        <option v-for="page in historyTotalPages" :key="page" :value="page">
          {{ page }}
        </option>
      </select>
      <span class="text-black text-xs">of {{ historyTotalPages }}</span>
    </div>

    <!-- Confirmation Modal -->
    <dialog v-if="confirmModal" open class="modal">
      <div class="modal-box bg-white w-96 text-black">
        <h3 class="font-bold text-md text-black">Confirm Action</h3>
        <div class="divider"></div>
        <p class="py-4 text-center text-black text-sm">
          Are you sure you want to
          <span class="font-bold">
            {{
              confirmActionType === 'generate'
                ? 'generate payroll'
                : confirmActionType === 'submit'
                  ? 'submit this payroll for review'
                  : confirmActionType === 'approve'
                    ? 'approve this payroll'
                    : confirmActionType === 'reject'
                      ? 'reject this payroll'
                      : 'perform this action'
            }}
          </span>
          ?
        </p>
        <div class="modal-action justify-center gap-4">
          <button class="btn-primaryStyle" @click="handleConfirmAction">Yes</button>
          <button class="btn-secondaryStyle" @click="confirmModal = false">Cancel</button>
        </div>
      </div>
    </dialog>

    <div
      v-if="showToast"
      :class="{
        'fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300': true,
        'bg-green-500': toastType === 'success',
        'bg-red-500': toastType === 'error',
        'bg-yellow-500': toastType === 'warning',
        'bg-blue-500': toastType === 'info',
      }"
    >
      <p class="text-white">{{ toastMessage }}</p>
    </div>

    <!-- Edit Modal -->
    <dialog v-if="showEditModal" open class="modal">
      <div class="modal-box bg-white text-black max-w-lg">
        <h3 class="font-bold text-md text-black mb-2">Edit Payroll</h3>
        <div class="divider"></div>
        <div class="flex flex-col gap-3">
          <div>
            <label class="block text-xs text-gray-500 mb-1">Overtime Pay</label>
            <input
              v-model.number="selectedPayroll.overtime_pay"
              type="number"
              min="0"
              class="input-search w-full"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Tardiness Deduction</label>
            <input
              v-model.number="selectedPayroll.tardiness_deduction"
              type="number"
              min="0"
              class="input-search w-full"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Absent Deduction</label>
            <input
              v-model.number="selectedPayroll.absent_deduction"
              type="number"
              min="0"
              class="input-search w-full"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Allowance</label>
            <input
              v-model.number="selectedPayroll.allowance"
              type="number"
              min="0"
              class="input-search w-full"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Bonus</label>
            <input
              v-model.number="selectedPayroll.bonus"
              type="number"
              min="0"
              class="input-search w-full"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Paid Holiday</label>
            <input
              v-model.number="selectedPayroll.paid_holiday"
              type="number"
              min="0"
              class="input-search w-full"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Remarks</label>
            <textarea
              v-model="selectedPayroll.remarks"
              class="textarea w-full h-24 bg-white border-black border"
              placeholder="Remarks"
            ></textarea>
          </div>
        </div>
        <div class="modal-action">
          <button class="btn-secondaryStyle" @click="showEditModal = false">Cancel</button>
          <button class="btn-primaryStyle" @click="saveEditedPayroll">Save</button>
        </div>
      </div>
    </dialog>

    <!-- Payroll Export Modal -->
    <dialog v-if="showPayrollExportModal" open class="modal">
      <div class="modal-box bg-white text-black w-full max-w-7xl">
        <h3 class="font-bold text-lg mb-2">Payroll History Preview</h3>
        <div class="divider"></div>
        <div class="overflow-x-auto" style="max-width: 90vw">
          <table
            class="table text-black w-full min-w-[1400px] text-xs border border-gray-300 rounded-md"
          >
            <thead class="text-black text-xs">
              <tr>
                <th>No.</th>
                <th>Employee</th>
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
              <tr v-for="(row, idx) in paginatedPayrollHistory" :key="row.id">
                <td>{{ idx + 1 }}</td>
                <td>{{ row.employee?.full_name || row.employee_id }}</td>
                <td>{{ row.month }}</td>
                <td>{{ row.quarter }}</td>
                <td>{{ row.week }}</td>
                <td>{{ row.start_date }}</td>
                <td>{{ row.end_date }}</td>
                <td>{{ row.payroll_date }}</td>
                <td>{{ row.days_present }}</td>
                <td>{{ row.total_hours_worked }}</td>
                <td>{{ row.regular_hour_pay }}</td>
                <td>{{ row.days_absent }}</td>
                <td>{{ row.absent_deduction }}</td>
                <td>{{ row.overtime_pay }}</td>
                <td>{{ row.tardiness_deduction }}</td>
                <td>{{ statusMap[row.status]?.label || row.status }}</td>
                <td>{{ row.allowance }}</td>
                <td>{{ row.bonus }}</td>
                <td>{{ row.paid_holiday }}</td>
                <td>{{ row.deduction }}</td>
                <td>{{ row.gross_pay }}</td>
                <td>{{ row.salary_before_tax }}</td>
                <td>{{ row.net_pay }}</td>
                <td>{{ row.tax_deduction }}</td>
              </tr>
              <tr v-if="!Array.isArray(paginatedPayrollHistory) || !paginatedPayrollHistory.length">
                <td colspan="24" class="text-center py-4 text-gray-500">
                  No payroll history found
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="modal-action flex gap-2">
          <button
            class="btn-primaryStyle"
            @click="() => downloadPayrollHistoryPDF(paginatedPayrollHistory, statusMap)"
          >
            Download PDF
          </button>
          <button
            class="btn-secondaryStyle"
            @click="() => printPayrollHistory(paginatedPayrollHistory, statusMap)"
          >
            Print
          </button>
          <button class="btn-secondaryStyle" @click="showPayrollExportModal = false">Close</button>
        </div>
      </div>
    </dialog>
  </div>
</template>
