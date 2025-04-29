<script setup>
import StockIn from '@/components/SCM Components/Inventory Management Component/StockIn.vue'
import StockOut from '@/components/SCM Components/Inventory Management Component/StockOut.vue'
import StockAdjustment from '@/components/SCM Components/Inventory Management Component/StockAdjustment.vue'
import StockMonitoring from '@/components/SCM Components/Inventory Management Component/StockMonitoring.vue'
</script>

<template>
  <div class="overflow-y-auto p-4">
    <div class="flex flex-col gap-4">
      <StockMonitoring />
      <StockIn class="w-full" />
      <StockOut class="w-full" />
      <StockAdjustment class="w-full" />
    </div>
  </div>
</template>
