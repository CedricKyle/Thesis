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
  #printable-audit-log,
  #printable-audit-log * {
    visibility: visible !important;
  }
  #printable-audit-log {
    display: block !important;
    position: static !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 24px !important;
    background: white !important;
    color: black !important;
    z-index: 9999 !important;
    box-shadow: none !important;
  }
  .modal,
  .modal-box {
    position: static !important;
    display: block !important;
    width: 100% !important;
    margin: 0 !important;
    box-shadow: none !important;
    background: white !important;
  }
  .modal-action,
  .btn-primaryStyle,
  .btn-secondaryStyle {
    display: none !important;
  }
}
</style>
