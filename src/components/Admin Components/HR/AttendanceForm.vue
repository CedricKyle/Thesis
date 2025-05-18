<script setup>
import { useAttendanceForm } from '@/composables/Admin Composables/Human Resource/useAttendanceForm'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'
import { useAttendanceStore } from '@/stores/HR Management/attendanceStore'
import { useAttendanceLogic } from '@/composables/Admin Composables/Human Resource/useAttendanceLogic'
import { storeToRefs } from 'pinia'
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import axios from '@/plugins/axios'

const API_URL = import.meta.env.VITE_API_URL

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

// Initialize attendance store
const attendanceStore = useAttendanceStore()

// Map department names to match the employee store format
const departmentMap = {
  'HR Department': 'HR Department',
  'Finance Department': 'Finance Department',
  'Sales Department': 'Sales Department',
  'Supply Chain Management': 'Supply Chain Management',
  'Customer Relationship Management': 'Customer Relationship Management',
}

// Updated filteredEmployees computed property
const filteredEmployees = computed(() => {
  if (!newAttendance.value.department) return []

  return employees.value.filter(
    (emp) =>
      // Only include employees that:
      // 1. Match the selected department
      // 2. Are not soft-deleted (deleted_at is null)
      // 3. Are not Super Admin
      emp.department === newAttendance.value.department &&
      !emp.deleted_at &&
      emp.role !== 'Super Admin',
  )
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
onMounted(async () => {
  isLoading.value = true
  try {
    await employeeStore.loadEmployees()
    attendanceStore.loadRecords()
  } catch (error) {
    console.error('Error loading data:', error)
  } finally {
    isLoading.value = false
  }
})

// Add this computed property
const calculateOvertime = (signIn, signOut) => {
  if (!signIn || !signOut) return 0

  const [inHours, inMinutes] = signIn.split(':').map(Number)
  const [outHours, outMinutes] = signOut.split(':').map(Number)

  const inTime = inHours * 60 + inMinutes
  const outTime = outHours * 60 + outMinutes

  // Regular work hours (8 hours = 480 minutes)
  const regularHours = 480

  // Calculate total worked minutes
  const workedMinutes = outTime - inTime

  // If worked more than regular hours, calculate overtime
  if (workedMinutes > regularHours) {
    return ((workedMinutes - regularHours) / 60).toFixed(2)
  }

  return 0
}

const isSubmitting = ref(false)

// Add this near the top of the script with other refs
const errorTimeout = ref(null)

// Add this function to handle error message clearing
const clearErrorWithTimeout = (message, duration = 2000) => {
  // Clear any existing timeout
  if (errorTimeout.value) {
    clearTimeout(errorTimeout.value)
  }

  // Set the error message
  formErrors.value.general = message

  // Set new timeout to clear the error
  errorTimeout.value = setTimeout(() => {
    formErrors.value.general = ''
  }, duration)
}

const otProof = ref(null)
const otProofPreview = ref(null)

function handleOTProof(e) {
  const file = e.target.files[0]
  if (file) {
    otProof.value = file
    otProofPreview.value = URL.createObjectURL(file)
  }
}

const existingAttendance = computed(() => {
  if (!newAttendance.value.employeeName || !newAttendance.value.date) return null
  const selectedEmployee = employees.value.find(
    (emp) => emp.full_name === newAttendance.value.employeeName,
  )
  if (!selectedEmployee) return null

  const filtered = attendanceStore.attendanceRecords
    .filter(
      (rec) =>
        rec.employee_id === selectedEmployee.employee_id &&
        rec.date === newAttendance.value.date &&
        (!rec.deleted_at || rec.deleted_at === null),
    )
    .sort((a, b) => b.id - a.id)

  console.log(
    'Filtered attendance records for',
    selectedEmployee.full_name,
    newAttendance.value.date,
    filtered,
  )

  const found = filtered.find((rec) => rec.status === 'Present' || rec.status === 'Late')
  console.log('existingAttendance found:', found)
  return found
})

watch(
  [() => newAttendance.value.employeeName, () => newAttendance.value.date],
  ([employeeName, date]) => {
    const rec = existingAttendance.value
    if (rec && rec.approvalStatus === 'Rejected') {
      newAttendance.value.signIn = rec.signIn !== '-' ? rec.signIn?.slice(0, 5) : ''
      newAttendance.value.signOut = rec.signOut !== '-' ? rec.signOut?.slice(0, 5) : ''
      if (rec.overtimeProof) {
        otProofPreview.value = rec.overtimeProof.startsWith('http')
          ? rec.overtimeProof
          : `${API_URL}/${rec.overtimeProof.replace(/^\//, '')}`
      } else {
        otProofPreview.value = null
      }
    }
  },
)

const showConfirmModal = ref(false)

function openConfirmModal(data) {
  showConfirmModal.value = true
  formErrors.value.general = ''
}

function closeConfirmModal() {
  showConfirmModal.value = false
  formErrors.value.general = ''
}

async function confirmAddAttendance(data) {
  try {
    await attendanceStore.addRecord(data)
    showConfirmModal.value = false
    formErrors.value.general = ''
  } catch (e) {
    // handle error
  }
}

const handleSubmit = async () => {
  if (isSubmitting.value) return

  isSubmitting.value = true
  formErrors.value.general = ''

  try {
    if (!validateForm()) {
      isSubmitting.value = false
      return
    }

    const selectedEmployee = filteredEmployees.value.find(
      (emp) => emp.full_name === newAttendance.value.employeeName,
    )

    if (!selectedEmployee) {
      clearErrorWithTimeout('Selected employee not found')
      isSubmitting.value = false
      return
    }

    const formatTime = (time) => (time ? `${time}:00` : null)

    const attendanceData = {
      employee_id: selectedEmployee.employee_id,
      full_name: selectedEmployee.full_name,
      department: newAttendance.value.department,
      date: newAttendance.value.date,
      time_in: formatTime(newAttendance.value.signIn),
      time_out: formatTime(newAttendance.value.signOut),
      signIn: formatTime(newAttendance.value.signIn),
      signOut: formatTime(newAttendance.value.signOut),
    }

    if (existingAttendance.value) {
      if (existingAttendance.value.approvalStatus === 'Rejected') {
        const formData = new FormData()
        Object.entries(attendanceData).forEach(([key, value]) => {
          formData.append(key, value)
        })
        if (otProof.value) {
          formData.append('overtime_proof', otProof.value)
        }

        await attendanceStore.updateAttendanceRecord(existingAttendance.value.id, formData)
        emit('submit', { ...attendanceData, updated: true })
      } else {
        clearErrorWithTimeout('Attendance already exists and cannot be updated.')
        isSubmitting.value = false
        return
      }
    } else {
      emit('showConfirm', attendanceData)
      formErrors.value.general = ''
    }
  } catch (error) {
    clearErrorWithTimeout(error.message || 'Error submitting attendance')
  } finally {
    isSubmitting.value = false
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

const handleFormSubmit = async (attendanceData) => {
  try {
    // ...your add logic...
    formErrors.value.general = '' // <-- CLEAR ERROR HERE
    showToastMessage('Attendance record added successfully', 'success')
  } catch (error) {
    showToastMessage(error.message || 'Failed to add attendance record', 'error')
  }
}

// Add this near the other lifecycle hooks
onBeforeUnmount(() => {
  // Clear any existing timeout when component is destroyed
  if (errorTimeout.value) {
    clearTimeout(errorTimeout.value)
  }
})

const handleManualReset = async () => {
  if (!existingAttendance.value) return
  try {
    if (!confirm('Are you sure you want to reset this attendance record?')) return
    await attendanceStore.deleteRecord(existingAttendance.value.id)
    await attendanceStore.loadRecords()
    resetForm()
    formErrors.value.general = 'Attendance record reset. You can now re-enter attendance.'
  } catch (error) {
    formErrors.value.general = error.message || 'Failed to reset attendance record.'
  }
}
</script>

<template>
  <div class="form-container flex justify-center items-center">
    <div
      class="form-group flex flex-col w-1/3 bg-white h-[500px] p-6 justify-between shadow-lg border border-gray-200/50"
    >
      <div class="title">
        <h1 class="text-black text-2xl">Add Attendance</h1>
      </div>
      <div class="form-group overflow-y-auto">
        <fieldset class="fieldset">
          <!-- Department -->
          <div class="form-control">
            <legend class="fieldset-legend text-black !m-0 !text-xs justify-start">
              Department <span class="text-red-500">*</span>
            </legend>
            <select
              v-model="newAttendance.department"
              class="select focus:outline-none bg-white border text-black input-sm"
              :class="{
                'border-red-500': formErrors.department,
                'border-gray-200': !formErrors.department,
              }"
            >
              <option value="" disabled selected>Select Department</option>
              <option value="HR Department">HR Department</option>
              <option value="Finance Department">Finance Department</option>
              <option value="Sales Department">Sales Department</option>
              <option value="Supply Chain Management">Supply Chain Management</option>
              <option value="Customer Relationship Management">
                Customer Relationship Management
              </option>
            </select>
            <span v-if="formErrors.department" class="text-red-500 text-xs mt-1">
              {{ formErrors.department }}
            </span>
          </div>
          <!-- Employee name -->
          <div class="form-control">
            <legend class="fieldset-legend text-black !m-0 !text-xs justify-start">
              Employee <span class="text-red-500">*</span>
            </legend>
            <select
              v-model="newAttendance.employeeName"
              class="select focus:outline-none bg-white border text-black input-sm"
              :class="{
                'border-red-500': formErrors.employeeName,
                'border-gray-200': !formErrors.employeeName,
              }"
              :disabled="!newAttendance.department || isLoading"
            >
              <option value="" disabled selected>
                {{ isLoading ? 'Loading employees...' : 'Select Employee' }}
              </option>
              <option
                v-for="emp in filteredEmployees"
                :key="emp.employee_id"
                :value="emp.full_name"
              >
                {{ emp.full_name }}
              </option>
            </select>
            <span v-if="formErrors.employeeName" class="text-red-500 text-xs mt-1">
              {{ formErrors.employeeName }}
            </span>
            <span
              v-if="newAttendance.department && !hasAvailableEmployees && !isLoading"
              class="text-yellow-600 text-xs mt-1"
            >
              No employees found in this department
            </span>
          </div>

          <!-- Sign In -->
          <div class="form-control">
            <legend class="fieldset-legend text-black !m-0 !text-xs justify-start">
              Time In <span class="text-red-500">*</span>
            </legend>
            <input
              v-model="newAttendance.signIn"
              type="time"
              class="input focus:outline-none bg-white border text-black input-sm"
              :class="{
                'border-red-500': formErrors.signIn,
                'border-gray-200': !formErrors.signIn,
              }"
            />
            <span v-if="formErrors.signIn" class="text-red-500 text-xs mt-1">
              {{ formErrors.signIn }}
            </span>
          </div>

          <!-- Sign Out -->
          <div class="form-control">
            <legend class="fieldset-legend text-black !m-0 !text-xs justify-start">
              Time Out <span class="text-red-500">*</span>
            </legend>
            <input
              v-model="newAttendance.signOut"
              type="time"
              class="input focus:outline-none bg-white border text-black input-sm"
              :class="{
                'border-red-500': formErrors.signOut,
                'border-gray-200': !formErrors.signOut,
              }"
            />
            <span v-if="formErrors.signOut" class="text-red-500 text-xs mt-1">
              {{ formErrors.signOut }}
            </span>
          </div>

          <!-- Date -->
          <div class="form-control">
            <legend class="fieldset-legend text-black !m-0 !text-xs justify-start">
              Date <span class="text-red-500">*</span>
            </legend>
            <input
              v-model="newAttendance.date"
              type="date"
              class="input focus:outline-none bg-white border text-black input-sm"
              :class="{
                'border-red-500': formErrors.date,
                'border-gray-200': !formErrors.date,
              }"
            />
            <span v-if="formErrors.date" class="text-red-500 text-xs mt-1">
              {{ formErrors.date }}
            </span>
          </div>

          <!-- Overtime -->
          <div v-if="newAttendance.signIn && newAttendance.signOut" class="form-control">
            <legend class="fieldset-legend text-black !m-0 !text-xs justify-start">
              Overtime Hours
            </legend>
            <div class="text-sm text-gray-600">
              {{ calculateOvertime(newAttendance.signIn, newAttendance.signOut) }} hours
            </div>
          </div>

          <!-- Overtime Proof -->
          <div class="form-control">
            <legend class="fieldset-legend text-black !m-0 !text-xs justify-start">
              Overtime Proof (if any)
            </legend>
            <input type="file" accept="image/*" @change="handleOTProof" />
            <div v-if="otProofPreview" class="mt-2">
              <img :src="otProofPreview" class="max-h-32 rounded border" />
            </div>
          </div>
        </fieldset>
      </div>
      <!-- Add transition wrapper around the error message -->
      <Transition name="fade">
        <div
          v-if="formErrors.general"
          class="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4"
        >
          {{ formErrors.general }}
        </div>
      </Transition>
      <div class="action-buttons flex justify-end mt-5">
        <button @click="handleSubmit" class="btn-primaryStyle" :disabled="isSubmitting">
          {{ isSubmitting ? 'Adding...' : 'Add Attendance' }}
        </button>
      </div>
      <div v-if="existingAttendance" class="flex justify-end mt-2">
        <button class="btn btn-warning" @click="handleManualReset" type="button">
          Reset Attendance for this Employee & Date
        </button>
      </div>
    </div>
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

.error-message {
  font-size: 0.875rem;
  transition: all 0.3s ease;
}

/* Optional animation for error message */
.error-message-enter-active,
.error-message-leave-active {
  transition:
    opacity 0.3s,
    transform 0.3s;
}

.error-message-enter-from,
.error-message-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Add these fade transition styles */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
