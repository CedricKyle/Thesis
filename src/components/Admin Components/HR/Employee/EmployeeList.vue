<script setup>
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'
import { Eye } from 'lucide-vue-next'
import EmployeeView from './EmployeeView.vue'

const store = useEmployeeStore()
</script>

<template>
  <div class="flex flex-col gap-8 mt-4">
    <!-- search container -->
    <label class="input bg-white border-primaryColor text-black !outline-none">
      <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <g
          stroke-linejoin="round"
          stroke-linecap="round"
          stroke-width="2.5"
          fill="none"
          stroke="currentColor"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.3-4.3"></path>
        </g>
      </svg>
      <input v-model="store.searchQuery" type="search" required placeholder="Search" class="" />
    </label>

    <!-- table container -->
    <div class="overflow-x-auto border shadow-lg">
      <table class="table text-black">
        <!-- head -->
        <thead class="bg-primaryColor text-white">
          <tr>
            <th @click="store.handleSort('id')" class="cursor-pointer">
              Employee ID
              <span v-if="store.sortBy === 'id'" class="ml-1">
                {{ store.sortDesc ? '↓' : '↑' }}
              </span>
            </th>
            <th @click="store.handleSort('fullName')" class="cursor-pointer">
              Full Name
              <span v-if="store.sortBy === 'fullName'" class="ml-1">
                {{ store.sortDesc ? '↓' : '↑' }}
              </span>
            </th>
            <th>Department</th>
            <th>Job Title</th>
            <th>Email Address</th>
            <th>Contact Number</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <!-- Show when no employees or no search results -->
          <tr v-if="store.paginatedEmployees.length === 0">
            <td colspan="7" class="text-center py-4 text-black">
              {{ store.searchQuery ? 'No matching records found' : 'No employees available' }}
            </td>
          </tr>
          <tr
            v-for="employee in store.paginatedEmployees"
            :key="employee.id"
            class="hover:bg-gray-100 bg-white border-b border-gray-200"
          >
            <th>{{ employee.id }}</th>
            <td>{{ employee.fullName }}</td>
            <td>{{ employee.department }}</td>
            <td>{{ employee.jobTitle }}</td>
            <td>{{ employee.email }}</td>
            <td>{{ employee.contactNumber }}</td>
            <td class="flex gap-2">
              <button
                class="btn btn-sm btn-circle btn-ghost"
                @click="store.setSelectedEmployee(employee)"
              >
                <Eye class="w-4 h-4" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="flex justify-center gap-2">
      <button
        v-for="page in store.totalPages"
        :key="page"
        @click="store.currentPage = page"
        class="btn btn-sm"
        :class="store.currentPage === page ? 'bg-primaryColor text-white' : 'bg-gray-200'"
      >
        {{ page }}
      </button>
    </div>

    <!-- Add EmployeeView component at the end -->
    <EmployeeView />
  </div>
</template>
