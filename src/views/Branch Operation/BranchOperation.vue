<script setup>
// This component serves as a parent layout for all Branch Operation views
import BranchOperationSidebar from './BranchOperationSidebar.vue'
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <!-- Sidebar -->
    <BranchOperationSidebar />

    <!-- Main content area -->
    <div class="flex-1 overflow-auto bg-gray-50 p-4 text-black">
      <!-- Router view to display child components -->
      <router-view />
    </div>
  </div>
</template>
