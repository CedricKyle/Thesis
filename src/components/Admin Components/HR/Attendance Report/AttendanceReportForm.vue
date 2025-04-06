<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'

const props = defineProps({
  formData: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:formData', 'submit'])

const employeeStore = useEmployeeStore()
const { employees } = storeToRefs(employeeStore)

const filteredEmployees = computed(() => {
  if (!props.formData.department) return []
  return employees.value.filter((emp) => emp.department === props.formData.department)
})

const departments = [
  'HR Department',
  'Finance Department',
  'Sales Department',
  'Supply Chain Department',
  'CRM Department',
]

const handleSubmit = () => {
  const selectedEmployee = employees.value.find(
    (emp) => emp.fullName === props.formData.employeeName,
  )
  if (!selectedEmployee) return
  emit('submit', selectedEmployee.id)
}
</script>

<template>
  <div class="p-5 bg-white rounded-md shadow-md">
    <div class="flex flex-col gap-4">
      <div class="report-title">
        <h1 class="font-semibold">Attendance Report</h1>
      </div>

      <div class="flex gap-4 w-full">
        <!-- Department Selection -->
        <div>
          <legend class="fieldset-legend text-black text-xs">Department</legend>
          <select
            v-model="formData.department"
            class="select focus:outline-none bg-white border-black text-black input-sm"
            @change="$emit('update:formData', { ...formData, employeeName: '' })"
          >
            <option value="">Select Department</option>
            <option v-for="dept in departments" :key="dept">{{ dept }}</option>
          </select>
        </div>

        <!-- Employee Selection -->
        <div class="w-full">
          <legend class="fieldset-legend text-black text-xs">Employee</legend>
          <select
            v-model="formData.employeeName"
            class="select focus:outline-none bg-white border-black text-black input-sm"
            :disabled="!formData.department"
          >
            <option value="">Select Employee</option>
            <option v-for="emp in filteredEmployees" :key="emp.id" :value="emp.fullName">
              {{ emp.fullName }}
            </option>
          </select>
        </div>
      </div>

      <!-- Date Range -->
      <div class="flex gap-4 w-full justify-between items-end">
        <div class="flex gap-8 w-full">
          <div>
            <legend class="fieldset-legend text-black text-xs">From</legend>
            <input
              v-model="formData.startDate"
              type="date"
              class="border-black border-1 rounded-md p-2 input-xs"
            />
          </div>

          <div class="w-full">
            <legend class="fieldset-legend text-black text-xs">To</legend>
            <input
              v-model="formData.endDate"
              type="date"
              class="border-black border-1 rounded-md p-2 input-xs"
            />
          </div>
        </div>

        <div class="action-button">
          <button
            @click="handleSubmit"
            class="btn bg-primaryColor border-none btn-sm px-6 py-4 text-xs font-thin hover:bg-primaryColor/80"
            :disabled="
              !formData.department ||
              !formData.employeeName ||
              !formData.startDate ||
              !formData.endDate
            "
          >
            Generate Report
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
