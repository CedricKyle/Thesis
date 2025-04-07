<script setup>
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'
import BaseTable from '@/components/common/BaseTable.vue'
import EmployeeView from './EmployeeView.vue'

const store = useEmployeeStore()

// Create a function to generate SVG string for the Eye icon
const eyeIconSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
`

// Define columns for Tabulator
const columns = [
  {
    title: 'Employee ID',
    field: 'id',
    sorter: 'number',
  },
  {
    title: 'Full Name',
    field: 'fullName',
    sorter: 'string',
  },
  {
    title: 'Department',
    field: 'department',
    sorter: 'string',
  },
  {
    title: 'Job Title',
    field: 'jobTitle',
  },
  {
    title: 'Email Address',
    field: 'email',
  },
  {
    title: 'Contact Number',
    field: 'contactNumber',
  },
  {
    title: 'Action',
    formatter: function (cell) {
      return `
        <button class="action-button">
          ${eyeIconSvg}
        </button>
      `
    },
    cellClick: function (e, cell) {
      store.setSelectedEmployee(cell.getRow().getData())
    },
    hozAlign: 'center',
    width: 100,
    headerSort: false,
  },
]

// Table options
const tableOptions = {
  pagination: true,
  paginationSize: 10,
  initialSort: [{ column: 'id', dir: 'asc' }],
}
</script>

<template>
  <div class="flex flex-col gap-8 mt-4">
    <BaseTable
      title="Employee List"
      :data="store.employees"
      :columns="columns"
      :options="tableOptions"
      @row-click="store.setSelectedEmployee"
    />

    <!-- Add EmployeeView component at the end -->
    <EmployeeView />
  </div>
</template>
