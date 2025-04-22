<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'
import { useEmployeeValidation } from '@/composables/Admin Composables/Human Resource/useEmployeeValidation'
import { useProfileImage } from '@/composables/Admin Composables/Human Resource/useProfileImage'
import { Upload } from 'lucide-vue-next'
import profilePlaceholder from '@/assets/Images/profile-placeholder.png'
import { useRolesStore } from '@/stores/Users & Role/roleStore'
import { storeToRefs } from 'pinia'
import Toast from '@/components/Admin Components/HR/Toast.vue'
import { useResumeUpload } from '@/composables/Admin Composables/Human Resource/useResumeUpload'
import { useToast } from '@/composables/Admin Composables/Human Resource/useToast'
import { useRoute } from 'vue-router'

// Store and composable setup
const store = useEmployeeStore()
const rolesStore = useRolesStore()
const { roles } = storeToRefs(rolesStore)
const { formErrors, validateProfessionalInfo, validatePersonalInfo, validateEmergencyContact } =
  useEmployeeValidation()
const { profileImage, profileImageFile, showUploadText, handleProfileUpload, removeProfile } =
  useProfileImage(profilePlaceholder)
const { showToast, toastMessage, toastType, showToastMessage } = useToast()
const { resumeFile, resumeFileName, isProcessing, handleResumeUpload, removeResume } =
  useResumeUpload(showToastMessage)
const route = useRoute()

// UI state
const confirmModal = ref(null)
const employeeToAdd = ref(null)

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
  resume: null,
})

const departmentJobs = {
  'HR Department': ['HR Manager'],
  'Finance Department': ['Accountant'],
  'Sales Department': ['Sales Manager'],
  'Customer Service Department': ['Customer Service Representative'],
  'Supply Chain Department': ['Supply Chain Manager'],
  // Add any other department-job combinations that might exist in your data
}

const availableJobs = computed(() => {
  // If Admin Department is selected, return empty array (no job titles needed)
  if (newEmployee.value.department === 'Admin Department') {
    return []
  }

  // For other departments, keep existing logic
  if (!newEmployee.value.department) return []
  const jobs = departmentJobs[newEmployee.value.department] || []
  if (newEmployee.value.jobTitle && !jobs.includes(newEmployee.value.jobTitle)) {
    jobs.push(newEmployee.value.jobTitle)
  }
  return jobs
})

// Add this computed property in the script setup
const departments = computed(() => {
  // Check if we're on the admin route
  const isAdminRoute = route.path.startsWith('/admin')

  // Base departments
  const baseDepartments = [
    'HR Department',
    'Finance Department',
    'Sales Department',
    'Customer Service Department',
    'Supply Chain Department',
  ]

  // If we're on the admin route, include Admin Department
  return isAdminRoute ? ['Admin Department', ...baseDepartments] : baseDepartments
})

// Watchers
watch(
  () => newEmployee.value.department,
  (newDepartment, oldDepartment) => {
    // Only clear job title if this is a user change, not initial data load
    if (oldDepartment !== undefined) {
      newEmployee.value.jobTitle = ''
    }
  },
)

watch(profileImage, (newValue) => {
  // We don't need to store the base64 in newEmployee anymore
  // newEmployee.value.profileImage = newValue
})

watch(resumeFile, (newValue) => {
  newEmployee.value.resume = newValue
})

// Add these props
const props = defineProps({
  initialData: {
    type: Object,
    default: null,
  },
  isEditing: {
    type: Boolean,
    default: false,
  },
})

// Add this emit definition
const emit = defineEmits(['submit'])

// Add this helper function at the top of the script section
const formatDateForInput = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toISOString().split('T')[0] // This will return 'YYYY-MM-DD'
}

// Form submission handlers
const handleFormSubmit = () => {
  const isProfessionalValid = validateProfessionalInfo(newEmployee.value)
  const isPersonalValid = validatePersonalInfo(newEmployee.value)
  const isEmergencyValid = validateEmergencyContact(newEmployee.value)

  if (!isProfessionalValid || !isPersonalValid || !isEmergencyValid) {
    showToastMessage('Please fill in all required fields correctly', 'error')
    return
  }

  if (props.isEditing) {
    const formData = createEmployeeUpdateData(newEmployee.value)

    // Debug log to verify data before emitting
    console.log('FormData before emit:')
    for (let [key, value] of formData.entries()) {
      console.log(key, value instanceof File ? value.name : value)
    }

    emit('submit', formData)
  } else {
    employeeToAdd.value = { ...newEmployee.value }
    confirmModal.value?.showModal()
  }
}

const confirmAdd = async () => {
  try {
    const employeeData = createEmployeeData(employeeToAdd.value)
    const response = await store.createEmployee(employeeData)
    confirmModal.value?.close()
    employeeToAdd.value = null

    // Create a formatted credentials message
    const credentialsMessage = `
Employee added successfully!

Login Credentials:
Employee ID: ${response.employeeId}
Default Password: countryside123

Please provide these credentials to the employee.
Note: Employee will be required to change password on first login.`

    // Show success message with credentials
    showToastMessage(credentialsMessage, 'success')

    resetForm()
  } catch (error) {
    console.error('Error adding employee:', error)
    showToastMessage(error.message || 'Error adding employee', 'error')
  }
}

const createEmployeeData = (employee) => {
  // Get hire year from dateOfHire
  const hireYear = new Date(employee.dateOfHire).getFullYear()

  // Create FormData for handling file uploads
  const formData = new FormData()

  // Generate Employee ID: Format will be YYYY-XXXXX (e.g., 2024-00001)
  const yearEmployees = store.employees
    .filter((emp) => String(emp.id).startsWith(String(hireYear)))
    .map((emp) => parseInt(emp.id.split('-')[1]))

  const nextNumber = yearEmployees.length > 0 ? Math.max(...yearEmployees) + 1 : 1
  const employeeId = `${hireYear}-${nextNumber.toString().padStart(5, '0')}`

  // Create the employee object
  const employeeData = {
    id: employeeId,
    employee_id: employeeId, // This will be used as the login username
    password: 'countryside123', // Default password
    firstName: employee.firstName,
    middleName: employee.middleName || '',
    lastName: employee.lastName,
    fullName: [employee.firstName, employee.middleName, employee.lastName]
      .filter(Boolean)
      .join(' '),
    department: employee.department,
    // Only include jobTitle if not Admin Department
    ...(employee.department !== 'Admin Department' && { jobTitle: employee.jobTitle }),
    role: employee.role,
    dateOfHire: employee.dateOfHire,
    dateOfBirth: employee.dateOfBirth,
    gender: employee.gender,
    contactNumber: employee.contactNumber,
    email: employee.email,
    address: employee.address,
    isFirstLogin: true, // Flag to force password change on first login
    emergencyContact: {
      firstName: employee.emergencyContact.firstName,
      middleName: employee.emergencyContact.middleName || '',
      lastName: employee.emergencyContact.lastName,
      relationship: employee.emergencyContact.relationship,
      contactNumber: employee.emergencyContact.contactNumber,
      fullName: [
        employee.emergencyContact.firstName,
        employee.emergencyContact.middleName,
        employee.emergencyContact.lastName,
      ]
        .filter(Boolean)
        .join(' '),
    },
  }

  // Append the stringified employee data
  formData.append('employeeData', JSON.stringify(employeeData))

  // Add files if they exist
  if (profileImageFile.value) {
    formData.append('profileImage', profileImageFile.value)
  }
  if (resumeFile.value) {
    formData.append('resume', resumeFile.value)
  }

  return formData
}

const createEmployeeUpdateData = (employee) => {
  const formData = new FormData()

  // Get existing data from props.initialData
  const existingData = props.initialData

  // For emergency contact, start with existing data and only override fields that have new values
  const emergencyContact = {
    first_name: existingData.emergency_contact?.first_name || '',
    middle_name: existingData.emergency_contact?.middle_name || '',
    last_name: existingData.emergency_contact?.last_name || '',
    relationship: existingData.emergency_contact?.relationship || '',
    contact_number: existingData.emergency_contact?.contact_number || '',
  }

  // Only update emergency contact fields that have been changed
  if (employee.emergencyContact.firstName.trim()) {
    emergencyContact.first_name = employee.emergencyContact.firstName
  }
  if (employee.emergencyContact.middleName.trim()) {
    emergencyContact.middle_name = employee.emergencyContact.middleName
  }
  if (employee.emergencyContact.lastName.trim()) {
    emergencyContact.last_name = employee.emergencyContact.lastName
  }
  if (employee.emergencyContact.relationship.trim()) {
    emergencyContact.relationship = employee.emergencyContact.relationship
  }
  if (employee.emergencyContact.contactNumber.trim()) {
    emergencyContact.contact_number = employee.emergencyContact.contactNumber
  }

  const employeeData = {
    // Keep existing data for fields that haven't been modified
    first_name: employee.firstName.trim() ? employee.firstName : existingData.first_name,
    middle_name: employee.middleName.trim() ? employee.middleName : existingData.middle_name || '',
    last_name: employee.lastName.trim() ? employee.lastName : existingData.last_name,
    department: employee.department || existingData.department,
    job_title: employee.jobTitle || existingData.job_title,
    role: employee.role || existingData.role,
    date_of_hire: employee.dateOfHire || existingData.date_of_hire,
    date_of_birth: employee.dateOfBirth || existingData.date_of_birth,
    gender: employee.gender || existingData.gender,
    contact_number: employee.contactNumber.trim()
      ? employee.contactNumber
      : existingData.contact_number,
    email: employee.email.trim() ? employee.email : existingData.email,
    address: employee.address.trim() ? employee.address : existingData.address,
    emergency_contact: emergencyContact,
  }

  // Convert employeeData to string before appending
  formData.append('employeeData', JSON.stringify(employeeData))

  // Only append files if new ones are selected
  if (profileImageFile.value) {
    formData.append('profileImage', profileImageFile.value)
  }
  if (resumeFile.value) {
    formData.append('resume', resumeFile.value)
  }

  // Debug logs
  console.log('Existing Data:', existingData)
  console.log('Updated Data:', employeeData)
  console.log('FormData contents:')
  for (let [key, value] of formData.entries()) {
    console.log(key, value instanceof File ? value.name : value)
  }

  return formData
}

const cancelAdd = () => {
  confirmModal.value?.close()
  employeeToAdd.value = null
}

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
    resume: null,
  }
  removeProfile()
  removeResume()
}

// Initialize roles on mount
onMounted(async () => {
  try {
    await rolesStore.fetchRoles()

    // If editing and initial data is provided, populate the form
    if (props.isEditing && props.initialData) {
      // Set department first
      newEmployee.value = {
        ...newEmployee.value,
        department: props.initialData.department || '',
      }

      // Then set the rest of the data including job title
      newEmployee.value = {
        id: props.initialData.employee_id,
        firstName: props.initialData.first_name || '',
        middleName: props.initialData.middle_name || '',
        lastName: props.initialData.last_name || '',
        department: props.initialData.department || '',
        jobTitle: props.initialData.job_title || '', // This should now persist
        role: props.initialData.role || '',
        dateOfHire: formatDateForInput(props.initialData.date_of_hire),
        dateOfBirth: formatDateForInput(props.initialData.date_of_birth),
        gender: props.initialData.gender || '',
        contactNumber: props.initialData.contact_number || '',
        email: props.initialData.email || '',
        address: props.initialData.address || '',
        emergencyContact: {
          firstName: props.initialData.emergency_contact?.first_name || '',
          middleName: props.initialData.emergency_contact?.middle_name || '',
          lastName: props.initialData.emergency_contact?.last_name || '',
          relationship: props.initialData.emergency_contact?.relationship || '',
          contactNumber: props.initialData.emergency_contact?.contact_number || '',
        },
      }

      // Set profile image if exists
      if (props.initialData.profile_image_path) {
        profileImage.value = `http://localhost:3000/${props.initialData.profile_image_path}`
      }

      // Set resume filename if exists
      if (props.initialData.resume_path) {
        const filename = props.initialData.resume_path.split('/').pop()
        resumeFileName.value = filename
      }
    }
  } catch {
    showToastMessage('Failed to load roles', 'error')
  }
})
</script>

<template>
  <div class="flex gap-4 container h-[600px] text-black">
    <!-- Professional Information -->
    <div
      class="professional-container w-[30%] border border-gray-200 p-5 rounded-md shadow-md overflow-y-auto bg-white"
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
            <legend class="fieldset-legend text-black text-xs justify-start">
              Department <span class="text-red-500">*</span>
            </legend>
            <select
              v-model="newEmployee.department"
              class="select focus:outline-none bg-white border-black text-black"
              :class="{ 'border-red-500': formErrors.professional.department }"
            >
              <option disabled value="">Select Department</option>
              <option v-for="dept in departments" :key="dept" :value="dept">
                {{ dept }}
              </option>
            </select>
            <span v-if="formErrors.professional.department" class="text-red-500 text-xs mt-1">
              {{ formErrors.professional.department }}
            </span>
          </div>

          <!-- Job Title field - Only show if not Admin Department -->
          <div v-if="newEmployee.department !== 'Admin Department'">
            <legend class="fieldset-legend text-black text-xs justify-start">
              Job Title <span class="text-red-500">*</span>
            </legend>
            <select
              v-model="newEmployee.jobTitle"
              class="select focus:outline-none bg-white border-black text-black"
              :class="{ 'border-red-500': formErrors.professional.jobTitle }"
              :disabled="!newEmployee.department"
            >
              <option disabled value="">Select Job Title</option>
              <option
                v-for="job in availableJobs"
                :key="job"
                :value="job"
                :selected="job === props.initialData?.job_title"
              >
                {{ job }}
              </option>
            </select>
            <span v-if="formErrors.professional.jobTitle" class="text-red-500 text-xs mt-1">
              {{ formErrors.professional.jobTitle }}
            </span>
          </div>

          <div class="">
            <legend class="fieldset-legend text-black text-xs justify-start">
              Role <span class="text-red-500">*</span>
            </legend>
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

          <div class="overflow-hidden">
            <legend class="fieldset-legend text-black text-xs justify-start">Upload Resume</legend>
            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <label
                  class="cursor-pointer flex items-center gap-2 text-primaryColor hover:text-primaryColor/80"
                  :class="{ 'opacity-50 cursor-not-allowed': isProcessing }"
                >
                  <input
                    type="file"
                    accept=".pdf"
                    class="hidden"
                    @change="handleResumeUpload"
                    :disabled="isProcessing"
                  />
                  <Upload class="w-4 h-4" />
                  <span class="text-sm">
                    {{ isProcessing ? 'Processing...' : resumeFileName || 'Upload Resume' }}
                  </span>
                </label>
                <button
                  v-if="resumeFileName && !isProcessing"
                  @click="removeResume"
                  class="text-red-500 hover:text-red-600 text-md"
                >
                  ×
                </button>
              </div>
              <p class="text-xs text-gray-500">* PDF files only, max 5MB</p>
            </div>
            <span v-if="formErrors.professional.resume" class="text-red-500 text-xs mt-1">
              {{ formErrors.professional.resume }}
            </span>
          </div>

          <div class="">
            <legend class="fieldset-legend text-black text-xs justify-start">
              Date of Hire <span class="text-red-500">*</span>
            </legend>
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
      class="personal-container w-[70%] border border-gray-200 p-5 rounded-md shadow-md overflow-y-auto bg-white"
    >
      <div class="container flex flex-col gap-2">
        <div class="title font-bold text-md">Personal Information</div>
        <div
          class="divider m-0 before:bg-gray-200 after:bg-gray-200 before:h-[3px] after:h-[3px]"
        ></div>

        <div class="form-control grid grid-cols-2 gap-5">
          <div class="">
            <legend class="fieldset-legend text-black text-xs justify-start">
              First Name <span class="text-red-500">*</span>
            </legend>
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
            <legend class="fieldset-legend text-black text-xs justify-start">
              Last Name <span class="text-red-500">*</span>
            </legend>
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
            <legend class="fieldset-legend text-black text-xs justify-start">
              Date of Birth <span class="text-red-500">*</span>
            </legend>
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
            <legend class="fieldset-legend text-black text-xs justify-start">
              Gender <span class="text-red-500">*</span>
            </legend>
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
            <legend class="fieldset-legend text-black text-xs justify-start">
              Contact Number <span class="text-red-500">*</span>
            </legend>
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
            <legend class="fieldset-legend text-black text-xs justify-start">
              Email Address <span class="text-red-500">*</span>
            </legend>
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
            <legend class="fieldset-legend text-black text-xs justify-start">
              Address <span class="text-red-500">*</span>
            </legend>
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
            <legend class="fieldset-legend text-black text-xs justify-start">
              First Name <span class="text-red-500">*</span>
            </legend>
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
            <legend class="fieldset-legend text-black text-xs justify-start">
              Last Name <span class="text-red-500">*</span>
            </legend>
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
            <legend class="fieldset-legend text-black text-xs justify-start">
              Relationship <span class="text-red-500">*</span>
            </legend>
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
            <legend class="fieldset-legend text-black text-xs justify-start">
              Contact Number <span class="text-red-500">*</span>
            </legend>
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
            {{ isEditing ? 'Update' : '+ Add' }}
          </button>
          <button
            v-if="!isEditing"
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
        <h3 class="font-bold text-lg text-black">
          {{ isEditing ? 'Confirm Update Employee' : 'Confirm Add Employee' }}
        </h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>

        <div v-if="employeeToAdd" class="py-4">
          <p class="text-center text-black mb-4">
            Are you sure you want to {{ isEditing ? 'update' : 'add' }} employee
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
            <!-- Only show job title if not Admin Department -->
            <div v-if="employeeToAdd.department !== 'Admin Department'" class="flex flex-row">
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
          <button class="btn-primaryStyle" @click="confirmAdd">
            {{ isEditing ? 'Update Employee' : 'Add Employee' }}
          </button>
          <button class="btn-secondaryStyle" @click="cancelAdd">Cancel</button>
        </div>
      </div>
    </dialog>

    <!-- Replace NotificationModal with Toast -->
    <Toast :show="showToast" :message="toastMessage" :type="toastType" />
  </div>
</template>

<style scoped>
.fieldset-legend {
  color: black;
  font-size: 0.75rem; /* text-xs */
}

.form-input {
  width: 100%;
  outline: none;
  border-bottom-width: 1px;
  border-color: rgb(209 213 219); /* border-gray-300 */
  padding: 0;
  padding-top: 0.75rem;
  color: black;
}

.form-select {
  width: 100%;
  outline: none;
  background-color: white;
  border-color: black;
  color: black;
}

.error-text {
  color: rgb(239 68 68); /* text-red-500 */
  font-size: 0.75rem; /* text-xs */
  margin-top: 0.25rem;
}
</style>
