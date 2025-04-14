<script setup>
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'
import profilePlaceholder from '@/assets/Images/profile-placeholder.png'
import { computed } from 'vue'
import { File } from 'lucide-vue-next'

const store = useEmployeeStore()

// Simplified computed property for profile image
const profileImageUrl = computed(() => {
  if (!store.selectedEmployee?.profile_image_path) return profilePlaceholder
  return `http://localhost:3000/${store.selectedEmployee.profile_image_path}`
})

const resumeUrl = computed(() => {
  if (!store.selectedEmployee?.resume_path) return null
  return `http://localhost:3000/${store.selectedEmployee.resume_path}`
})

// Format date helper
const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Add handleCall method
const handleCall = (phoneNumber) => {
  if (phoneNumber) {
    window.open(`tel:${phoneNumber}`, '_self')
  }
}

const handleViewResume = () => {
  if (resumeUrl.value) {
    window.open(resumeUrl.value, '_blank')
  }
}

// No need for the computed emergency contact property since we're getting direct data
</script>

<template>
  <dialog :open="store.showViewModal" class="modal">
    <div class="modal-box bg-white text-black">
      <h3 class="font-bold text-md">Employee Details</h3>
      <div
        class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
      ></div>

      <div v-if="store.selectedEmployee" class="pt-4 flex flex-col gap-2">
        <!-- Employee Image -->
        <div class="flex justify-center mb-4 flex-col items-center">
          <div class="w-24 h-24 rounded-full overflow-hidden ring ring-secondaryColor">
            <img
              :src="profileImageUrl"
              class="w-full h-full object-cover"
              alt="Profile"
              @error="$event.target.src = profilePlaceholder"
              loading="lazy"
            />
          </div>
          <div class="name-container text-center">
            <h3 class="font-bold text-lg">{{ store.selectedEmployee.full_name }}</h3>
            <p class="badge badge-outline badge-warning mt-1 text-xs">
              {{ store.selectedEmployee.job_title }}
            </p>
            <br />
            <span class="text-gray-500 text-xs">
              {{ store.selectedEmployee.role }}
            </span>
          </div>
        </div>

        <!-- Professional Information -->
        <div class="mb-4 text-sm">
          <h4 class="font-semibold mb-2 text-primaryColor">Professional Information</h4>
          <div class="grid gap-2 bg-gray-50 p-3 rounded-lg">
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">Employee ID</div>
              <div>{{ store.selectedEmployee.employee_id }}</div>
            </div>
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">Department</div>
              <div>{{ store.selectedEmployee.department }}</div>
            </div>
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">Date of Hire</div>
              <div>{{ formatDate(store.selectedEmployee.date_of_hire) }}</div>
            </div>

            <!-- Add resume button/link -->
            <div v-if="store.selectedEmployee?.resume_path" class="flex flex-row">
              <div class="w-40 text-gray-500">Resume</div>
              <div class="">
                <button
                  @click="handleViewResume"
                  class="badge badge-outline badge-warning mt-1 text-xs cursor-pointer"
                >
                  <File class="w-4 h-4" />
                  View Resume
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Personal Information -->
        <div class="mb-4 text-sm">
          <h4 class="font-semibold mb-2 text-primaryColor">Personal Information</h4>
          <div class="grid gap-2 bg-gray-50 p-3 rounded-lg">
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">Full Name</div>
              <div>{{ store.selectedEmployee.full_name }}</div>
            </div>
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">Date of Birth</div>
              <div>{{ formatDate(store.selectedEmployee.date_of_birth) }}</div>
            </div>
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">Gender</div>
              <div>{{ store.selectedEmployee.gender }}</div>
            </div>
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">Contact Number</div>
              <div>{{ store.selectedEmployee.contact_number }}</div>
            </div>
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">Email</div>
              <div>{{ store.selectedEmployee.email }}</div>
            </div>
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">Address</div>
              <div class="break-words">{{ store.selectedEmployee.address }}</div>
            </div>
          </div>
        </div>

        <!-- Emergency Contact Section -->
        <div class="text-sm">
          <h4 class="font-semibold text-primaryColor flex items-center gap-2">
            Emergency Contact
            <span class="text-red-500 text-xs">(In case of emergency)</span>
          </h4>

          <div class="bg-gray-50 p-4 rounded-lg mt-2">
            <div class="grid gap-1">
              <!-- Name Information -->
              <div class="flex">
                <div class="w-40 text-gray-500">First Name</div>
                <div class="text-black">
                  {{ store.selectedEmployee?.emergencyContact?.firstName }}
                </div>
              </div>

              <div class="flex">
                <div class="w-40 text-gray-500">Middle Name</div>
                <div class="text-black">
                  {{ store.selectedEmployee?.emergencyContact?.middleName || 'N/A' }}
                </div>
              </div>

              <div class="flex">
                <div class="w-40 text-gray-500">Last Name</div>
                <div class="text-black">
                  {{ store.selectedEmployee?.emergencyContact?.lastName }}
                </div>
              </div>

              <div class="flex">
                <div class="w-40 text-gray-500">Full Name</div>
                <div class="text-black">
                  {{ store.selectedEmployee?.emergencyContact?.fullName }}
                </div>
              </div>

              <!-- Empty line for spacing -->
              <div class="h-2"></div>

              <!-- Contact Information -->
              <div class="flex">
                <div class="w-40 text-gray-500">Relationship</div>
                <div class="text-black">
                  {{ store.selectedEmployee?.emergencyContact?.relationship }}
                </div>
              </div>

              <div class="flex">
                <div class="w-40 text-gray-500">Contact Number</div>
                <div class="flex items-center gap-2">
                  <span class="text-black">{{
                    store.selectedEmployee?.emergencyContact?.contactNumber
                  }}</span>
                  <button
                    class="underline text-secondaryColor cursor-pointer text-xs hover:text-secondaryColor/80"
                    @click="handleCall(store.selectedEmployee?.emergencyContact?.contactNumber)"
                  >
                    Call
                  </button>
                </div>
              </div>
            </div>

            <!-- Note text -->
            <div class="mt-4 text-gray-500 italic text-xs">
              Please ensure emergency contact information is kept up to date.
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="modal-action flex gap-2">
        <button class="btn-primaryStyle" @click="store.closeViewModal">Close</button>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.modal-box {
  max-height: 90vh;
  overflow-y: auto;
}

.modal-box::-webkit-scrollbar {
  width: 6px;
}

.modal-box::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.modal-box::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.modal-box::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Add smooth transitions */
.modal-box {
  transition: all 0.3s ease;
}

/* Add hover effects to interactive elements */
.btn:hover {
  transform: translateY(-1px);
  transition: transform 0.2s ease;
}
</style>
