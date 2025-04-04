<script setup>
import { Eye, X, ArrowUpDown } from 'lucide-vue-next'
import { useAttendanceLogic } from '@/composables/Admin Composables/Human Resource/useAttendanceLogic'

const { formatDate } = useAttendanceLogic()

defineProps({
  records: {
    type: Array,
    required: true,
  },
  sortBy: String,
  sortDesc: Boolean,
})

const emit = defineEmits(['sort', 'view', 'delete'])
</script>

<template>
  <div class="overflow-x-auto border shadow-lg">
    <table class="table text-black">
      <thead class="bg-primaryColor text-white">
        <tr>
          <th @click="emit('sort', 'name')" class="cursor-pointer">
            <div class="flex items-start justify-start gap-1">
              Name
              <ArrowUpDown
                class="h-4 w-4"
                :class="{
                  'opacity-100': sortBy === 'name',
                  'opacity-50': sortBy !== 'name',
                  'rotate-180': sortBy === 'name' && sortDesc,
                }"
              />
            </div>
          </th>
          <th @click="emit('sort', 'department')" class="cursor-pointer">
            <div class="flex items-start justify-start gap-1">
              Department
              <ArrowUpDown
                class="h-4 w-4"
                :class="{
                  'opacity-100': sortBy === 'department',
                  'opacity-50': sortBy !== 'department',
                  'rotate-180': sortBy === 'department' && sortDesc,
                }"
              />
            </div>
          </th>
          <th>Sign In</th>
          <th>Sign Out</th>
          <th>Working Hours</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="records.length === 0">
          <td colspan="10" class="text-center py-4 text-black">
            {{ searchQuery ? 'No matching records found' : 'No attendance records available' }}
          </td>
        </tr>

        <tr
          v-for="record in records"
          :key="record.id"
          class="hover:bg-gray-50 border-b-1 border-gray-200"
        >
          <td class="whitespace-nowrap">{{ record.name }}</td>
          <td class="whitespace-nowrap">{{ record.department }}</td>
          <td class="whitespace-nowrap">{{ record.signIn || '-' }}</td>
          <td class="whitespace-nowrap">{{ record.signOut || '-' }}</td>
          <td class="whitespace-nowrap">{{ record.workingHours || '-' }}</td>
          <td class="whitespace-nowrap">
            <span
              :class="{
                'bg-green-100 text-green-800': record.status === 'Present',
                'bg-red-100 text-red-800': record.status === 'Absent',
                'bg-yellow-100 text-yellow-800': record.status === 'Late',
                'bg-blue-100 text-blue-800': record.status === 'On Leave',
              }"
              class="px-2 py-1 text-xs font-medium rounded-full"
            >
              {{ record.status }}
            </span>
          </td>
          <td class="whitespace-nowrap">
            <template v-if="!record.id.toString().startsWith('absent-')">
              <button
                @click="emit('view', record)"
                class="btn btn-sm btn-circle hover:bg-primaryColor/80 border-none btn-ghost"
              >
                <Eye class="h-4 w-4" />
              </button>
              <button
                @click="emit('delete', record)"
                class="btn btn-sm btn-circle hover:bg-red-400 border-none btn-ghost"
              >
                <X class="h-4 w-4" />
              </button>
            </template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
