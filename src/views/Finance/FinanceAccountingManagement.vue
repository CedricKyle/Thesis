<script setup>
import { ref, computed } from 'vue'
import { EyeIcon, BookCheck, CircleX, UserPen } from 'lucide-vue-next'
import StockMonitoring from '@/components/SCM Components/Inventory Management Component/StockMonitoring.vue'

// Dummy payroll data
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
    gross_salary: 20000,
    net_pay: 19000,
    status: 'Processed',
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
    gross_salary: 18000,
    net_pay: 17050,
    status: 'For Review',
    created_at: '2024-06-16',
  },
])

// Dummy transaction records data
const transactions = ref([
  {
    transaction_id: 1,
    date: '2024-06-01',
    name: 'Juan Dela Cruz',
    phone_number: '09171234567',
    location: 'Manila',
    product: 'Laptop',
    quantity: 2,
    unit_price: 25000,
    total_price: 50000,
    status: 'Completed',
  },
  {
    transaction_id: 2,
    date: '2024-06-02',
    name: 'Maria Santos',
    phone_number: '09281234567',
    location: 'Cebu',
    product: 'Phone',
    quantity: 1,
    unit_price: 15000,
    total_price: 15000,
    status: 'Pending',
  },
])

const search = ref('')
const selectedTab = ref('payroll')  // This will track which tab is selected

// Modal related data for transaction edit
const showEditModal = ref(false)
const selectedTransaction = ref(null)

// Filter payrolls based on search input
const filteredPayrolls = computed(() =>
  payrolls.value.filter(row =>
    !search.value || row.employee_name.toLowerCase().includes(search.value.toLowerCase())
  )
)

// Filter transactions based on search input
const filteredTransactions = computed(() =>
  transactions.value.filter(transaction =>
    !search.value || transaction.name.toLowerCase().includes(search.value.toLowerCase())
  )
)

// Handle delete action for transactions
const deleteTransaction = (transactionId) => {
  transactions.value = transactions.value.filter(transaction => transaction.transaction_id !== transactionId)
}

// Handle update action to show modal for transactions
const openEditModal = (transactionId) => {
  selectedTransaction.value = { ...transactions.value.find(t => t.transaction_id === transactionId) }
  showEditModal.value = true
}

// Handle the form submission for editing a transaction
const updateTransaction = () => {
  if (selectedTransaction.value) {
    const index = transactions.value.findIndex(t => t.transaction_id === selectedTransaction.value.transaction_id)
    transactions.value[index] = { ...selectedTransaction.value }
  }
  showEditModal.value = false
}

// Function to format the pay period month for payrolls
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
  <div>
    <!-- Navigation Bar (Tabs) -->
    <div class="bg-primaryColor text-white font-medium">
      <nav class="flex justify-around items-center py-3">
        <!-- Update the links to toggle tabs using selectedTab -->
        <a href="#" @click.prevent="selectedTab = 'payroll'" :class="{'text-gray-300': selectedTab !== 'payroll'}" class="hover:text-gray-300 transition duration-150 ease-in-out">Payroll</a>
        <a href="#" @click.prevent="selectedTab = 'supplyPayment'" :class="{'text-gray-300': selectedTab !== 'supplyPayment'}" class="hover:text-gray-300 transition duration-150 ease-in-out">Supply Payment</a>
        <a href="#" @click.prevent="selectedTab = 'transactionRecords'" :class="{'text-gray-300': selectedTab !== 'transactionRecords'}" class="hover:text-gray-300 transition duration-150 ease-in-out">Transaction Records</a>
        <a href="#" @click.prevent="selectedTab = 'financialStatement'" :class="{'text-gray-300': selectedTab !== 'financialStatement'}" class="hover:text-gray-300 transition duration-150 ease-in-out">Financial Statement</a>
      </nav>
    </div>

    <!-- Conditional Rendering of Content based on selectedTab -->
    <div class="w-full bg-white shadow-md rounded-md p-4">
      <!-- Search Bar -->
      <input v-model="search" type="text" placeholder="Search" class="input-search input-sm w-72 mb-4" />

      <!-- Payroll Content (only show when selectedTab is 'payroll') -->
      <div v-if="selectedTab === 'payroll'">
        <div class="overflow-x-auto">
          <h3 class="mb-4">Payroll</h3>
          <table class="table text-black w-full text-xs border border-gray-300 rounded-md">
            <thead>
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
              <tr v-for="row in filteredPayrolls" :key="row.id">
                <td>{{ row.id }}</td>
                <td>{{ row.employee_name }}</td>
                <td>{{ row.department }}</td>
                <td>{{ getPayPeriodMonth(row.pay_period) }}</td>
                <td>{{ row.days_of_present }}</td>
                <td>{{ row.days_of_absent }}</td>
                <td>{{ row.hours_late }}</td>
                <td>{{ row.over_time }}</td>
                <td>₱{{ row.bonus }}</td>
                <td>₱{{ row.advance_payments }}</td>
                <td>₱{{ row.mandatory_deductions }}</td>
                <td>₱{{ row.tax }}</td>
                <td>₱{{ row.gross_salary }}</td>
                <td>₱{{ row.net_pay }}</td>
                <td>{{ row.status }}</td>
                <td>
                  <button class="text-black hover:text-white hover:bg-primaryColor/80 rounded-full p-1">
                    <EyeIcon class="w-4 h-4" />
                  </button>
                  <button class="text-black hover:text-white hover:bg-primaryColor/80 rounded-full p-1">
                    <BookCheck class="w-4 h-4" />
                  </button>
                </td>
              </tr>
              <tr v-if="!filteredPayrolls.length">
                <td colspan="16" class="text-center py-4">No payroll records found</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="selectedTab === 'supplyPayment'">
        <StockMonitoring />
      </div>
      <!-- Transaction Records Content (only show when selectedTab is 'transactionRecords') -->
      <div v-if="selectedTab === 'transactionRecords'">
        <h3 class="mb-4">Transaction Records</h3>
        <div class="overflow-x-auto">
          <table class="table text-black w-full text-xs border border-gray-300 rounded-md">
            <thead>
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="transaction in filteredTransactions" :key="transaction.transaction_id">
                <td>{{ transaction.date }}</td>
                <td>{{ transaction.name }}</td>
                <td>{{ transaction.phone_number }}</td>
                <td>{{ transaction.location }}</td>
                <td>{{ transaction.product }}</td>
                <td>{{ transaction.quantity }}</td>
                <td>₱{{ Number(transaction.unit_price).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
                <td>₱{{ Number(transaction.total_price).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
                <td>
                  <span :class="{
                    'badge': true,
                    'badge-success': transaction.status === 'Completed',
                    'badge-warning': transaction.status === 'Pending',
                    'badge-neutral': transaction.status === 'Pending'
                  }">
                    {{ transaction.status }}
                  </span>
                </td>
                <td>
                  <!-- Update Button with DaisyUI Icon -->
                  <button @click="openEditModal(transaction.transaction_id)" class="text-black hover:text-white hover:bg-primaryColor/80 rounded-full p-1">
                    <UserPen class="w-4 h-4" />
                  </button>

                  <!-- Delete Button with DaisyUI Icon -->
                  <button @click="deleteTransaction(transaction.transaction_id)" class="text-black hover:text-white hover:bg-primaryColor/80 rounded-full p-1">
                    <CircleX class="w-4 h-4" />
                  </button>
                </td>
              </tr>
              <tr v-if="!filteredTransactions.length">
                <td colspan="10" class="text-center py-4 text-gray-500">No transaction history found</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    <!-- Financial Statement Content (only show when selectedTab is 'financialStatement') -->
<div v-if="selectedTab === 'financialStatement'">
  <div class="grid grid-cols-4 grid-rows-[auto_auto_auto_auto] gap-4 text-black">
    <!-- Stats Grid -->
    <div class="col-span-4 flex gap-7 justify-between">
      <div>
        <div class="card bg-white w-60 shadow-md">
          <div class="card-body">
            <div class="card-header flex flex-row gap-2 justify-between">
              <div><h1 class="text-xl font-bold text-gray-600">Balance</h1></div>
              <div><EllipsisVertical class="w-4 h-4" /></div>
            </div>
            <div class="card-content mt-4 flex flex-row gap-2 justify-between">
              <div>
                <h1 class="text-primaryColor text-4xl font-bold">₱ 4,320</h1>
              </div>
              <div class="w-11">
                <img :src="ExpensesImage" />
              </div>
            </div>
            <div class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"></div>
            <div class="text-sm text-gray-500 mt-2">April 2025</div>
          </div>
        </div>
      </div>
      <div>
        <div class="card bg-white w-60 shadow-md">
          <div class="card-body">
            <div class="card-header flex flex-row gap-2 justify-between">
              <div><h1 class="text-xl font-bold text-gray-600">Expenses</h1></div>
              <div><EllipsisVertical class="w-4 h-4" /></div>
            </div>
            <div class="card-content mt-4 flex flex-row gap-2 justify-between">
              <div>
                <h1 class="text-primaryColor text-4xl font-bold">₱ 3,320</h1>
              </div>
              <div class="w-11">
                <img :src="BalanceImage" />
              </div>
            </div>
            <div class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"></div>
            <div class="text-sm text-gray-500 mt-2">April 2025</div>
          </div>
        </div>
      </div>
      <div>
        <div class="card bg-white w-60 shadow-md">
          <div class="card-body">
            <div class="card-header flex flex-row gap-2 justify-between">
              <div><h1 class="text-xl font-bold text-gray-600">Budget</h1></div>
              <div><EllipsisVertical class="w-4 h-4" /></div>
            </div>
            <div class="card-content mt-4 flex flex-row gap-2 justify-between">
              <div>
                <h1 class="text-primaryColor text-4xl font-bold">₱ 1,370</h1>
              </div>
              <div class="w-11">
                <img :src="BudgetImage" />
              </div>
            </div>
            <div class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"></div>
            <div class="text-sm text-gray-500 mt-2">April 2025</div>
          </div>
        </div>
      </div>
      <div>
        <div class="card bg-white w-60 shadow-md">
          <div class="card-body">
            <div class="card-header flex flex-row gap-2 justify-between">
              <div><h1 class="text-xl font-bold text-gray-600">Income</h1></div>
              <div><EllipsisVertical class="w-4 h-4" /></div>
            </div>
            <div class="card-content mt-4 flex flex-row gap-2 justify-between">
              <div>
                <h1 class="text-primaryColor text-4xl font-bold">₱300</h1>
              </div>
              <div class="w-11">
                <img :src="ProfitImage" />
              </div>
            </div>
            <div class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"></div>
            <div class="text-sm text-gray-500 mt-2">April 2025</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Financial Statement Table Below Cards -->
    <div class="col-span-4 mt-8">
      <h3 class="text-xl font-semibold mb-4">Financial Summary</h3>
      <div class="overflow-x-auto">
        <table class="table w-full text-sm rounded-md">
          <thead>
            <tr class="bg-gray-100">
              <th>Period</th>
              <th class="text-right">Income (₱)</th>
              <th class="text-right">Expenses (₱)</th>
              <th class="text-right">Budget (₱)</th>
              <th class="text-right">Balance (₱)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>April 2025</td>
              <td class="text-right">300</td>
              <td class="text-right">3,320</td>
              <td class="text-right">1,370</td>
              <td class="text-right">4,320</td>
            </tr>
            <tr>
              <td>March 2025</td>
              <td class="text-right">1,000</td>
              <td class="text-right">2,800</td>
              <td class="text-right">1,500</td>
              <td class="text-right">2,700</td>
            </tr>
            <tr>
              <td>February 2025</td>
              <td class="text-right">2,500</td>
              <td class="text-right">2,500</td>
              <td class="text-right">1,000</td>
              <td class="text-right">3,000</td>
            </tr>
          </tbody>
          <tfoot class="font-bold bg-gray-50">
            <tr>
              <td>Total</td>
              <td class="text-right">₱3,800</td>
              <td class="text-right">₱8,620</td>
              <td class="text-right">₱3,870</td>
              <td class="text-right">₱10,020</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</div>


      </div>
      <!-- Edit Modal for Transaction -->
      <dialog v-if="showEditModal" open class="modal text-black">
        <div class="modal-box bg-white w-[420px] p-6 rounded-lg shadow-lg">
          <h3 class="text-lg font-bold mb-4">Edit Transaction</h3>
          <div class="flex flex-col gap-3">
            <div>
              <label class="text-xs font-semibold">Product</label>
              <input v-model="selectedTransaction.product" type="text" class="input w-full border-black text-black bg-white" required />
            </div>
            <div>
              <label class="text-xs font-semibold">Quantity</label>
              <input v-model="selectedTransaction.quantity" type="number" class="input w-full border-black text-black bg-white" required />
            </div>
            <div>
              <label class="text-xs font-semibold">Unit Price</label>
              <input v-model="selectedTransaction.unit_price" type="number" class="input w-full border-black text-black bg-white" required />
            </div>
            <div>
              <label class="text-xs font-semibold">Status</label>
              <select v-model="selectedTransaction.status" class="select w-full border-black text-black bg-white">
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div class="flex justify-end gap-2 mt-4">
              <button class="btn btn-sm btn-secondary" @click="showEditModal = false">Cancel</button>
              <button class="btn btn-sm btn-primary" @click="updateTransaction">Update Transaction</button>
            </div>
          </div>
        </div>
      </dialog>
    </div>
  
</template>
