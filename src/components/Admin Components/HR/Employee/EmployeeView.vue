<script setup>
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'
import profilePlaceholder from '@/assets/Images/profile-placeholder.png'

const store = useEmployeeStore()
</script>

<template>
  <dialog :open="store.showViewModal" class="modal">
    <div class="modal-box bg-white text-black">
      <h3 class="font-bold text-lg">Employee Details</h3>
      <div
        class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
      ></div>

      <div v-if="store.selectedEmployee" class="pt-4 flex flex-col gap-2">
        <!-- Employee Image -->
        <div class="flex justify-center mb-4">
          <div class="w-24 h-24 rounded-full overflow-hidden">
            <img
              :src="store.selectedEmployee.profileImage || profilePlaceholder"
              class="w-full h-full object-cover"
            />
          </div>
        </div>

        <!-- Professional Information -->
        <div class="mb-4">
          <h4 class="font-semibold mb-2">Professional Information</h4>
          <div class="flex flex-row">
            <div class="w-40 text-gray-500">Employee ID</div>
            <div>{{ store.selectedEmployee.id }}</div>
          </div>
          <div class="flex flex-row">
            <div class="w-40 text-gray-500">Department</div>
            <div>{{ store.selectedEmployee.department }}</div>
          </div>
          <div class="flex flex-row">
            <div class="w-40 text-gray-500">Job Title</div>
            <div>{{ store.selectedEmployee.jobTitle }}</div>
          </div>
          <div class="flex flex-row">
            <div class="w-40 text-gray-500">Date of Hire</div>
            <div>{{ store.selectedEmployee.dateOfHire }}</div>
          </div>
        </div>

        <!-- Personal Information -->
        <div class="mb-4">
          <h4 class="font-semibold mb-2">Personal Information</h4>
          <div class="flex flex-row">
            <div class="w-40 text-gray-500">Full Name</div>
            <div>{{ store.selectedEmployee.fullName }}</div>
          </div>
          <div class="flex flex-row">
            <div class="w-40 text-gray-500">Date of Birth</div>
            <div>{{ store.selectedEmployee.dateOfBirth }}</div>
          </div>
          <div class="flex flex-row">
            <div class="w-40 text-gray-500">Gender</div>
            <div>{{ store.selectedEmployee.gender }}</div>
          </div>
          <div class="flex flex-row">
            <div class="w-40 text-gray-500">Marital Status</div>
            <div>{{ store.selectedEmployee.maritalStatus }}</div>
          </div>
          <div class="flex flex-row">
            <div class="w-40 text-gray-500">Contact Number</div>
            <div>{{ store.selectedEmployee.contactNumber }}</div>
          </div>
          <div class="flex flex-row">
            <div class="w-40 text-gray-500">Email</div>
            <div>{{ store.selectedEmployee.email }}</div>
          </div>
          <div class="flex flex-row">
            <div class="w-40 text-gray-500">Address</div>
            <div>{{ store.selectedEmployee.address }}</div>
          </div>
        </div>

        <!-- Emergency Contact -->
        <div>
          <h4 class="font-semibold mb-2">Emergency Contact</h4>
          <div class="flex flex-row">
            <div class="w-40 text-gray-500">Full Name</div>
            <div>{{ store.selectedEmployee.emergencyContact.fullName }}</div>
          </div>
          <div class="flex flex-row">
            <div class="w-40 text-gray-500">Contact Number</div>
            <div>{{ store.selectedEmployee.emergencyContact.contactNumber }}</div>
          </div>
        </div>
      </div>

      <div class="modal-action">
        <button
          class="btn bg-gray-200 text-gray-600 border-none shadow-none"
          @click="store.closeViewModal"
        >
          Close
        </button>
      </div>
    </div>
  </dialog>
</template>
