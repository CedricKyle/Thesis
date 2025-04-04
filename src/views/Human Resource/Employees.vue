<script setup>
import EmployeeList from '@/components/Admin Components/HR/Employee/EmployeeList.vue'
import EmployeeForm from '@/components/Admin Components/HR/Employee/EmployeeForm.vue'
import EmployeeView from '@/components/Admin Components/HR/Employee/EmployeeView.vue'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'

const store = useEmployeeStore()
</script>

<template>
  <div class="employees-container">
    <div class="tabs tabs-border bg-primaryColor max-h-[600px] shadow-md">
      <!-- Employee List Tab -->
      <input
        type="radio"
        name="my_tabs_2"
        class="tab"
        aria-label="Employee List"
        checked="checked"
      />
      <div class="tab-content bg-white p-2">
        <EmployeeList />
      </div>

      <!-- Add Employee Tab -->
      <input type="radio" name="my_tabs_2" class="tab" aria-label="Add Employee" />
      <div class="tab-content bg-white p-5">
        <EmployeeForm />
      </div>
    </div>

    <!-- Employee View Modal -->
    <EmployeeView
      v-if="store.selectedEmployee"
      :show="store.showViewModal"
      @close="store.closeViewModal"
    />
  </div>
</template>

<style scoped>
input[type='date']::-webkit-calendar-picker-indicator,
input[type='time']::-webkit-calendar-picker-indicator {
  filter: invert(0%) brightness(0%);
  cursor: pointer;
}

.group:hover .group-hover\:opacity-100 {
  opacity: 1;
}

.transition-opacity {
  transition: opacity 0.3s ease;
}
</style>
