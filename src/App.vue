<script setup>
import AdminSidebar from '/src/views/Admin/AdminSidebar.vue'
import LoginPage from '/src/views/LoginPage.vue'
import NotificationModal from '/src/components/common/NotificationModal.vue'
</script>

<template>
  <div>
    <router-view />
    <NotificationModal />
    
  </div>
</template>
  