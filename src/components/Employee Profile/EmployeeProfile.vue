<script setup>
import AttendanceLog from './AttendanceLog.vue'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'

const employeeStore = useEmployeeStore()
const currentUserEmployee = employeeStore.currentUserEmployee
</script>

<template>
  <AttendanceLog :employee-id="currentUserEmployee.employee_id" />
</template>
