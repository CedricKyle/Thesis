<script setup>
import BaseTable from '@/components/common/BaseTable.vue'
import Toast from '@/components/Admin Components/HR/Toast.vue'
import { ref } from 'vue'
const columns = [
  { title: 'Request ID', field: 'request_id' },
  { title: 'Description', field: 'description' },
  { title: 'Request Date', field: 'request_date' },
  {
    title: 'Request Status',
    field: 'request_status',
    formatter: (cell) => {
      const status = cell.getValue()
      const badgeClasses = {
        Pending: 'badge badge-outline badge-warning text-xs badge-sm',
        Approved: 'badge badge-outline badge-success text-xs badge-sm',
        Rejected: 'badge badge-outline badge-error text-xs badge-sm',
      }
      return `<span class="${badgeClasses[status] || 'badge badge-outline badge-neutral text-xs badge-sm'}">${status}</span>`
    },
  },
  {
    title: 'Action',
    field: 'action',
    formatter: (cell) => {
      return `
        <div class="flex gap-2">
          <button class="btn btn-sm btn-circle hover:bg-primaryColor/80 border-none btn-ghost view-button" title="View">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
          <button class="btn btn-sm btn-circle hover:bg-primaryColor/80 border-none btn-ghost edit-button" title="Edit">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button class="btn btn-sm btn-circle hover:bg-red-400 border-none btn-ghost cancelRequest-button" title="Cancel Request">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      `
    },
  },
]

//sample data
const data = ref([
  {
    request_id: '3547823',
    description: 'Request 1',
    request_date: '2025-05-14',
    request_status: 'Pending',
    action: 'View',
  },
])
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <input class="input-search input-sm" placeholder="Search Request" />
      <div class="flex gap-2">
        <button class="btn-primaryStyle btn-sm">+ Add Request</button>
      </div>
    </div>
    <BaseTable :columns="columns" :data="data" />
    <div class="flex justify-end gap-2 mt-4">
      <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
      <span class="text-sm cursor-pointer hover:text-gray-500 text-black">
        Show Archived Requests
      </span>
    </div>
  </div>
</template>
