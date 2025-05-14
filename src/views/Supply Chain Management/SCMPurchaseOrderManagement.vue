<script setup>
import SCMReceivingManagement from '@/components/SCM Components/Purchase Management Component/SCMReceivingManagement.vue'
import SCMPurchaseOrder from '@/components/SCM Components/Purchase Management Component/SCMPurchaseOrder.vue'
</script>

<template>
  <div class="tabs tabs-border bg-primaryColor max-h-[600px] shadow-md">
    <input type="radio" name="my_tabs_2" class="tab" aria-label="Receiving Order" />
    <div class="tab-content bg-white p-5">
      <SCMReceivingManagement />
    </div>

    <input type="radio" name="my_tabs_2" class="tab" aria-label="Purchased Order" />
    <div class="tab-content bg-white p-5">
      <SCMPurchaseOrder />
    </div>
  </div>
</template>
