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
  switch (key) {
    case 'Total Hours':
      return `${value}h`
    case 'Average Hours/Day':
      return `${value}h`
    case 'Total Overtime':
      return value > 0 ? `${value}h` : '-'
    case 'Total Days':
    case 'Present Days':
    case 'Late Days':
    case 'Absent Days':
    case 'On Leave Days':
      return value
    default:
      return value
  }
}

const getStatBoxStyle = (key) => {
  switch (key) {
    case 'Present Days':
      return 'bg-green-50'
    case 'Late Days':
      return 'bg-yellow-50'
    case 'Absent Days':
      return 'bg-red-50'
    case 'Total Overtime':
      return 'bg-purple-50'
    case 'On Leave Days':
      return 'bg-blue-50'
    default:
      return 'bg-gray-50'
  }
}
</script>

<template>
  <div class="bg-white shadow-md rounded-md p-5">
    <div class="flex gap-4 flex-col">
      <div class="flex items-center gap-2">
        <h1 class="font-semibold text-lg">{{ employeeName }}</h1>
        <span class="text-sm text-gray-500">Attendance Summary</span>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <template v-for="(value, key) in summary" :key="key">
          <div class="stat-box p-3 rounded-md" :class="getStatBoxStyle(key)">
            <p class="text-gray-600 text-xs">{{ key }}</p>
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
