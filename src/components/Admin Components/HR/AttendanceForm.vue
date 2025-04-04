<script setup>
import { useAttendanceForm } from '@/composables/Admin Composables/Human Resource/useAttendanceForm'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'
import { useAttendanceLogic } from '@/composables/Admin Composables/Human Resource/useAttendanceLogic'
import { storeToRefs } from 'pinia'
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps({
  departments: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['submit', 'showConfirm'])

const { newAttendance, formErrors, validateForm, resetForm } = useAttendanceForm()

// Get employees from employee store
const employeeStore = useEmployeeStore()
const { employees } = storeToRefs(employeeStore)

// Map department names to match the employee store format
const departmentMap = {
  'HR Department': 'HR Department',
  'Finance Department': 'Finance Department',
  'Sales Department': 'Sales Department',
  'Supply Chain Department': 'Supply Chain Department',
  'CRM Department': 'CRM Department',
}

// Updated filteredEmployees computed
const filteredEmployees = computed(() => {
  if (!newAttendance.value.department) return []

  console.log('Selected Department:', newAttendance.value.department)
  return employees.value.filter((emp) => emp.department === newAttendance.value.department)
})

// Watch for department changes to reset selected employee
watch(
  () => newAttendance.value.department,
  () => {
    newAttendance.value.employeeName = ''
  },
)

const isLoading = ref(false)
const hasAvailableEmployees = computed(() => filteredEmployees.value.length > 0)

// Load employees when component mounts
onMounted(() => {
  employeeStore.loadEmployees()
})

const handleSubmit = () => {
  if (!hasAvailableEmployees.value) {
    formErrors.value.employeeName = 'No employees available in selected department'
    return
  }

  if (validateForm()) {
    // Find the selected employee from filteredEmployees
    const selectedEmployee = filteredEmployees.value.find(
      (emp) => emp.fullName === newAttendance.value.employeeName,
    )

    if (!selectedEmployee) {
      formErrors.value.employeeName = 'Please select an employee'
      return
    }

    // Important: Pass the complete data including employeeId
    const attendanceData = {
      employeeName: selectedEmployee.fullName,
      employeeId: selectedEmployee.id,
      department: newAttendance.value.department,
      date: newAttendance.value.date,
      signIn: newAttendance.value.signIn,
      signOut: newAttendance.value.signOut,
    }

    console.log('Form submitting:', attendanceData) // Debug log
    emit('show-confirm', attendanceData)

    // Reset the form after successful submission
    resetForm()
  }
}

// Add these helper functions
function calculateStatus(signIn) {
  if (!signIn) return 'Absent'

  const [hours, minutes] = signIn.split(':')
  const signInTime = parseInt(hours) * 60 + parseInt(minutes)
  const startTime = 8 * 60 // 8:00 AM

  if (signInTime <= startTime) return 'Present'
  if (signInTime <= startTime + 15) return 'Late'
  return 'Absent'
}

const { calculateHours } = useAttendanceLogic() // Import if you need to calculate hours in this component
</script>

<template>
  <div class="form-container flex justify-center items-center">
    <div
      class="form-group flex flex-col w-1/3 bg-white h-[550px] p-6 justify-between shadow-lg border border-gray-200/50"
    >
      <div class="title">
        <h1 class="text-black text-2xl">Add Attendance</h1>
      </div>
      <div class="form-group overflow-y-auto">
        <fieldset class="fieldset">
          <!-- Department -->
          <div class="form-control">
            <legend class="fieldset-legend text-black">Department</legend>
            <select
              v-model="newAttendance.department"
              class="select focus:outline-none bg-white border text-black"
              :class="{
                'border-red-500': formErrors.department,
                'border-gray-200': !formErrors.department,
              }"
            >
              <option value="" disabled selected>Select Department</option>
              <option value="HR Department">HR Department</option>
              <option value="Finance Department">Finance Department</option>
              <option value="Sales Department">Sales Department</option>
              <option value="Supply Chain Department">Supply Chain Department</option>
              <option value="CRM Department">CRM Department</option>
            </select>
            <span v-if="formErrors.department" class="text-red-500 text-sm mt-1">
              {{ formErrors.department }}
            </span>
          </div>
          <!-- Employee name -->
          <div class="form-control">
            <legend class="fieldset-legend text-black">Employee</legend>
            <select
              v-model="newAttendance.employeeName"
              class="select focus:outline-none bg-white border text-black disabled:opacity-50"
              :class="{
                'border-red-500': formErrors.employeeName,
                'border-gray-200': !formErrors.employeeName,
              }"
              :disabled="!newAttendance.department"
            >
              <option value="" disabled selected>Select Employee</option>
              <option v-for="emp in filteredEmployees" :key="emp.id" :value="emp.fullName">
                {{ emp.fullName }}
              </option>
            </select>
            <span v-if="formErrors.employeeName" class="text-red-500 text-sm mt-1">
              {{ formErrors.employeeName }}
            </span>
          </div>

          <!-- Sign In -->
          <div class="form-control">
            <legend class="fieldset-legend text-black">Sign In</legend>
            <input
              v-model="newAttendance.signIn"
              type="time"
              class="input focus:outline-none bg-white border text-black"
              :class="{
                'border-red-500': formErrors.signIn,
                'border-gray-200': !formErrors.signIn,
              }"
            />
            <span v-if="formErrors.signIn" class="text-red-500 text-sm mt-1">
              {{ formErrors.signIn }}
            </span>
          </div>

          <!-- Sign Out -->
          <div class="form-control">
            <legend class="fieldset-legend text-black">Sign Out</legend>
            <input
              v-model="newAttendance.signOut"
              type="time"
              class="input focus:outline-none bg-white border text-black"
              :class="{
                'border-red-500': formErrors.signOut,
                'border-gray-200': !formErrors.signOut,
              }"
            />
            <span v-if="formErrors.signOut" class="text-red-500 text-sm mt-1">
              {{ formErrors.signOut }}
            </span>
          </div>

          <!-- Date -->
          <div class="form-control">
            <legend class="fieldset-legend text-black">Date</legend>
            <input
              v-model="newAttendance.date"
              type="date"
              class="input focus:outline-none bg-white border text-black"
              :class="{
                'border-red-500': formErrors.date,
                'border-gray-200': !formErrors.date,
              }"
            />
            <span v-if="formErrors.date" class="text-red-500 text-sm mt-1">
              {{ formErrors.date }}
            </span>
          </div>
        </fieldset>
      </div>
      <div class="action-buttons flex justify-end mt-5">
        <button
          @click="handleSubmit"
          class="btn bg-primaryColor text-white border-none hover:bg-primaryColor/80"
        >
          Add Attendance
        </button>
      </div>
    </div>
  </div>

  <!-- Add debug info temporarily -->
  <div v-if="newAttendance.department" class="text-sm text-gray-600">
    <p>Selected Department: {{ newAttendance.department }}</p>
    <p>Available Employees: {{ filteredEmployees.length }}</p>
  </div>
</template>

<style scoped>
.fieldset-legend {
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.form-control {
  width: 100%;
}

.input,
.select {
  width: 100%;
  padding: 0.5rem;
  border-radius: 0.375rem;
}

.input:focus,
.select:focus {
  border-color: var(--primary-color);
}
</style>
