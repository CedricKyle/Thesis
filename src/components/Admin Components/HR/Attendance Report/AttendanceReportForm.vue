<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'

//icons
import { MoveRight } from 'lucide-vue-next'

const props = defineProps({
  formData: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:formData', 'submit'])

const employeeStore = useEmployeeStore()
const { employees } = storeToRefs(employeeStore)

// Load employees when component mounts
onMounted(async () => {
  await employeeStore.loadEmployees()
  console.log('Loaded employees:', employees.value) // Debug log
})

const filteredEmployees = computed(() => {
  if (!props.formData.department) return []

  console.log('Filtering employees:', {
    department: props.formData.department,
    employees: employees.value,
  })

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
    (emp) => emp.full_name === props.formData.employeeName, // Changed from fullName to full_name
  )

  console.log('Selected employee:', selectedEmployee)

  if (!selectedEmployee) return
  emit('submit', selectedEmployee.employee_id) // Changed from id to employee_id
}
</script>

<template>
  <div class="p-5 bg-white rounded-md shadow-md">
    <div class="flex flex-col gap-4 w-full">
      <div class="report-title">
        <h1 class="font-semibold">Attendance Report</h1>
      </div>

      <div class="flex flex-col gap-4 justify-start">
        <!-- Department Selection -->
        <div class="flex gap-4">
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
          <div class="">
            <legend class="fieldset-legend text-black text-xs">Employee</legend>
            <select
              v-model="formData.employeeName"
              class="select focus:outline-none bg-white border-black text-black input-sm"
              :disabled="!formData.department"
            >
              <option value="">Select Employee</option>
              <option
                v-for="emp in filteredEmployees"
                :key="emp.employee_id"
                :value="emp.full_name"
              >
                {{ emp.full_name }}
              </option>
            </select>
          </div>
        </div>

        <div class="flex gap-4">
          <div class="flex flex-col">
            <div class="">
              <legend class="text-black text-xs font-semibold flex items-center">
                Start Date <span class="mx-2"><MoveRight class="w-4 h-4" /></span> End Date
              </legend>
            </div>
            <div
              class="flex items-center bg-white border border-black rounded-sm shadow-sm space-x-2"
            >
              <input
                v-model="formData.startDate"
                type="date"
                class="input input-sm focus:outline-none text-black bg-transparent"
              />

              <MoveRight class="w-10 h-6" />

              <input
                v-model="formData.endDate"
                type="date"
                class="w-full input input-sm focus:outline-none text-black bg-transparent"
              />
            </div>
          </div>

          <div class="flex items-end ml-auto">
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
  </div>
</template>

<style scoped>
input[type='date'] {
  min-height: 2rem;
  height: 2rem;
  padding: 0 0.5rem;
}

.select {
  min-height: 2rem;
  height: 2rem;
}
</style>
