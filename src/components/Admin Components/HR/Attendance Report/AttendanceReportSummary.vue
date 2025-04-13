<script setup>
defineProps({
  employeeName: {
    type: String,
    required: true,
  },
  summary: {
    type: Object,
    required: true,
  },
})

const getTextColor = (key) => {
  switch (key) {
    case 'Absent Days':
      return 'text-red-500'
    case 'Late Days':
      return 'text-secondaryColor'
    case 'Total Overtime':
      return 'text-purple-600'
    default:
      return ''
  }
}

const formatValue = (key, value) => {
  if (key === 'Total Overtime') {
    return `${value}h`
  }
  return value
}
</script>

<template>
  <div class="bg-white shadow-md rounded-md p-5">
    <div class="flex gap-4 flex-col">
      <div>
        <h1 class="font-semibold">{{ employeeName }}</h1>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <template v-for="(value, key) in summary" :key="key">
          <div
            class="stat-box p-3 rounded-md"
            :class="key === 'Total Overtime' ? 'bg-purple-50' : 'bg-gray-50'"
          >
            <p class="text-gray-600 text-sm">{{ key }}</p>
            <p class="text-xl font-semibold" :class="getTextColor(key)">
              {{ formatValue(key, value) }}
            </p>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stat-box {
  transition: all 0.3s ease;
}

.stat-box:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}
</style>
