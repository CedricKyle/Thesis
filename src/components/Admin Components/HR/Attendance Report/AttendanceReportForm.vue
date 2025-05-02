<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'
import { DEPARTMENTS } from '@/composables/Admin Composables/User & Role/role/permissionsId'

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
const error = ref(null)

// Load employees when component mounts
onMounted(async () => {
  try {
    error.value = null
    await employeeStore.loadEmployees()
    console.log('Loaded employees:', employees.value)
  } catch (err) {
    error.value = 'Failed to load employees. Please try again.'
    console.error('Error loading employees:', err)
  }
})

const filteredEmployees = computed(() => {
  if (!props.formData.department) return []

  return employees.value.filter(
    (emp) =>
      (props.formData.department === 'ALL_DEPARTMENTS' ||
        emp.department === props.formData.department) &&
      !emp.deleted_at &&
      emp.role !== 'Super Admin',
  )
})

const departments = computed(() => ['ALL_DEPARTMENTS', ...Object.values(DEPARTMENTS)])

const validateDates = () => {
  const startDate = new Date(props.formData.startDate)
  const endDate = new Date(props.formData.endDate)

  if (endDate < startDate) {
    error.value = 'End date cannot be earlier than start date'
    return false
  }
  return true
}

const handleSubmit = () => {
  try {
    error.value = null

    if (!validateDates()) {
      return
    }

    if (props.formData.employeeName === 'ALL') {
      emit('submit', 'ALL')
      return
    }

    const selectedEmployee = employees.value.find(
      (emp) => emp.full_name === props.formData.employeeName,
    )

    if (!selectedEmployee) {
      error.value = 'Selected employee not found'
      return
    }

    emit('submit', selectedEmployee.employee_id)
  } catch (err) {
    error.value = 'An error occurred while submitting the form'
    console.error('Form submission error:', err)
  }
}
</script>

<template>
  <div class="p-5 bg-white rounded-md shadow-md">
    <!-- Error Alert -->
    <div v-if="error" class="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
      {{ error }}
    </div>

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
              <option v-for="dept in departments" :key="dept" :value="dept">
                {{ dept === 'ALL_DEPARTMENTS' ? 'All Departments' : dept }}
              </option>
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
              <option value="ALL">All Employees</option>
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
                :max="formData.endDate"
              />

              <MoveRight class="w-10 h-6" />

              <input
                v-model="formData.endDate"
                type="date"
                class="w-full input input-sm focus:outline-none text-black bg-transparent"
                :min="formData.startDate"
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

input[type='date']::-webkit-calendar-picker-indicator {
  filter: invert(0%) brightness(0%);
  cursor: pointer;
}
</style>
