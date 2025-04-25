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

// Updated emergency contact computed properties
const hasEmergencyContact = computed(() => {
  const emergencyContact = store.selectedEmployee?.emergency_contact
  console.log('Raw emergency contact data:', JSON.parse(JSON.stringify(emergencyContact)))
  // Check if the emergency contact object has the required properties
  return !!emergencyContact && !!emergencyContact.first_name && !!emergencyContact.last_name
})

const emergencyContact = computed(() => {
  if (!hasEmergencyContact.value) return null
  const contact = store.selectedEmployee.emergency_contact
  console.log('Processed emergency contact data:', JSON.parse(JSON.stringify(contact)))
  return {
    first_name: contact.first_name,
    middle_name: contact.middle_name || 'N/A',
    last_name: contact.last_name,
    full_name: `${contact.first_name} ${contact.middle_name || ''} ${contact.last_name}`.trim(),
    relationship: contact.relationship || 'Not specified',
    contact_number: contact.contact_number || 'Not provided',
  }
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

// Add handleCall method with safety checks
const handleCall = (phoneNumber) => {
  if (phoneNumber && phoneNumber.trim() && phoneNumber !== 'Not provided') {
    window.open(`tel:${phoneNumber.trim()}`, '_self')
  }
}

const handleViewResume = () => {
  if (resumeUrl.value) {
    window.open(resumeUrl.value, '_blank')
  }
}

// Format display date
const formatDisplayDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
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
              <div>{{ formatDisplayDate(store.selectedEmployee.date_of_hire) }}</div>
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
              <div>{{ formatDisplayDate(store.selectedEmployee.date_of_birth) }}</div>
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

        <!-- Updated Emergency Contact Section -->
        <div class="text-sm">
          <h4 class="font-semibold text-primaryColor flex items-center gap-2">
            Emergency Contact
            <span class="text-red-500 text-xs">(In case of emergency)</span>
          </h4>

          <div class="bg-gray-50 p-4 rounded-lg mt-2">
            <div v-if="store.loading" class="text-center text-gray-500 py-2">
              Loading emergency contact information...
            </div>

            <div v-else-if="hasEmergencyContact" class="grid gap-1">
              <!-- Name Information -->

              <div class="flex">
                <div class="w-40 text-gray-500">Full Name</div>
                <div class="text-black">
                  {{ emergencyContact.full_name }}
                </div>
              </div>

              <!-- Contact Information -->
              <div class="flex">
                <div class="w-40 text-gray-500">Relationship</div>
                <div class="text-black">
                  {{ emergencyContact.relationship }}
                </div>
              </div>

              <div class="flex">
                <div class="w-40 text-gray-500">Contact Number</div>
                <div class="flex items-center gap-2">
                  <span class="text-black">
                    {{ emergencyContact.contact_number }}
                  </span>
                  <button
                    v-if="
                      emergencyContact.contact_number &&
                      emergencyContact.contact_number !== 'Not provided'
                    "
                    class="underline text-secondaryColor cursor-pointer text-xs hover:text-secondaryColor/80"
                    @click="handleCall(emergencyContact.contact_number)"
                  >
                    Call
                  </button>
                </div>
              </div>
            </div>

            <!-- Show message if no emergency contact -->
            <div v-else class="text-center text-gray-500 py-2">
              No emergency contact information available.
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

/* Add styles for emergency contact section */
.emergency-contact-section {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.emergency-contact-section:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
</style>
