<script setup>
import { ref, computed } from 'vue'
import { EyeIcon, CheckIcon, XIcon, BookCheck } from 'lucide-vue-next'

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
])

const transactions = ref([
  {
    transaction_id: 1,
    date: '2024-06-16',
    name: 'Juan Dela Cruz',
    phone_number: '09171234567',
    location: 'Dasma, Bayan',
    product: 'Pork Meat',
    quantity: 2,
    unit_price: 350,
    total_price: 700,
    status: 'Completed',
  },
  {
    transaction_id: 2,
    date: '2024-06-14',
    name: 'Maria Santos',
    phone_number: '09281234567',
    location: 'General Trias',
    product: 'Beef Meat',
    quantity: 1,
    unit_price: 300,
    total_price: 300,
    status: 'Pending',
  },
  {
    transaction_id: 3,
    date: '2024-06-13',
    name: 'Pedro Rodriguez',
    phone_number: '09321234567',
    location: 'Imus',
    product: 'Oil',
    quantity: 3,
    unit_price: 60,
    total_price: 180,
    status: 'Completed',
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

const filteredTransactions = computed(() =>
  transactions.value.filter(
    (transaction) =>
      (!search.value || transaction.name.toLowerCase().includes(search.value.toLowerCase())) &&
      (!statusFilter.value || transaction.status === statusFilter.value),
  ),
)

const getPayPeriodMonth = (payPeriod) => {
  const match = payPeriod.match(/^(\d{4})-(\d{2})/)
  if (!match) return payPeriod
  const year = match[1]
  const month = match[2]
  const date = new Date(`${year}-${month}-01`)
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' })
}
</script>

<template>
  <div class="w-full bg-white shadow-md rounded-md p-4">
    <!-- Search and Filter -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
      <div class="flex gap-2">
        <input
          v-model="search"
          type="text"
          placeholder="Search"
          class="input-search input-sm w-72"
        />
        <select
          v-model="statusFilter"
          class="select bg-white border-primaryColor text-black select-sm w-40"
        >
          <option value="">All Status</option>
          <option>Completed</option>
          <option>Pending</option>
        </select>
      </div>
    </div>

    <!-- Payroll History Table -->
    <div class="overflow-x-auto mb-8">
      <h3 class="font-semibold text-black mb-4">For Employees Payroll Records</h3>
      <table class="table text-black w-full text-xs border border-gray-300 rounded-md">
        <thead class="text-black text-xs">
          <tr>
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
            <th>Gross Salary</th>
            <th>Net Pay</th>
            <th>Status</th>
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
              ₱{{ Number(row.gross_salary).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
            </td>
            <td>
              ₱{{ Number(row.net_pay).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
            </td>
            <td>
              <span
                :class="[
                  'badge',
                  row.status === 'Processed'
                    ? 'badge-success'
                    : row.status === 'For Review'
                      ? 'badge-warning'
                      : row.status === 'Approved'
                        ? 'badge-info'
                        : 'badge-neutral',
                ]"
              >
                {{ row.status }}
              </span>
            </td>
            <td>
              <div class="flex gap-1">
                <button
                  class="text-black hover:text-white hover:bg-primaryColor/80 rounded-full p-1"
                >
                  <EyeIcon class="w-4 h-4" />
                </button>
                <button
                  class="text-black hover:text-white hover:bg-primaryColor/80 rounded-full p-1"
                >
                  <BookCheck class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!filteredPayrolls.length">
            <td colspan="16" class="text-center py-4 text-gray-500">No payroll history found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Transaction History Table -->
    <div class="overflow-x-auto">
      <h3 class="font-semibold text-black mb-4">For Suppliers Transaction Records</h3>
      <table class="table text-black w-full text-xs border border-gray-300 rounded-md">
        <thead class="text-black text-xs">
          <tr>
            <th>Date</th>
            <th>Name</th>
            <th>Phone Number</th>
            <th>Location</th>
            <th>Product</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Total Price</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="transaction in filteredTransactions"
            :key="transaction.transaction_id"
            class="border border-gray-300 rounded-md"
          >
            <td>{{ transaction.date }}</td>
            <td>{{ transaction.name }}</td>
            <td>{{ transaction.phone_number }}</td>
            <td>{{ transaction.location }}</td>
            <td>{{ transaction.product }}</td>
            <td>{{ transaction.quantity }}</td>
            <td>
              ₱{{
                Number(transaction.unit_price).toLocaleString('en-PH', { minimumFractionDigits: 2 })
              }}
            </td>
            <td>
              ₱{{
                Number(transaction.total_price).toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                })
              }}
            </td>
            <td>
              <span
                :class="[
                  'badge',
                  transaction.status === 'Completed'
                    ? 'badge-success'
                    : transaction.status === 'Pending'
                      ? 'badge-warning'
                      : 'badge-neutral',
                ]"
              >
                {{ transaction.status }}
              </span>
            </td>
          </tr>
          <tr v-if="!filteredTransactions.length">
            <td colspan="9" class="text-center py-4 text-gray-500">No transaction history found</td>
          </tr>
        </tbody>
      </table>

      <StockMonitoring />
    </div>
  </div>
</template>
