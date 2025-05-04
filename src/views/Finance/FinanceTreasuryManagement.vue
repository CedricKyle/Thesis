<script setup>
import { ref, computed } from 'vue'
import { CheckCircle, XCircle } from 'lucide-vue-next'

const selectedTab = ref('payroll')
const search      = ref('')

// Payroll data & actions
const payrolls             = ref([
  { id:1, employee_name:'Juan Dela Cruz', department:'Sales', pay_period:'June 2024', present:10, absent:1, late:2, overtime:5, bonus:1000, advance:200, status:'For Review' },
  { id:2, employee_name:'Maria Santos',   department:'Sales', pay_period:'June 2024', present:12, absent:0, late:0, overtime:8, bonus:1200, advance:300, status:'Approved' },
])
const approvedPayrolls     = ref([ payrolls.value[1] ])
const disapprovedPayrolls  = ref([])

const payrollsForReview = computed(() =>
  payrolls.value.filter(p =>
    p.status === 'For Review' &&
    p.employee_name.toLowerCase().includes(search.value.toLowerCase())
  )
)

function approvePayroll(id) {
  const idx = payrolls.value.findIndex(p => p.id === id)
  const p   = payrolls.value[idx]
  p.status = 'Approved'
  approvedPayrolls.value.push(p)
  payrolls.value.splice(idx,1)
}

function disapprovePayroll(id) {
  const idx = payrolls.value.findIndex(p => p.id === id)
  const p   = payrolls.value[idx]
  p.status = 'Disapproved'
  disapprovedPayrolls.value.push(p)
  payrolls.value.splice(idx,1)
}

const allPayrollHistory = computed(() =>
  [...approvedPayrolls.value, ...disapprovedPayrolls.value]
)

// Supply Requests data & actions
const supplyRequests = ref([
  { date:'2025-05-01', item:'Pork',    quantity:50,  unitPrice:180.00, status:'Pending' },
  { date:'2025-05-02', item:'Chicken', quantity:30,  unitPrice:120.50, status:'Pending' },
  { date:'2025-05-03', item:'Oil',     quantity:20,  unitPrice:150.75, status:'Approved' },
  { date:'2025-05-04', item:'Rice',    quantity:100, unitPrice:45.00,  status:'Pending' },
  { date:'2025-05-05', item:'Eggs',    quantity:200, unitPrice:6.25,   status:'Disapproved' },
])

const incomingRequests = computed(() =>
  supplyRequests.value.filter(r => r.status === 'Pending')
)

const requestHistory = computed(() =>
  supplyRequests.value.filter(r => r.status !== 'Pending')
)

function approveRequest(idx) {
  supplyRequests.value[idx].status = 'Approved'
}

function disapproveRequest(idx) {
  supplyRequests.value[idx].status = 'Disapproved'
}
</script>

<template>
  <div>
    <!-- Tab Navigation -->
    <div class="bg-primaryColor text-white font-medium">
      <nav class="flex justify-around items-center py-3">
        <a
          href="#"
          @click.prevent="selectedTab = 'payroll'"
          :class="{ 'text-gray-300': selectedTab !== 'payroll' }"
        >Payroll</a>
        <a
          href="#"
          @click.prevent="selectedTab = 'supplyPayment'"
          :class="{ 'text-gray-300': selectedTab !== 'supplyPayment' }"
        >Supply Request</a>
        <a
          href="#"
          @click.prevent="selectedTab = 'history'"
          :class="{ 'text-gray-300': selectedTab !== 'history' }"
        >History</a>
      </nav>
    </div>

    <div class="w-full bg-white shadow-md rounded-md p-4 space-y-6">
      <!-- Payroll Tab -->
      <div v-if="selectedTab === 'payroll'">
        <input
          v-model="search"
          type="text"
          placeholder="Search Employee"
          class="input input-sm w-72 mb-4 border border-gray-300"
        />
        <h3 class="text-xl font-semibold mb-4">Payroll - For Review</h3>
        <div class="overflow-x-auto">
          <table class="table w-full text-xs rounded-md">
            <thead class="bg-gray-100">
              <tr>
                <th class="px-4 py-2">No.</th>
                <th class="px-4 py-2">Employee</th>
                <th class="px-4 py-2">Dept.</th>
                <th class="px-4 py-2">Period</th>
                <th class="px-4 py-2">Pres.</th>
                <th class="px-4 py-2">Abs.</th>
                <th class="px-4 py-2">Late</th>
                <th class="px-4 py-2">OT</th>
                <th class="px-4 py-2">Bonus</th>
                <th class="px-4 py-2">Adv.</th>
                <th class="px-4 py-2">Status</th>
                <th class="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in payrollsForReview" :key="p.id">
                <td class="px-4 py-2">{{ p.id }}</td>
                <td class="px-4 py-2">{{ p.employee_name }}</td>
                <td class="px-4 py-2">{{ p.department }}</td>
                <td class="px-4 py-2">{{ p.pay_period }}</td>
                <td class="px-4 py-2">{{ p.present }}</td>
                <td class="px-4 py-2">{{ p.absent }}</td>
                <td class="px-4 py-2">{{ p.late }}</td>
                <td class="px-4 py-2">{{ p.overtime }}</td>
                <td class="px-4 py-2">₱{{ p.bonus }}</td>
                <td class="px-4 py-2">₱{{ p.advance }}</td>
                <td class="px-4 py-2">{{ p.status }}</td>
                <td class="px-4 py-2 flex gap-2">
                  <button
                    @click="approvePayroll(p.id)"
                    class="text-green-500 hover:text-green-600"
                    title="Approve"
                  ><CheckCircle/></button>
                  <button
                    @click="disapprovePayroll(p.id)"
                    class="text-red-500 hover:text-red-600"
                    title="Disapprove"
                  ><XCircle/></button>
                </td>
              </tr>
              <tr v-if="!payrollsForReview.length">
                <td colspan="12" class="px-4 py-2 text-center text-gray-500">
                  No payrolls for review.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Supply Request Tab -->
      <div v-else-if="selectedTab === 'supplyPayment'">
        <h3 class="text-xl font-semibold mb-4">Supply Requests</h3>

        <!-- Incoming -->
        <div>
          <h4 class="font-semibold mb-2">Incoming</h4>
          <div class="overflow-x-auto">
            <table class="table w-full text-xs rounded-md">
              <thead class="bg-gray-100">
                <tr>
                  <th class="px-4 py-2">Date</th>
                  <th class="px-4 py-2">Item</th>
                  <th class="px-4 py-2 text-right">Qty</th>
                  <th class="px-4 py-2 text-right">Unit ₱</th>
                  <th class="px-4 py-2 text-right">Total ₱</th>
                  <th class="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r,i) in incomingRequests" :key="i">
                  <td class="px-4 py-2">{{ r.date }}</td>
                  <td class="px-4 py-2">{{ r.item }}</td>
                  <td class="px-4 py-2 text-right">{{ r.quantity }}</td>
                  <td class="px-4 py-2 text-right">{{ r.unitPrice.toFixed(2) }}</td>
                  <td class="px-4 py-2 text-right">{{ (r.quantity*r.unitPrice).toFixed(2) }}</td>
                  <td class="px-4 py-2 flex gap-2">
                    <button
                      @click="approveRequest(i)"
                      class="text-green-500 hover:text-green-600"
                      title="Approve"
                    ><CheckCircle/></button>
                    <button
                      @click="disapproveRequest(i)"
                      class="text-red-500 hover:text-red-600"
                      title="Disapprove"
                    ><XCircle/></button>
                  </td>
                </tr>
                <tr v-if="!incomingRequests.length">
                  <td colspan="6" class="px-4 py-2 text-center text-gray-500">
                    No incoming requests.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- History Tab -->
      <div v-else-if="selectedTab === 'history'">
        <!-- Combined Payroll History -->
        <h3 class="text-xl font-semibold mb-4">Payroll History</h3>
<div class="overflow-x-auto mb-6">
  <table class="table w-full text-xs rounded-md">
    <thead class="bg-gray-100">
      <tr>
        <th class="px-4 py-2">No.</th>
        <th class="px-4 py-2">Employee</th>
        <th class="px-4 py-2">Dept.</th>
        <th class="px-4 py-2">Period</th>
        <th class="px-4 py-2">Bonus</th>
        <th class="px-4 py-2">Adv.</th>
        <th class="px-4 py-2">Status</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="p in allPayrollHistory" :key="p.id">
        <td class="px-4 py-2">{{ p.id }}</td>
        <td class="px-4 py-2">{{ p.employee_name }}</td>
        <td class="px-4 py-2">{{ p.department }}</td>
        <td class="px-4 py-2">{{ p.pay_period }}</td>
        <td class="px-4 py-2">₱{{ p.bonus }}</td>
        <td class="px-4 py-2">₱{{ p.advance }}</td>
        <td class="px-4 py-2">
          <span
            :class="{
              'badge badge-sm': true,
              'badge-success': p.status === 'Approved',
              'badge-error':   p.status === 'Disapproved',
            }"
          >
            {{ p.status }}
          </span>
        </td>
      </tr>
      <tr v-if="!allPayrollHistory.length">
        <td colspan="7" class="px-4 py-2 text-center text-gray-500">
          No payroll history.
        </td>
      </tr>
    </tbody>
  </table>
</div>


       <!-- Supply Request History -->
<h3 class="text-xl font-semibold mb-4">Supply Request History</h3>
<div class="overflow-x-auto">
  <table class="table w-full text-xs rounded-md">
    <thead class="bg-gray-100">
      <tr>
        <th class="px-4 py-2">Date</th>
        <th class="px-4 py-2">Item</th>
        <th class="px-4 py-2 text-right">Qty</th>
        <th class="px-4 py-2 text-right">Unit ₱</th>
        <th class="px-4 py-2 text-right">Total ₱</th>
        <th class="px-4 py-2">Status</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(r, i) in requestHistory" :key="i">
        <td class="px-4 py-2">{{ r.date }}</td>
        <td class="px-4 py-2">{{ r.item }}</td>
        <td class="px-4 py-2 text-right">{{ r.quantity }}</td>
        <td class="px-4 py-2 text-right">{{ r.unitPrice.toFixed(2) }}</td>
        <td class="px-4 py-2 text-right">{{ (r.quantity * r.unitPrice).toFixed(2) }}</td>
        <td class="px-4 py-2">
          <span
            :class="{
              'badge badge-sm': true,
              'badge-success':   r.status === 'Approved',
              'badge-error':     r.status === 'Disapproved',
            }"
          >{{ r.status }}</span>
        </td>
      </tr>
      <tr v-if="requestHistory.length === 0">
        <td colspan="6" class="px-4 py-2 text-center text-gray-500">
          No supply request history.
        </td>
      </tr>
    </tbody>
  </table>
</div>

      </div>
    </div>
  </div>
</template>

