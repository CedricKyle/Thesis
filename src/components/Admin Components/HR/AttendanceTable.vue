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
          <th @click="emit('sort', 'id')" class="cursor-pointer">
            <div class="flex items-center gap-1">
              No.
              <ArrowUpDown
                class="h-4 w-4"
                :class="{
                  'opacity-100': sortBy === 'id',
                  'opacity-50': sortBy !== 'id',
                  'rotate-180': sortBy === 'id' && sortDesc,
                }"
              />
            </div>
          </th>
          <th @click="emit('sort', 'name')" class="cursor-pointer">
            <div class="flex items-center gap-1">
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
          <th>Date</th>
          <th>Sign In</th>
          <th>Sign Out</th>
          <th>Working Hours</th>
          <th>Department</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="record in records"
          :key="record.id"
          class="hover:bg-gray-100 bg-white border-b border-gray-200"
        >
          <th>{{ record.id }}</th>
          <td>{{ record.name }}</td>
          <td>{{ formatDate(record.date) }}</td>
          <td>{{ record.signIn }}</td>
          <td>{{ record.signOut }}</td>
          <td>{{ record.workingHours }}</td>
          <td>{{ record.department }}</td>
          <td>
            <span
              class="badge"
              :class="{
                'badge-success': record.status === 'Present',
                'badge-warning': record.status === 'Late',
                'badge-error': record.status === 'Absent',
              }"
            >
              {{ record.status }}
            </span>
          </td>
          <td>
            <div class="flex gap-2">
              <button @click="emit('view', record)" class="btn btn-sm btn-circle btn-ghost">
                <Eye class="h-4 w-4" />
              </button>
              <button
                @click="emit('delete', record)"
                class="btn btn-sm btn-circle btn-error btn-ghost"
              >
                <X class="h-4 w-4" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
