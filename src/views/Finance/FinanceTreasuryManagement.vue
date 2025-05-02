<script setup>
import { ref, computed } from 'vue'
import { CheckCircle, XCircle } from 'lucide-vue-next'

const selectedTab = ref('payroll')
const search = ref('')

// Initial Payroll data
const payrolls = ref([
  { id: 1, employee_name: 'Juan Dela Cruz', department: 'Sales', pay_period: 'June 2024', present: 10, absent: 1, late: 2, overtime: 5, bonus: 1000, advance: 200, status: 'For Review' },
  { id: 2, employee_name: 'Maria Santos', department: 'Sales', pay_period: 'June 2024', present: 12, absent: 0, late: 0, overtime: 8, bonus: 1200, advance: 300, status: 'Approved' },
])

const approvedPayrolls = ref([
  { id: 2, employee_name: 'Maria Santos', department: 'Sales', pay_period: 'June 2024', present: 12, absent: 0, late: 0, overtime: 8, bonus: 1200, advance: 300, status: 'Approved' }
])

const disapprovedPayrolls = ref([])

// Filter payrolls for review status
const payrollsForReview = computed(() => {
  return payrolls.value.filter(p => 
    p.status === 'For Review' &&
    p.employee_name.toLowerCase().includes(search.value.toLowerCase())
  )
})

const approvePayroll = (id) => {
  const payrollIndex = payrolls.value.findIndex(p => p.id === id)
  if (payrollIndex !== -1) {
    payrolls.value[payrollIndex].status = 'Approved'
    approvedPayrolls.value.push(payrolls.value[payrollIndex])
    payrolls.value.splice(payrollIndex, 1) // remove from review list
  }
}

const disapprovePayroll = (id) => {
  const payrollIndex = payrolls.value.findIndex(p => p.id === id)
  if (payrollIndex !== -1) {
    payrolls.value[payrollIndex].status = 'Disapproved'
    disapprovedPayrolls.value.push(payrolls.value[payrollIndex])
    payrolls.value.splice(payrollIndex, 1) // remove from review list
  }
}
</script>

<template>
  <div class="bg-primaryColor text-white font-medium">
    <nav class="flex justify-around items-center py-3">
      <a href="#" @click.prevent="selectedTab = 'payroll'" :class="{ 'text-gray-300': selectedTab !== 'payroll' }">Payroll</a>
      <a href="#" @click.prevent="selectedTab = 'supplyPayment'" :class="{ 'text-gray-300': selectedTab !== 'supplyPayment' }">Supply Request</a>
      <a href="#" @click.prevent="selectedTab = 'history'" :class="{ 'text-gray-300': selectedTab !== 'history' }">History</a>
    </nav>
  </div>

  <div class="w-full bg-white shadow-md rounded-md p-4">
    <input v-model="search" type="text" placeholder="Search" class="input input-sm w-72 mb-4 border border-gray-300" />

    <!-- Payroll For Review -->
    <div v-if="selectedTab === 'payroll'">
      <h3 class="mt-4 text-xl font-semibold mb-4">Payroll - For Review</h3>
      <div class="overflow-x-auto">
        <table class="table w-full text-xs rounded-md">

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
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in payrollsForReview" :key="p.id">
              <td>{{ p.id }}</td>
              <td>{{ p.employee_name }}</td>
              <td>{{ p.department }}</td>
              <td>{{ p.pay_period }}</td>
              <td>{{ p.present }}</td>
              <td>{{ p.absent }}</td>
              <td>{{ p.late }}</td>
              <td>{{ p.overtime }}</td>
              <td>₱{{ p.bonus }}</td>
              <td>₱{{ p.advance }}</td>
              <td>{{ p.status }}</td>
              <td>
                <button @click="approvePayroll(p.id)" class="text-green-500 hover:text-green-600 mr-1.5 "><CheckCircle /></button>
                <button @click="disapprovePayroll(p.id)" class="text-red-500 hover:text-red-600 "><XCircle /></button>
              </td>
            </tr>
            <tr v-if="payrollsForReview.length === 0">
              <td colspan="12" class="text-center py-4 text-gray-500">No payrolls for review.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Supply Payment Placeholder -->
    <div v-if="selectedTab === 'supplyPayment'" class="mt-4">
      <p class="text-gray-500">Supply Request content goes here.</p>
    </div>

    <!-- History -->
    <div v-if="selectedTab === 'history'" class="mt-4">
      <!-- Approved Payrolls -->
      <h3 class="mt-4 text-xl font-semibold">Approved Payrolls</h3>
      <div class="overflow-x-auto mt-2">
        <table class="table w-full text-xs rounded-md">
          <thead>
            <tr>
              <th>No.</th>
              <th>Employee Name</th>
              <th>Department</th>
              <th>Pay Period</th>
              <th>Bonus</th>
              <th>Advance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in approvedPayrolls" :key="p.id">
              <td>{{ p.id }}</td>
              <td>{{ p.employee_name }}</td>
              <td>{{ p.department }}</td>
              <td>{{ p.pay_period }}</td>
              <td>₱{{ p.bonus }}</td>
              <td>₱{{ p.advance }}</td>
              <td>{{ p.status }}</td>
            </tr>
            <tr v-if="approvedPayrolls.length === 0">
              <td colspan="7" class="text-center py-4 text-gray-500">No approved payrolls yet.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Disapproved Payrolls -->
      <h3 class="mt-6 text-xl font-semibold">Disapproved Payrolls</h3>
      <div class="overflow-x-auto mt-2">
        <table class="table w-full text-xs rounded-md">

          <thead>
            <tr>
              <th>No.</th>
              <th>Employee Name</th>
              <th>Department</th>
              <th>Pay Period</th>
              <th>Bonus</th>
              <th>Advance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in disapprovedPayrolls" :key="p.id">
              <td>{{ p.id }}</td>
              <td>{{ p.employee_name }}</td>
              <td>{{ p.department }}</td>
              <td>{{ p.pay_period }}</td>
              <td>₱{{ p.bonus }}</td>
              <td>₱{{ p.advance }}</td>
              <td>{{ p.status }}</td>
            </tr>
            <tr v-if="disapprovedPayrolls.length === 0">
              <td colspan="7" class="text-center py-4 text-gray-500">No disapproved payrolls yet.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
