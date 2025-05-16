<script setup>
const props = defineProps({
  show: { type: Boolean, required: true },
  receipt: { type: Object, default: null },
  onClose: { type: Function, required: true },
})

function printReceipt() {
  // Clone the receipt content
  const printContents = document.querySelector('.scm-print-area').innerHTML
  const printArea = document.getElementById('print-area')
  printArea.innerHTML = printContents
  printArea.style.display = 'block'

  window.print()

  // Clean up after printing
  printArea.innerHTML = ''
  printArea.style.display = 'none'
}
</script>

<template>
  <dialog v-if="show" open class="modal">
    <div class="modal-box bg-white text-black max-w-5xl scm-print-area">
      <div class="flex flex-col gap-2">
        <div class="flex justify-between items-center mb-2">
          <div class="flex flex-col">
            <div class="font-bold text-lg text-secondaryColor">Countryside</div>
            <div class="font-semibold text-xs">Cash Release Receipt</div>
          </div>
          <div class="text-xs text-gray-500">
            {{ new Date(receipt?.processed_at || Date.now()).toLocaleString() }}
            <div class="mb-2"><b>Request ID:</b> {{ receipt?.request_id }}</div>
          </div>
        </div>
        <table class="w-full text-xs border border-gray-300 mb-2 mt-2">
          <thead>
            <tr>
              <th class="border px-2 py-1">#</th>
              <th class="border px-2 py-1">Type</th>
              <th class="border px-2 py-1">Item Name</th>
              <th class="border px-2 py-1">Qty</th>
              <th class="border px-2 py-1">Unit</th>
              <th class="border px-2 py-1">Unit Price</th>
              <th class="border px-2 py-1">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in receipt?.items || []" :key="item.id || idx">
              <td class="border px-2 py-1">{{ idx + 1 }}</td>
              <td class="border px-2 py-1">{{ item.supply_type || '-' }}</td>
              <td class="border px-2 py-1">{{ item.item_name }}</td>
              <td class="border px-2 py-1">{{ item.quantity }}</td>
              <td class="border px-2 py-1">{{ item.unit }}</td>
              <td class="border px-2 py-1">
                ₱{{ Number(item.unit_price).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
              </td>
              <td class="border px-2 py-1">
                ₱{{ Number(item.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
              </td>
            </tr>
            <tr>
              <td class="border px-2 py-1 font-bold text-right" colspan="6">Total</td>
              <td class="border px-2 py-1 font-bold">
                ₱{{
                  Number(receipt?.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })
                }}
              </td>
            </tr>
          </tbody>
        </table>
        <div class="grid grid-cols-3">
          <div class="text-sm col-span-3"><b>Description:</b> {{ receipt?.description }}</div>
          <div class="flex justify-between col-span-3">
            <div class="text-sm">
              <b>Prepared By:</b> {{ receipt?.prepared_by_name || receipt?.prepared_by || 'N/A' }}
            </div>
            <div class="text-sm">
              <b>Approved By:</b> {{ receipt?.approved_by_name || receipt?.approved_by || 'N/A' }}
            </div>
            <div class="text-sm"><b>Released By:</b> {{ receipt?.processed_by || 'Treasury' }}</div>
          </div>
          <div class="text-sm col-span-3 flex justify-end">
            <b>Received By:</b>&nbsp;{{ receipt?.received_by || 'SCM Representative' }}
          </div>
        </div>

        <div class="mt-8 pt-8 flex flex-col items-end">
          <div class="border-t border-gray-400 w-1/4 mb-1"></div>
          <div class="text-xs text-gray-600">Signature over printed name</div>
        </div>
      </div>
      <div class="modal-action flex gap-2">
        <button class="btn-primaryStyle" @click="printReceipt">Print</button>
        <button class="btn-secondaryStyle" @click="onClose">Close</button>
      </div>
    </div>
  </dialog>
</template>
