<script setup></script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-brownColor">This is Dashboard</h1>
    <div class="flex flex-col md:flex-row">
      <div class="w-full md:w-1/4">
        <AdminSidebar />
      </div>
      <div class="w-full md:w-3/4">
        <router-view />
      </div>    
  </div>
</template>
