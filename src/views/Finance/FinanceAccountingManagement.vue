<script setup>
// Account Reconciliation page: compare bank/credit statement vs general ledger transactions
import { ref } from 'vue';

// Dummy transaction data for reconciliation (bank vs ledger)
const transactions = ref([
  { date: '2025-07-01', description: 'Food Supply',    bankAmount: 500,  ledgerAmount: 500,  status: 'Matched' },
  { date: '2025-07-02', description: 'Balance',  bankAmount: 200,  ledgerAmount: null, status: 'Mismatch' },  // in bank not in ledger
  { date: '2025-07-03', description: 'Expenses',bankAmount: null, ledgerAmount: 300,  status: 'Mismatch' },  // in ledger not in bank
  { date: '2025-07-04', description: 'Budget', bankAmount: 400,  ledgerAmount: 450,  status: 'Mismatch' }   // amounts differ
]);
</script>


<template>

  <div class="w-full bg-white shadow-md rounded-md p-4">
    <!-- Page title -->
    <h2 class="text-2xl font-bold mb-4">Account Reconciliation</h2>
    <!-- Transactions comparison table -->
    <div class="overflow-x-auto">
      <table class="table w-full table-zebra table-auto">
        <thead>
          <tr>
            <th class="px-4 py-2 text-left">Date</th>
            <th class="px-4 py-2 text-left">Description</th>
            <th class="px-4 py-2 text-right">Bank Amount</th>
            <th class="px-4 py-2 text-right">Ledger Amount</th>
            <th class="px-4 py-2 text-left">Status</th>
            <th class="px-4 py-2 text-left">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(txn, index) in transactions" :key="index">
            <td class="px-4 py-2">{{ txn.date }}</td>
            <td class="px-4 py-2">{{ txn.description }}</td>
            <!-- Display amounts or placeholder if missing -->
            <td class="px-4 py-2 text-right">
              <span v-if="txn.bankAmount !== null">\₱{{ txn.bankAmount.toLocaleString() }}</span>
              <span v-else class="text-gray-400">N/A</span>
            </td>
            <td class="px-4 py-2 text-right">
              <span v-if="txn.ledgerAmount !== null">\₱{{ txn.ledgerAmount.toLocaleString() }}</span>
              <span v-else class="text-gray-400">N/A</span>
            </td>
            <!-- Status badge: green for Matched, red for Mismatch -->
            <td class="px-4 py-2">
              <span :class="{'badge': true, 'badge-success': txn.status === 'Matched', 'badge-error': txn.status === 'Mismatch'}">
                {{ txn.status }}
              </span>
            </td>
            <!-- Adjustment action for mismatches -->
            <td class="px-4 py-2">
              <button 
                v-if="txn.status === 'Mismatch'" 
                class="btn btn-xs btn-outline">
                Adjust
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

