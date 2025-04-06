<script setup>
import { Printer } from 'lucide-vue-next'

defineProps({
  records: {
    type: Array,
    required: true,
  },
})

defineEmits(['generate-pdf'])

const statusClasses = {
  Present: 'bg-green-100 text-green-800',
  Absent: 'bg-red-100 text-red-800',
  Late: 'bg-yellow-100 text-yellow-800',
  'On Leave': 'bg-blue-100 text-blue-800',
}
</script>

<template>
  <div class="bg-white shadow-md rounded-md p-5">
    <div class="flex gap-4 flex-col">
      <div class="flex justify-between items-center">
        <h1 class="font-semibold">Attendance Summary</h1>
        <button
          @click="$emit('generate-pdf')"
          class="btn bg-primaryColor border-none btn-sm px-6 py-4 text-xs font-thin hover:bg-primaryColor/80"
          title="Export as PDF"
        >
          <Printer class="w-4 h-4" />
        </button>
      </div>

      <div class="overflow-x-auto border border-gray-300/50 shadow-lg">
        <table class="table text-black">
          <thead class="bg-primaryColor text-white">
            <tr>
              <th>Date</th>
              <th>Time In</th>
              <th>Time Out</th>
              <th>Worked Hours</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="record in records"
              :key="record.date"
              class="hover:bg-gray-50 border-b-1 border-gray-200"
            >
              <td>{{ record.date }}</td>
              <td>{{ record.signIn || '-' }}</td>
              <td>{{ record.signOut || '-' }}</td>
              <td>
                {{
                  typeof record.workingHours === 'number'
                    ? parseFloat(record.workingHours).toFixed(2)
                    : '-'
                }}
              </td>
              <td>
                <span class="px-2 py-1 rounded-full text-xs" :class="statusClasses[record.status]">
                  {{ record.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
