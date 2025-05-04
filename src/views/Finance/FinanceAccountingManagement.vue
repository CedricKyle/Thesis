<script setup>
import { ref, computed } from 'vue'
import FinanceAccountantPayroll from '@/components/Finance Components/Accountant Components/FinanceAccountantPayroll.vue'
import FinanceFinancialStatement from '@/components/Finance Components/Accountant Components/FinanceFinancialStatement.vue'
import FinanceSupplierPayments from '@/components/Finance Components/Accountant Components/FinanceSupplierPayments.vue'
import FinanceTransactionRecords from '@/components/Finance Components/Accountant Components/FinanceTransactionRecords.vue'
import FinancePayrollAuditLog from '@/components/Finance Components/Accountant Components/FinancePayrollAuditLog.vue'

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
const selectedTab = ref('payroll')

// Modal related data for transaction edit
const showEditModal = ref(false)
const selectedTransaction = ref(null)

// Filter payrolls based on search input
const filteredPayrolls = computed(() =>
  payrolls.value.filter(
    (row) => !search.value || row.employee_name.toLowerCase().includes(search.value.toLowerCase()),
  ),
)

// Filter transactions based on search input
const filteredTransactions = computed(() =>
  transactions.value.filter(
    (transaction) =>
      !search.value || transaction.name.toLowerCase().includes(search.value.toLowerCase()),
  ),
)

// Handle delete action for transactions
const deleteTransaction = (transactionId) => {
  transactions.value = transactions.value.filter(
    (transaction) => transaction.transaction_id !== transactionId,
  )
}

// Handle update action to show modal for transactions
const openEditModal = (transactionId) => {
  selectedTransaction.value = {
    ...transactions.value.find((t) => t.transaction_id === transactionId),
  }
  showEditModal.value = true
}

// Handle the form submission for editing a transaction
const updateTransaction = () => {
  if (selectedTransaction.value) {
    const index = transactions.value.findIndex(
      (t) => t.transaction_id === selectedTransaction.value.transaction_id,
    )
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
  <div class="employees-container">
    <div class="tabs tabs-border bg-primaryColor max-h-[600px] shadow-md">
      <!-- Payroll Tab -->
      <input type="radio" name="my_tabs_2" class="tab" aria-label="Payroll" checked="checked" />
      <div class="tab-content bg-white p-2">
        <FinanceAccountantPayroll />
      </div>

      <!-- Payroll Audit Log Tab -->
      <input type="radio" name="my_tabs_2" class="tab" aria-label="Audit Log" />
      <div class="tab-content bg-white p-2">
        <FinancePayrollAuditLog />
      </div>

      <!-- Financial Statement Tab -->
      <input type="radio" name="my_tabs_2" class="tab" aria-label="Financial Statement" />
      <div class="tab-content bg-white p-5">
        <FinanceFinancialStatement />
      </div>

      <!-- Supplier Payments Tab -->
      <input type="radio" name="my_tabs_2" class="tab" aria-label="Supplier Payments" />
      <div class="tab-content bg-white p-5">
        <FinanceSupplierPayments />
      </div>

      <!-- Transaction Records Tab -->
      <input type="radio" name="my_tabs_2" class="tab" aria-label="Transaction Records" />
      <div class="tab-content bg-white p-5">
        <FinanceTransactionRecords />
      </div>
    </div>
  </div>
</template>
