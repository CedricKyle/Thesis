<template>
    <div class="payroll-form">
      <h3 class="text-xl font-semibold">Payroll Form</h3>
  
      <div class="grid grid-cols-2 gap-4 mt-4">
        <div>
          <label for="id-no">ID No:</label>
          <input v-model="payrollData.idNo" type="text" id="id-no" class="input input-bordered w-full" />
        </div>
  
        <div>
          <label for="emp-no">Employee No:</label>
          <input v-model="payrollData.employeeNo" type="text" id="emp-no" class="input input-bordered w-full" />
        </div>
  
        <div>
          <label for="salary-method">Salary Method:</label>
          <select v-model="payrollData.salaryMethod" class="select select-bordered w-full">
            <option>Option</option>
            <option>Hourly</option>
            <option>Salary</option>
          </select>
        </div>
  
        <div>
          <label for="attendance">Attendance:</label>
          <input v-model="payrollData.attendance" type="checkbox" id="attendance" class="checkbox" />
        </div>
  
        <div>
          <label for="rate">Rate:</label>
          <input v-model="payrollData.rate" type="number" id="rate" class="input input-bordered w-full" />
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  
  const payrollData = ref({
    idNo: '',
    employeeNo: '',
    salaryMethod: '',
    attendance: false,
    rate: '',
  })
  </script>
  
  