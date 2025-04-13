<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'
import { useEmployeeValidation } from '@/composables/Admin Composables/Human Resource/useEmployeeValidation'
import { useProfileImage } from '@/composables/Admin Composables/Human Resource/useProfileImage'
import { Upload } from 'lucide-vue-next'
import profilePlaceholder from '@/assets/Images/profile-placeholder.png'
import NotificationModal from './NotificationModal.vue'
import { useRolesStore } from '@/stores/Users & Role/roleStore'
import { storeToRefs } from 'pinia'
import Toast from '@/components/Admin Components/HR/Toast.vue'

const store = useEmployeeStore()
const rolesStore = useRolesStore()
const { roles } = storeToRefs(rolesStore)
const { formErrors, validateProfessionalInfo, validatePersonalInfo, validateEmergencyContact } =
  useEmployeeValidation()
const { profileImage, showUploadText, handleProfileUpload, removeProfile } =
  useProfileImage(profilePlaceholder)

// Toast state
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// Form state
const newEmployee = ref({
  id: '',
  firstName: '',
  middleName: '',
  lastName: '',
  department: '',
  jobTitle: '',
  role: '',
  dateOfHire: '',
  dateOfBirth: '',
  gender: '',
  maritalStatus: '',
  contactNumber: '',
  email: '',
  address: '',
  emergencyContact: {
    firstName: '',
    middleName: '',
    lastName: '',
    relationship: '',
    contactNumber: '',
  },
  profileImage: '',
})

// Add this after other refs
const confirmModal = ref(null)
const employeeToAdd = ref(null)

//department jobs
const departmentJobs = {
  'HR Department': ['HR Manager'],
  'Finance Department': ['Accountant'],
  'Sales Department': ['Sales Manager'],
  'Customer Service Department': ['Customer Service Representative'],
  'Supply Chain Department': ['Supply Chain Manager'],
}

const availableJobs = computed(() => {
  if (!newEmployee.value.department) {
    return []
  }
  return departmentJobs[newEmployee.value.department] || []
})

watch(
  () => newEmployee.value.department,
  (newDepartment) => {
    //Reset job title when department changes
    newEmployee.value.jobTitle = ''
  },
)

// Watch for profile image changes
watch(profileImage, (newValue) => {
  newEmployee.value.profileImage = newValue
})

// Load roles on mount
onMounted(async () => {
  try {
    await rolesStore.fetchRoles()
  } catch (error) {
    toastMessage.value = 'Failed to load roles'
    toastType.value = 'error'
    showToast.value = true

    setTimeout(() => {
      showToast.value = false
    }, 3000)
  }
})

// Form submission
const handleFormSubmit = () => {
  // Validate all sections with the newEmployee value
  const isProfessionalValid = validateProfessionalInfo(newEmployee.value)
  const isPersonalValid = validatePersonalInfo(newEmployee.value)
  const isEmergencyValid = validateEmergencyContact(newEmployee.value)

  if (!isProfessionalValid || !isPersonalValid || !isEmergencyValid) {
    // Show error toast
    toastMessage.value = 'Please fill in all required fields correctly'
    toastType.value = 'error'
    showToast.value = true

    setTimeout(() => {
      showToast.value = false
    }, 3000)
    return
  }

  // Show confirmation modal
  employeeToAdd.value = { ...newEmployee.value }
  confirmModal.value?.showModal()
}

// Add confirmation handlers
const confirmAdd = () => {
  const hireYear = new Date(employeeToAdd.value.dateOfHire).getFullYear()

  // Use store's employees for ID generation
  const yearEmployees = store.employees
    .filter((emp) => emp.id.startsWith(hireYear.toString()))
    .map((emp) => parseInt(emp.id.split('-')[1]))

  const nextNumber = yearEmployees.length > 0 ? Math.max(...yearEmployees) + 1 : 50000

  const newId = `${hireYear}-${nextNumber.toString().padStart(5, '0')}`

  // Create full name from components
  const fullName = [
    employeeToAdd.value.firstName,
    employeeToAdd.value.middleName,
    employeeToAdd.value.lastName,
  ]
    .filter(Boolean)
    .join(' ')

  // Create emergency contact full name
  const emergencyContactFullName = [
    employeeToAdd.value.emergencyContact.firstName,
    employeeToAdd.value.emergencyContact.middleName,
    employeeToAdd.value.emergencyContact.lastName,
  ]
    .filter(Boolean)
    .join(' ')

  // Create new employee object with the generated ID
  const employeeData = {
    ...employeeToAdd.value,
    id: newId,
    fullName,
    emergencyContact: {
      ...employeeToAdd.value.emergencyContact,
      fullName: emergencyContactFullName,
    },
  }

  // Use store action to add employee
  store.addEmployee(employeeData)

  // Close modal
  confirmModal.value?.close()
  employeeToAdd.value = null

  // Show success toast
  toastMessage.value = 'Employee added successfully!'
  toastType.value = 'success'
  showToast.value = true

  setTimeout(() => {
    showToast.value = false
  }, 3000)

  resetForm()
}

const cancelAdd = () => {
  confirmModal.value?.close()
  employeeToAdd.value = null
}

// Update resetForm to also reset notification
const resetForm = () => {
  newEmployee.value = {
    id: '',
    firstName: '',
    middleName: '',
    lastName: '',
    department: '',
    jobTitle: '',
    role: '',
    dateOfHire: '',
    dateOfBirth: '',
    gender: '',
    maritalStatus: '',
    contactNumber: '',
    email: '',
    address: '',
    emergencyContact: {
      firstName: '',
      middleName: '',
      lastName: '',
      relationship: '',
      contactNumber: '',
    },
    profileImage: '',
  }
  removeProfile()
}
</script>

<template>
  <div class="flex gap-4 container h-[600px] text-black">
    <!-- Professional Information -->
    <div
      class="professional-container w-[30%] border border-gray-200 p-5 rounded-md shadow-md overflow-y-auto"
    >
      <div class="flex flex-col gap-4 m-5">
        <!-- Profile Selection -->
        <div class="profile-selection">
          <div class="avatar justify-center items-center flex flex-col gap-2">
            <div
              class="cursor-pointer ring-secondaryColor w-24 h-24 rounded-full ring ring-offset-2 relative group"
            >
              <!-- Profile Image -->
              <img
                :src="profileImage || profilePlaceholder"
                class="w-full h-full object-cover rounded-full"
              />

              <!-- Overlay for hover effects -->
              <div
                class="absolute inset-0 bg-gray-100 bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <label class="cursor-pointer w-full h-full flex items-center justify-center">
                  <input
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="handleProfileUpload"
                  />
                  <Upload class="w-6 h-6 text-secondaryColor" />
                </label>
              </div>

              <!-- Remove button if image exists -->
              <button
                v-if="profileImage"
                @click="removeProfile"
                class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
              >
                ×
              </button>
            </div>

            <!-- Upload text -->
            <div
              v-if="showUploadText"
              class="text-sm text-gray-500 h-10 w-full flex items-center justify-center"
            >
              <div class="flex justify-center gap-2">
                <p>Upload Profile</p>
                <Upload class="w-4 h-4 text-gray-500 cursor-pointer" />
              </div>
            </div>
          </div>
        </div>

        <div class="title font-bold text-md">Professional Information</div>

        <div class="form-control flex flex-col gap-5">
          <div class="">
            <legend class="fieldset-legend text-black text-xs">Department</legend>
            <select
              v-model="newEmployee.department"
              class="select focus:outline-none bg-white border-black text-black"
              :class="{ 'border-red-500': formErrors.professional.department }"
            >
              <option disabled value="">Select Department</option>
              <option>HR Department</option>
              <option>Finance Department</option>
              <option>Sales Department</option>
              <option>Customer Service Department</option>
              <option>Supply Chain Department</option>
            </select>
            <span v-if="formErrors.professional.department" class="text-red-500 text-xs mt-1">
              {{ formErrors.professional.department }}
            </span>
          </div>

          <div class="">
            <legend class="fieldset-legend text-black text-xs">Job Title</legend>
            <select
              v-model="newEmployee.jobTitle"
              class="select focus:outline-none bg-white border-black text-black"
              :class="{ 'border-red-500': formErrors.professional.jobTitle }"
              :disabled="!newEmployee.department"
            >
              <option disabled value="">Select Job Title</option>
              <option v-for="job in availableJobs" :key="job" :value="job">
                {{ job }}
              </option>
            </select>
            <span v-if="formErrors.professional.jobTitle" class="text-red-500 text-xs mt-1">
              {{ formErrors.professional.jobTitle }}
            </span>
          </div>

          <div class="">
            <legend class="fieldset-legend text-black text-xs">Role</legend>
            <select
              v-model="newEmployee.role"
              class="select focus:outline-none bg-white border-black text-black"
              :class="{ 'border-red-500': formErrors.professional.role }"
            >
              <option disabled value="">Select Role</option>
              <option v-for="role in roles" :key="role.id" :value="role.role_name">
                {{ role.role_name }}
              </option>
            </select>
            <span v-if="formErrors.professional.role" class="text-red-500 text-xs mt-1">
              {{ formErrors.professional.role }}
            </span>
          </div>

          <div class="">
            <legend class="fieldset-legend text-black text-xs">Date of Hire</legend>
            <input
              v-model="newEmployee.dateOfHire"
              type="date"
              class="border-b-1 w-full outline-none border-gray-300 p-0 pt-3 text-black"
              :class="{ 'border-red-500': formErrors.professional.dateOfHire }"
            />
            <span v-if="formErrors.professional.dateOfHire" class="text-red-500 text-xs mt-1">
              {{ formErrors.professional.dateOfHire }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Personal Information -->
    <div
      class="personal-container w-[70%] border border-gray-200 p-5 rounded-md shadow-md overflow-y-auto"
    >
      <div class="container flex flex-col gap-2">
        <div class="title font-bold text-md">Personal Information</div>
        <div
          class="divider m-0 before:bg-gray-200 after:bg-gray-200 before:h-[3px] after:h-[3px]"
        ></div>

        <div class="form-control grid grid-cols-2 gap-5">
          <div class="">
            <legend class="fieldset-legend text-black text-xs">First Name</legend>
            <input
              v-model="newEmployee.firstName"
              type="text"
              class="border-b-1 w-full outline-none border-gray-300 p-0 pt-3 text-black"
              :class="{ 'border-red-500': formErrors.personal.firstName }"
            />
            <span v-if="formErrors.personal.firstName" class="text-red-500 text-xs mt-1">
              {{ formErrors.personal.firstName }}
            </span>
          </div>

          <div class="">
            <legend class="fieldset-legend text-black text-xs">Middle Name</legend>
            <input
              v-model="newEmployee.middleName"
              type="text"
              placeholder="(Optional)"
              class="border-b-1 w-full outline-none border-gray-300 p-0 pt-3 text-black placeholder:text-xs"
              :class="{ 'border-red-500': formErrors.personal.middleName }"
            />
            <span v-if="formErrors.personal.middleName" class="text-red-500 text-xs mt-1">
              {{ formErrors.personal.middleName }}
            </span>
          </div>

          <div class="col-span-2">
            <legend class="fieldset-legend text-black text-xs">Last Name</legend>
            <input
              v-model="newEmployee.lastName"
              type="text"
              class="border-b-1 w-full outline-none border-gray-300 p-0 pt-3 text-black"
              :class="{ 'border-red-500': formErrors.personal.lastName }"
            />
            <span v-if="formErrors.personal.fullName" class="text-red-500 text-xs mt-1">
              {{ formErrors.personal.fullName }}
            </span>
          </div>

          <div class="">
            <legend class="fieldset-legend text-black text-xs">Date of Birth</legend>
            <input
              v-model="newEmployee.dateOfBirth"
              type="date"
              class="border-b-1 w-full outline-none border-gray-300 p-0 pt-3 text-black"
              :class="{ 'border-red-500': formErrors.personal.dateOfBirth }"
            />
            <span v-if="formErrors.personal.dateOfBirth" class="text-red-500 text-xs mt-1">
              {{ formErrors.personal.dateOfBirth }}
            </span>
          </div>

          <div class="">
            <legend class="fieldset-legend text-black text-xs">Gender</legend>
            <select
              v-model="newEmployee.gender"
              class="select focus:outline-none bg-white border-black text-black"
              :class="{ 'border-red-500': formErrors.personal.gender }"
            >
              <option disabled value="">Select Gender</option>
              <option>Male</option>
              <option>Female</option>
            </select>
            <span v-if="formErrors.personal.gender" class="text-red-500 text-xs mt-1">
              {{ formErrors.personal.gender }}
            </span>
          </div>

          <div class="">
            <legend class="fieldset-legend text-black text-xs">Contact Number</legend>
            <input
              v-model="newEmployee.contactNumber"
              type="text"
              placeholder="09xxxxxxxxx"
              maxlength="11"
              class="border-b-1 w-full outline-none border-gray-300 p-0 pt-3 text-black"
              :class="{ 'border-red-500': formErrors.personal.contactNumber }"
            />
            <span v-if="formErrors.personal.contactNumber" class="text-red-500 text-xs mt-1">
              {{ formErrors.personal.contactNumber }}
            </span>
          </div>

          <div class="">
            <legend class="fieldset-legend text-black text-xs">Email Address</legend>
            <input
              v-model="newEmployee.email"
              type="email"
              placeholder=""
              class="border-b-1 w-full outline-none border-gray-300 p-0 pt-3 text-black"
              :class="{ 'border-red-500': formErrors.personal.email }"
            />
            <span v-if="formErrors.personal.email" class="text-red-500 text-xs mt-1">
              {{ formErrors.personal.email }}
            </span>
          </div>

          <div class="col-span-2">
            <legend class="fieldset-legend text-black text-xs">Address</legend>
            <input
              v-model="newEmployee.address"
              type="text"
              class="border-b-1 w-full outline-none border-gray-300 p-0 pt-3 text-black"
              :class="{ 'border-red-500': formErrors.personal.address }"
            />
            <span v-if="formErrors.personal.address" class="text-red-500 text-xs mt-1">
              {{ formErrors.personal.address }}
            </span>
          </div>
        </div>

        <div class="title font-bold mt-4 text-red-500">Emergency Contact</div>
        <div class="form-control grid grid-cols-2 gap-5">
          <div class="">
            <legend class="fieldset-legend text-black text-xs">First Name</legend>
            <input
              v-model="newEmployee.emergencyContact.firstName"
              type="text"
              class="border-b-1 w-full outline-none border-gray-300 p-0 pt-3 text-black"
              :class="{ 'border-red-500': formErrors.emergencyContact.firstName }"
            />
            <span v-if="formErrors.emergencyContact.firstName" class="text-red-500 text-xs mt-1">
              {{ formErrors.emergencyContact.firstName }}
            </span>
          </div>

          <div class="">
            <legend class="fieldset-legend text-black text-xs">Middle Name</legend>
            <input
              v-model="newEmployee.emergencyContact.middleName"
              type="text"
              placeholder="(Optional)"
              class="border-b-1 w-full outline-none border-gray-300 p-0 pt-3 text-black placeholder:text-xs"
              :class="{ 'border-red-500': formErrors.emergencyContact.middleName }"
            />
            <span v-if="formErrors.emergencyContact.middleName" class="text-red-500 text-xs mt-1">
              {{ formErrors.emergencyContact.middleName }}
            </span>
          </div>

          <div class="col-span-2">
            <legend class="fieldset-legend text-black text-xs">Last Name</legend>
            <input
              v-model="newEmployee.emergencyContact.lastName"
              type="text"
              class="border-b-1 w-full outline-none border-gray-300 p-0 pt-3 text-black"
              :class="{ 'border-red-500': formErrors.emergencyContact.lastName }"
            />
            <span v-if="formErrors.emergencyContact.lastName" class="text-red-500 text-xs mt-1">
              {{ formErrors.emergencyContact.lastName }}
            </span>
          </div>

          <div class="">
            <legend class="fieldset-legend text-black text-xs">Relationship</legend>
            <input
              v-model="newEmployee.emergencyContact.relationship"
              type="text"
              class="border-b-1 w-full outline-none border-gray-300 p-0 pt-3 text-black"
              :class="{ 'border-red-500': formErrors.emergencyContact.relationship }"
            />
            <span v-if="formErrors.emergencyContact.relationship" class="text-red-500 text-xs mt-1">
              {{ formErrors.emergencyContact.relationship }}
            </span>
          </div>

          <div class="">
            <legend class="fieldset-legend text-black text-xs">Contact Number</legend>
            <input
              v-model="newEmployee.emergencyContact.contactNumber"
              type="text"
              placeholder="09xxxxxxxxx"
              maxlength="11"
              class="border-b-1 w-full outline-none border-gray-300 p-0 pt-3 text-black"
              :class="{ 'border-red-500': formErrors.emergencyContact.contactNumber }"
            />
            <span
              v-if="formErrors.emergencyContact.contactNumber"
              class="text-red-500 text-xs mt-1"
            >
              {{ formErrors.emergencyContact.contactNumber }}
            </span>
          </div>
        </div>

        <!-- Form Buttons -->
        <div class="btn-container flex justify-end mt-6 gap-2">
          <button
            @click="handleFormSubmit"
            class="btn-primaryStyle btn-sm bg-primaryColor border-none text-white shadow-none"
          >
            + Add
          </button>
          <button
            @click="resetForm"
            class="btn-secondaryStyle btn-sm bg-gray-400 border-none text-white shadow-none"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <dialog ref="confirmModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-lg text-black">Confirm Add Employee</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>

        <div v-if="employeeToAdd" class="py-4">
          <p class="text-center text-black mb-4">
            Are you sure you want to add employee
            <span class="font-bold">{{
              [employeeToAdd.firstName, employeeToAdd.middleName, employeeToAdd.lastName]
                .filter(Boolean)
                .join(' ')
            }}</span
            >?
          </p>

          <div class="mt-4 flex flex-col gap-2">
            <div class="flex flex-row">
              <div class="w-32 text-gray-500">Department:</div>
              <div class="text-black">{{ employeeToAdd.department }}</div>
            </div>
            <div class="flex flex-row">
              <div class="w-32 text-gray-500">Job Title:</div>
              <div class="text-black">{{ employeeToAdd.jobTitle }}</div>
            </div>
            <div class="flex flex-row">
              <div class="w-32 text-gray-500">Role:</div>
              <div class="text-black">{{ employeeToAdd.role }}</div>
            </div>
          </div>
        </div>

        <div class="modal-action justify-center gap-4">
          <button class="btn-primaryStyle" @click="confirmAdd">Add Employee</button>
          <button class="btn-secondaryStyle" @click="cancelAdd">Cancel</button>
        </div>
      </div>
    </dialog>

    <!-- Replace NotificationModal with Toast -->
    <Toast :show="showToast" :message="toastMessage" :type="toastType" />
  </div>
</template>
