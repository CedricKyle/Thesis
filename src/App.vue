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

<style>
@media print {
  body * {
    visibility: hidden !important;
  }
  .payslip-print-area,
  .payslip-print-area * {
    visibility: visible !important;
  }
  .payslip-print-area {
    position: absolute !important;
    left: 0;
    top: 0;
    width: 100vw;
    height: auto;
    background: white !important;
    box-shadow: none !important;
    z-index: 9999 !important;
  }
  .modal-action {
    display: none !important;
  }
}
</style>
