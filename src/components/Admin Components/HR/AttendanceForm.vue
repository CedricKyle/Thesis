<script setup>
import { useAttendanceForm } from '@/composables/Admin Composables/Human Resource/useAttendanceForm'

const props = defineProps({
  departments: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['submit', 'showConfirm'])

const { newAttendance, formErrors, validateForm } = useAttendanceForm()

const handleSubmit = () => {
  if (validateForm()) {
    emit('showConfirm', newAttendance.value)
  }
}
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
          <!-- Employee name -->
          <div class="form-control">
            <legend class="fieldset-legend text-black">Employee name</legend>
            <input
              v-model="newAttendance.employeeName"
              type="text"
              class="input focus:outline-none bg-white border text-black"
              :class="{
                'border-red-500': formErrors.employeeName,
                'border-gray-200': !formErrors.employeeName,
              }"
              placeholder="Enter employee name"
            />
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
              <option v-for="dept in departments" :key="dept" :value="dept">
                {{ dept }}
              </option>
            </select>
            <span v-if="formErrors.department" class="text-red-500 text-sm mt-1">
              {{ formErrors.department }}
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
</template>

<style scoped>
input[type='date']::-webkit-calendar-picker-indicator,
input[type='time']::-webkit-calendar-picker-indicator {
  filter: invert(0%) brightness(0%);
  cursor: pointer;
}

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
