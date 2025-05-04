<script setup>
import { computed } from 'vue'

const props = defineProps({
  payslip: { type: Object, default: null },
  show: { type: Boolean, required: true },
  onClose: { type: Function, required: true },
  title: { type: String, default: 'Payslip' },
  printable: { type: Boolean, default: true },
})

function getDeductionAmount(type) {
  if (!props.payslip?.deductions) return '0.00'
  const normalize = (str) => str.toLowerCase().replace(/-/g, '')
  const found = props.payslip.deductions.find(
    (d) => normalize(d.deduction_type) === normalize(type),
  )
  return found ? Number(found.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '0.00'
}

function printPayslip() {
  window.print()
}
</script>

<template>
  <dialog v-if="show" open class="modal payslip-print-area">
    <div class="modal-box bg-white text-black max-w-4xl" id="payslip-modal-content">
      <div class="flex flex-col gap-2">
        <div class="flex justify-end items-start mb-2">
          <div class="text-xs text-gray-500">{{ new Date().toLocaleString() }}</div>
        </div>
        <div class="flex flex-row gap-8">
          <!-- Left Column -->
          <div class="w-1/3 border-r pr-4">
            <div class="mb-4">
              <div class="text-sm">
                I acknowledge to have receive from <b>Countryside</b>,<br />
                the amount stated below and have further claims for services
              </div>
              <div class="mt-4 flex items-center justify-between">
                <div class="">
                  <b class="text-sm">Pay Period:</b>
                </div>
                <div class="">
                  <span class="text-xs">{{ payslip.start_date }}</span>
                  <span class="text-sm font-bold mx-1">to</span>
                  <span class="text-xs">{{ payslip.end_date }}</span>
                </div>
              </div>
              <div class="mt-2 flex items-center justify-between">
                <b class="text-sm">Employee Id:</b>
                <span class="text-xs">{{ payslip.employee_id }}</span>
              </div>
              <div class="mt-2 flex items-center justify-between">
                <b class="text-sm">Name :</b>
                <span class="text-xs">{{
                  payslip.employee?.full_name || payslip.employee_id
                }}</span>
              </div>
              <div class="mt-4 flex items-center justify-between">
                <b class="text-sm">Total Earnings:</b>
                <span class="text-xs"
                  >₱{{
                    payslip.gross_pay?.toLocaleString('en-PH', {
                      minimumFractionDigits: 2,
                    }) ?? '0.00'
                  }}</span
                >
              </div>
              <div class="mt-2 flex items-center justify-between">
                <b class="text-sm">Deduction:</b>
                <span class="text-xs"
                  >₱{{
                    payslip.deduction?.toLocaleString('en-PH', {
                      minimumFractionDigits: 2,
                    }) ?? '0.00'
                  }}</span
                >
              </div>
              <div class="mt-2 flex items-center justify-between">
                <b class="text-sm">Net Pay:</b>
                <span class="text-xs"
                  >₱{{
                    payslip.net_pay?.toLocaleString('en-PH', { minimumFractionDigits: 2 }) ?? '0.00'
                  }}</span
                >
              </div>
            </div>
            <div class="mt-12 pt-8">
              <div class="border-t border-gray-400 w-3/4 mx-auto mb-1"></div>
              <div class="text-center text-xs text-gray-600">Signature over printed name</div>
            </div>
          </div>
          <!-- Right Column -->
          <div class="w-2/3">
            <div class="text-center font-bold text-lg mb-2">
              <div class="flex justify-center items-center gap-2">
                <img
                  src="/public/countryside-logo.png"
                  alt="Countryside Logo"
                  class="w-7 h-7"
                />Countryside
              </div>
            </div>
            <div class="flex justify-between mb-2">
              <div>
                <b class="text-sm mr-3">Employee:</b>
                <span class="text-sm">{{
                  payslip.employee?.full_name || payslip.employee_id
                }}</span>
                <br />
                <b class="text-sm mr-3">Pay Period:</b>
                <span class="text-xs">{{ payslip.start_date }}</span>
                <span class="text-sm font-bold mx-1">to</span>
                <span class="text-xs">{{ payslip.end_date }}</span>
              </div>
              <div class="text-right">
                <b class="text-sm mr-3">Days of Week:</b>
                <span class="text-sm">{{ payslip.days_of_week || 14 }}</span>
                <br />
                <b class="text-sm mr-3">Days Present:</b>
                <span class="text-sm">{{ payslip.days_present }}</span>
              </div>
            </div>
            <!-- Earnings/Deductions Table -->
            <table class="w-full text-xs border border-gray-300 mb-2">
              <thead>
                <tr>
                  <th class="border px-2">Earnings</th>
                  <th class="border px-2">Hours</th>
                  <th class="border px-2">Amount</th>
                  <th class="border px-2">Deductions</th>
                  <th class="border px-2">Hours</th>
                  <th class="border px-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="border px-2">Total Hours Worked</td>
                  <td class="border px-2">
                    {{ payslip.total_hours_worked?.toFixed(2) ?? '-' }}
                  </td>
                  <td class="border px-2">
                    ₱{{
                      payslip.regular_hour_pay?.toLocaleString('en-PH', {
                        minimumFractionDigits: 2,
                      }) ?? '0.00'
                    }}
                  </td>
                  <td class="border px-2">SSS</td>
                  <td class="border px-2">-</td>
                  <td class="border px-2">₱{{ getDeductionAmount('SSS') }}</td>
                </tr>
                <tr>
                  <td class="border px-2">Overtime Pay</td>
                  <td class="border px-2">
                    {{ payslip.overtime_hours?.toFixed(2) ?? '-' }}
                  </td>
                  <td class="border px-2">
                    ₱{{
                      payslip.overtime_pay?.toLocaleString('en-PH', {
                        minimumFractionDigits: 2,
                      }) ?? '0.00'
                    }}
                  </td>
                  <td class="border px-2">Pag-ibig</td>
                  <td class="border px-2">-</td>
                  <td class="border px-2">₱{{ getDeductionAmount('Pag-ibig') }}</td>
                </tr>
                <tr>
                  <td class="border px-2">Paid Holiday</td>
                  <td class="border px-2">-</td>
                  <td class="border px-2">
                    ₱{{
                      payslip.paid_holiday?.toLocaleString('en-PH', {
                        minimumFractionDigits: 2,
                      }) ?? '0.00'
                    }}
                  </td>
                  <td class="border px-2">Philhealth</td>
                  <td class="border px-2">-</td>
                  <td class="border px-2">₱{{ getDeductionAmount('Philhealth') }}</td>
                </tr>
                <tr>
                  <td class="border px-2">Allowance</td>
                  <td class="border px-2">-</td>
                  <td class="border px-2">
                    ₱{{
                      payslip.allowance?.toLocaleString('en-PH', {
                        minimumFractionDigits: 2,
                      }) ?? '0.00'
                    }}
                  </td>
                  <td class="border px-2">Tardiness</td>
                  <td class="border px-2">
                    {{ payslip.tardiness_hours?.toFixed(2) ?? '-' }}
                  </td>
                  <td class="border px-2">
                    ₱{{
                      payslip.tardiness_deduction?.toLocaleString('en-PH', {
                        minimumFractionDigits: 2,
                      }) ?? '0.00'
                    }}
                  </td>
                </tr>
                <tr>
                  <td class="border px-2">Bonus</td>
                  <td class="border px-2">-</td>
                  <td class="border px-2">
                    ₱{{
                      payslip.bonus?.toLocaleString('en-PH', {
                        minimumFractionDigits: 2,
                      }) ?? '0.00'
                    }}
                  </td>
                  <td class="border px-2">Tax</td>
                  <td class="border px-2">-</td>
                  <td class="border px-2">
                    ₱{{
                      payslip.tax_deduction?.toLocaleString('en-PH', {
                        minimumFractionDigits: 2,
                      }) ?? '0.00'
                    }}
                  </td>
                </tr>
                <tr>
                  <td class="border px-2">Rest Day Pay</td>
                  <td class="border px-2">
                    {{ payslip.rest_day_hours?.toFixed(2) ?? '-' }}
                  </td>
                  <td class="border px-2">
                    ₱{{
                      payslip.rest_day_pay?.toLocaleString('en-PH', {
                        minimumFractionDigits: 2,
                      }) ?? '0.00'
                    }}
                  </td>
                  <td class="border px-2"></td>
                  <td class="border px-2"></td>
                  <td class="border px-2"></td>
                </tr>
              </tbody>
            </table>
            <div class="flex justify-between font-bold mt-2">
              <div>
                <b class="text-xs mr-3">Total Earnings :</b>
                <span class="text-sm font-thin"
                  >₱{{
                    payslip.gross_pay?.toLocaleString('en-PH', {
                      minimumFractionDigits: 2,
                    }) ?? '0.00'
                  }}</span
                >
              </div>
              <div>
                <b class="text-xs mr-3">Total Deduction :</b>
                <span class="text-sm font-thin"
                  >₱{{
                    payslip.deduction?.toLocaleString('en-PH', {
                      minimumFractionDigits: 2,
                    }) ?? '0.00'
                  }}</span
                >
              </div>
              <div>
                <b class="text-xs mr-3">Net Pay :</b>
                <span class="text-sm font-thin"
                  >₱{{
                    payslip.net_pay?.toLocaleString('en-PH', { minimumFractionDigits: 2 }) ?? '0.00'
                  }}</span
                >
              </div>
            </div>
            <div class="text-xs text-gray-500 mt-2">
              <p class="text-xs font-bold">Remarks:</p>
              <span class="text-xs">{{ payslip.remarks }}</span>
            </div>
          </div>
        </div>
        <div class="modal-action flex gap-2">
          <button v-if="printable" class="btn-primaryStyle" @click="printPayslip">Print</button>
          <button class="btn-secondaryStyle" @click="onClose">Close</button>
        </div>
      </div>
    </div>
  </dialog>
</template>
