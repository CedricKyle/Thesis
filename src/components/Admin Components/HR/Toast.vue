<script setup>
defineProps({
  show: Boolean,
  message: String,
  type: String,
  customClass: String,
})
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="toast toast-top toast-end">
      <div
        class="alert"
        :class="[
          {
            'alert-error': type === 'error',
            'alert-success': type === 'success',
            'alert-info': type === 'info',
          },
          customClass,
        ]"
      >
        <span>{{ message }}</span>
      </div>
    </div>
  </Teleport>
</template>
