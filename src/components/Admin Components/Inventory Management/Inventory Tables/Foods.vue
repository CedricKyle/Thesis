<script setup>
import BaseProductTable from '../../../../views/Suppy Chain Management Department/BaseProductTable.vue'
defineProps({
  products: {
    type: Array,
    required: true,
    default: () => [],
  },
})
</script>

<template>
  <BaseProductTable
    :products="products"
    @edit-product="$emit('edit-product', $event)"
    @delete-product="$emit('delete-product', $event)"
  />
</template>
