<script setup>
import Header from '../components/Header.vue';
import Footer from '../components/Footer.vue';
</script>

<template>
  <div class="layout-container">
    <Header />
    <main class="main-content">
      <router-view />
    </main>
    <Footer />
  </div>
</template>

<style scoped>
.layout-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  overflow-x: hidden;
}

.main-content {
  flex: 1;
  width: 100%;
  box-sizing: border-box;
}

/* Responsive breakpoints */
@media screen and (max-width: 768px) {
  .layout-container {
    overflow-x: hidden;
  }
}

@media screen and (max-width: 480px) {
  .layout-container {
    overflow-x: hidden;
  }
}
</style> 