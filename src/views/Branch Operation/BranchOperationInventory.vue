<script setup>
import BranchOperationInventoryManagement from '@/components/Branch Operation Components/BranchOperationInventoryManagement.vue'
import BranchOperationRequestManagement from '@/components/Branch Operation Components/BranchOperationRequestManagement.vue'
</script>

<template>
  <div class="employees-container">
    <div class="tabs tabs-border bg-primaryColor max-h-[600px] shadow-md">
      <!-- Inventory Management Tab -->
      <input
        type="radio"
        name="my_tabs_2"
        class="tab"
        aria-label="Inventory Management"
        checked="checked"
      />
      <div class="tab-content bg-white p-2">
        <BranchOperationInventoryManagement />
      </div>

      <!-- Request Management Tab -->
      <input type="radio" name="my_tabs_2" class="tab" aria-label="Request Management" />
      <div class="tab-content bg-white p-5">
        <BranchOperationRequestManagement />
      </div>
    </div>
  </div>
</template>
