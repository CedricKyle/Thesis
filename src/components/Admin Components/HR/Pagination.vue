<script setup>
defineProps({
  currentPage: {
    type: Number,
    required: true,
  },
  totalPages: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['page-change'])
</script>

<template>
  <div class="flex justify-center py-4 bg-white">
    <div class="join gap-1">
      <button
        class="join-item btn btn-xs !bg-gray-200 text-gray-600"
        :class="{ 'btn-disabled': currentPage === 1 }"
        @click="emit('page-change', currentPage - 1)"
      >
        «
      </button>

      <template v-for="page in totalPages" :key="page">
        <button
          class="join-item btn btn-xs"
          :class="{
            'bg-primaryColor text-white': currentPage === page,
            '!bg-gray-200 text-gray-600': currentPage !== page,
          }"
          @click="emit('page-change', page)"
        >
          {{ page }}
        </button>
      </template>

      <button
        class="join-item btn btn-xs !bg-gray-200 text-gray-600"
        :class="{ 'btn-disabled': currentPage === totalPages }"
        @click="emit('page-change', currentPage + 1)"
      >
        »
      </button>
    </div>
  </div>
</template>
