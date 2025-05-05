<script setup>
import { ref } from 'vue'
import FinanceTreasuryPayroll from '@/components/Finance Components/Treasury Components/FinanceTreasuryPayroll.vue'
import FinanceSCMSupplyRequest from '@/components/Finance Components/Treasury Components/FinanceSCMSupplyRequest.vue'
import FinanceTreasuryLogs from '@/components/Finance Components/Treasury Components/FinanceTreasuryLogs.vue'

const selectedTab = ref('payroll')
</script>

<template>
  <div class="finance-container">
    <div class="tabs tabs-bordered bg-primaryColor max-h-[600px] shadow-md">
      <!-- Payroll Tab -->
      <input
        type="radio"
        name="finance_tabs"
        class="tab"
        aria-label="Payroll"
        v-model="selectedTab"
        value="payroll"
        checked
      />
      <div class="tab-content bg-white p-2">
        <FinanceTreasuryPayroll />
      </div>

      <!-- Supply Request Tab -->
      <input
        type="radio"
        name="finance_tabs"
        class="tab"
        aria-label="Supply Request"
        v-model="selectedTab"
        value="supply"
      />
      <div class="tab-content bg-white p-5">
        <FinanceSCMSupplyRequest />
      </div>

      <!-- Logs Tab -->
      <input
        type="radio"
        name="finance_tabs"
        class="tab"
        aria-label="Logs"
        v-model="selectedTab"
        value="logs"
      />
      <div class="tab-content bg-white p-5">
        <FinanceTreasuryLogs />
      </div>
    </div>
  </div>
</template>
