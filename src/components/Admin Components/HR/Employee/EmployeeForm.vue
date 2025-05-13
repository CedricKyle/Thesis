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
import { useToast } from '@/composables/Admin Composables/Human Resource/useToast'
import { useRoute } from 'vue-router'
import {
  DEPARTMENTS,
  permissionGroups,
} from '@/composables/Admin Composables/User & Role/role/permissionsId'
import { usePositionStore } from '@/stores/HR Management/positionStore'

// Store and composable setup
const store = useEmployeeStore()
const rolesStore = useRolesStore()
const positionStore = usePositionStore()
const { roles } = storeToRefs(rolesStore)
const { formErrors, validateProfessionalInfo, validatePersonalInfo, validateEmergencyContact } =
  useEmployeeValidation()
const { profileImage, profileImageFile, showUploadText, handleProfileUpload, removeProfile } =
  useProfileImage(profilePlaceholder)
const { showToast, toastMessage, toastType, showToastMessage } = useToast()
const route = useRoute()

// Initialize the files property in formErrors
formErrors.value = {
  professional: {},
  personal: {},
  emergencyContact: {},
  files: {},
}

// UI state
const confirmModal = ref(null)
const employeeToAdd = ref(null)
const loading = ref(false)

// Form state
const newEmployee = ref({
  firstName: '',
  middleName: '',
  lastName: '',
  department: '',
  position_id: '',
  role_id: '',
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
})

// Define department-specific roles based on permissions
const getDepartmentRoles = (department) => {
  if (department === DEPARTMENTS.ADMIN) return ['Admin']

  const departmentGroup = permissionGroups.find((group) => group.department === department)
  if (!departmentGroup) return []

  // Create roles based on permissions
  const roles = []
  if (departmentGroup.permissions.some((p) => p.name === 'Full Access')) {
    roles.push(`${departmentGroup.name.replace(' Department', '')} Manager`)
  }
  roles.push(`${departmentGroup.name.replace(' Department', '')} Staff`)

  return roles
}

// Add computed properties for available roles and jobs
const availableRoles = computed(() => {
  if (!newEmployee.value.department) return []
  return getDepartmentRoles(newEmployee.value.department)
})

// Update the availableJobs computed property
const availableJobs = computed(() => {
  if (!newEmployee.value.department) return []
  return positionStore.positions.filter((pos) => pos.department === newEmployee.value.department)
})

// Update the department watcher
watch(
  () => newEmployee.value.department,
  (newDepartment) => {
    if (newDepartment === DEPARTMENTS.ADMIN) {
      newEmployee.value.position_id = 'Admin'
      newEmployee.value.role_id = 'Admin'
    } else {
      newEmployee.value.role_id = ''
      newEmployee.value.position_id = ''
    }
  },
)

// Add watch for role changes
watch(
  () => newEmployee.value.role_id,
  (newRole) => {
    // Reset job title when role changes
    if (newRole && newEmployee.value.department !== DEPARTMENTS.ADMIN) {
      newEmployee.value.position_id = ''
    }
  },
)

// Add this computed property in the script setup
const departments = computed(() => {
  const isAdminRoute = route.path.startsWith('/admin')
  if (isAdminRoute) {
    return Object.values(DEPARTMENTS)
  }
  return Object.values(DEPARTMENTS).filter((dept) => dept !== DEPARTMENTS.ADMIN)
})

// Watchers
watch(profileImage, (newValue) => {
  // We don't need to store the base64 in newEmployee anymore
  console.log('Profile image updated')
})

// Add these validation functions at the top of the script
const validateDates = (dateString, fieldName) => {
  if (!dateString) {
    return `${fieldName} is required`
  }
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    return `Invalid ${fieldName} format`
  }
  return null
}

const validateFiles = () => {
  const errors = {}
  const maxSize = 5 * 1024 * 1024 // 5MB

  if (profileImageFile.value) {
    if (profileImageFile.value.size > maxSize) {
      errors.profileImage = 'Profile image must be less than 5MB'
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
    if (!allowedTypes.includes(profileImageFile.value.type)) {
      errors.profileImage = 'Profile image must be JPG, PNG, or GIF'
    }
  }

  return errors
}

// Add these computed properties
const isValidEmail = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return !newEmployee.value.email || emailRegex.test(newEmployee.value.email)
})

const isValidPhone = computed(() => {
  const phoneRegex = /^09\d{9}$/
  return !newEmployee.value.contactNumber || phoneRegex.test(newEmployee.value.contactNumber)
})

const isValidEmergencyPhone = computed(() => {
  const phoneRegex = /^09\d{9}$/
  return (
    !newEmployee.value.emergencyContact.contactNumber ||
    phoneRegex.test(newEmployee.value.emergencyContact.contactNumber)
  )
})

// Add these refs
const isSubmitting = ref(false)
const submitError = ref(null)

// Form submission handlers
const handleFormSubmit = async () => {
  try {
    submitError.value = null

    // Reset form errors
    formErrors.value = {
      professional: {},
      personal: {},
      emergencyContact: {},
      files: {},
    }

    // Validate professional info
    if (!newEmployee.value.department) {
      formErrors.value.professional.department = 'Department is required'
    }
    if (!newEmployee.value.position_id && newEmployee.value.department !== DEPARTMENTS.ADMIN) {
      formErrors.value.professional.position_id = 'Job Title is required'
    }
    if (!newEmployee.value.role_id) {
      formErrors.value.professional.role_id = 'Role is required'
    }
    if (!newEmployee.value.dateOfHire) {
      formErrors.value.professional.dateOfHire = 'Date of Hire is required'
    }

    // Validate personal info
    if (!newEmployee.value.firstName) {
      formErrors.value.personal.firstName = 'First Name is required'
    }
    if (!newEmployee.value.lastName) {
      formErrors.value.personal.lastName = 'Last Name is required'
    }
    if (!newEmployee.value.dateOfBirth) {
      formErrors.value.personal.dateOfBirth = 'Date of Birth is required'
    }
    if (!newEmployee.value.gender) {
      formErrors.value.personal.gender = 'Gender is required'
    }
    if (!newEmployee.value.contactNumber) {
      formErrors.value.personal.contactNumber = 'Contact Number is required'
    }
    if (!newEmployee.value.email) {
      formErrors.value.personal.email = 'Email is required'
    }
    if (!newEmployee.value.address) {
      formErrors.value.personal.address = 'Address is required'
    }

    // Validate emergency contact
    if (!newEmployee.value.emergencyContact.firstName) {
      formErrors.value.emergencyContact.firstName = 'Emergency Contact First Name is required'
    }
    if (!newEmployee.value.emergencyContact.lastName) {
      formErrors.value.emergencyContact.lastName = 'Emergency Contact Last Name is required'
    }
    if (!newEmployee.value.emergencyContact.relationship) {
      formErrors.value.emergencyContact.relationship = 'Relationship is required'
    }
    if (!newEmployee.value.emergencyContact.contactNumber) {
      formErrors.value.emergencyContact.contactNumber = 'Emergency Contact Number is required'
    }

    // Check if there are any validation errors
    const hasErrors = Object.values(formErrors.value).some(
      (section) => Object.keys(section).length > 0,
    )

    if (hasErrors) {
      showToastMessage('Please fill in all required fields', 'error')
      return
    }

    employeeToAdd.value = { ...newEmployee.value }
    confirmModal.value?.showModal()
  } catch (error) {
    console.error('Form submission error:', error)
    showToastMessage('An error occurred while validating the form', 'error')
  }
}

const confirmAdd = async () => {
  try {
    loading.value = true
    console.log('Starting employee creation process...')
    console.log('Employee to add:', employeeToAdd.value)

    const formData = createEmployeeData(employeeToAdd.value)
    console.log('FormData created successfully')

    const response = await store.createEmployee(formData)
    console.log('Response received:', response)

    confirmModal.value?.close()
    employeeToAdd.value = null

    const credentialsMessage = `
Employee added successfully!

Login Credentials:
Employee ID: ${response.data.employeeId}
Default Password: countryside123

Please provide these credentials to the employee.
Note: Employee will be required to change password on first login.`

    showToastMessage(credentialsMessage, 'success')
    resetForm()
  } catch (error) {
    console.error('Error in confirmAdd:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    })

    let errorMessage = 'Error adding employee'
    if (error.response?.data?.message) {
      if (error.response.data.fields) {
        errorMessage = `Missing required fields: ${error.response.data.fields.join(', ')}`
      } else {
        errorMessage = error.response.data.message
      }
    } else if (error.message) {
      errorMessage = error.message
    }

    showToastMessage(errorMessage, 'error')
  } finally {
    loading.value = false
  }
}

const createEmployeeData = (employee) => {
  try {
    // Format dates properly
    const formatDate = (dateString) => {
      if (!dateString) return null
      const date = new Date(dateString)
      return date.toISOString().split('T')[0]
    }

    // Create the employee object with the exact field names the backend expects
    const employeeData = {
      firstName: employee.firstName.trim(),
      middleName: (employee.middleName || '').trim(),
      lastName: employee.lastName.trim(),
      department: employee.department.trim(),
      position_id: Number(employee.position_id),
      role_id: Number(employee.role_id),
      dateOfHire: formatDate(employee.dateOfHire),
      dateOfBirth: formatDate(employee.dateOfBirth),
      gender: employee.gender.trim(),
      contactNumber: employee.contactNumber.trim(),
      email: employee.email.trim().toLowerCase(),
      address: employee.address.trim(),
      emergencyContact: {
        firstName: employee.emergencyContact.firstName.trim(),
        middleName: (employee.emergencyContact.middleName || '').trim(),
        lastName: employee.emergencyContact.lastName.trim(),
        relationship: employee.emergencyContact.relationship.trim(),
        contactNumber: employee.emergencyContact.contactNumber.trim(),
      },
    }

    // Create FormData
    const formData = new FormData()
    formData.append('employeeData', JSON.stringify(employeeData))

    // Add files if they exist
    if (profileImageFile.value) {
      formData.append('profileImage', profileImageFile.value)
    }

    // Log the data being sent for debugging
    console.log('Sending employee data:', {
      employeeData: JSON.parse(formData.get('employeeData')),
      hasProfileImage: formData.has('profileImage'),
      profileImageDetails: profileImageFile.value
        ? {
            name: profileImageFile.value.name,
            type: profileImageFile.value.type,
            size: profileImageFile.value.size,
          }
        : null,
    })

    return formData
  } catch (error) {
    console.error('Error creating employee data:', error)
    throw error
  }
}

const resetForm = () => {
  newEmployee.value = {
    firstName: '',
    middleName: '',
    lastName: '',
    department: '',
    position_id: '',
    role_id: '',
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
  }
  removeProfile()
}

// Initialize roles on mount
onMounted(async () => {
  try {
    await rolesStore.fetchRoles()
    positionStore.loadPositions()
  } catch (error) {
    showToastMessage('Failed to load roles', 'error')
  }
})

const filteredRoles = computed(() => {
  if (!newEmployee.value.department) return []
  return roles.value.filter(
    (role) => role.department === newEmployee.value.department && role.role_name !== 'Super Admin',
  )
})
</script>

<template>
  <div class="flex gap-4 container h-auto text-black">
    <!-- Professional Information -->
    <div
      class="professional-container w-[30%] border border-gray-200 p-5 rounded-md shadow-md bg-white"
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
          <!-- Department -->
          <div>
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

          <!-- Role -->
          <div>
            <legend class="fieldset-legend text-black text-xs justify-start">
              Role <span class="text-red-500">*</span>
            </legend>
            <select
              v-model="newEmployee.role_id"
              class="select focus:outline-none bg-white border-black text-black"
              :class="{ 'border-red-500': formErrors.professional.role_id }"
              :disabled="!newEmployee.department"
            >
              <option disabled value="">Select Role</option>
              <option v-for="role in filteredRoles" :key="role.id" :value="role.id">
                {{ role.role_name }}
              </option>
            </select>
            <span v-if="formErrors.professional.role_id" class="text-red-500 text-xs mt-1">
              {{ formErrors.professional.role_id }}
            </span>
          </div>

          <!-- Job Title field - Only show if not Admin Department -->
          <div v-if="newEmployee.department !== DEPARTMENTS.ADMIN">
            <legend class="fieldset-legend text-black text-xs justify-start">
              Job Title <span class="text-red-500">*</span>
            </legend>
            <select
              v-model="newEmployee.position_id"
              class="select focus:outline-none bg-white border-black text-black"
              :disabled="!newEmployee.department"
            >
              <option disabled value="">Select Job Title</option>
              <option v-for="position in availableJobs" :key="position.id" :value="position.id">
                {{ position.position_title }}
              </option>
              <option v-if="availableJobs.length === 0" disabled>
                No available job titles for this department
              </option>
            </select>
            <span v-if="formErrors.professional.position_id" class="text-red-500 text-xs mt-1">
              {{ formErrors.professional.position_id }}
            </span>
          </div>

          <!-- Date of Hire field -->
          <div>
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
      class="personal-container w-[70%] border border-gray-200 p-5 rounded-md shadow-mD bg-white"
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
            :disabled="loading"
            class="btn-primaryStyle btn-sm bg-primaryColor border-none text-white shadow-none"
          >
            {{ loading ? 'Adding...' : '+ Add' }}
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

        <div class="py-4">
          <p class="text-center text-black mb-4">
            Add new employee
            <span class="font-bold">
              {{
                [newEmployee.firstName, newEmployee.middleName, newEmployee.lastName]
                  .filter(Boolean)
                  .join(' ')
              }} </span
            >?
          </p>

          <div class="mt-4 flex flex-col gap-2">
            <!-- Professional Information -->
            <div class="flex flex-row">
              <div class="w-32 text-gray-500">Department:</div>
              <div class="text-black">{{ newEmployee.department }}</div>
            </div>

            <div class="flex flex-row">
              <div class="w-32 text-gray-500">Job Title:</div>
              <div class="text-black">{{ newEmployee.position_id }}</div>
            </div>

            <div class="flex flex-row">
              <div class="w-32 text-gray-500">Role:</div>
              <div class="text-black">{{ newEmployee.role_id }}</div>
            </div>

            <!-- Personal Information -->
            <div class="flex flex-row">
              <div class="w-32 text-gray-500">Personal Info:</div>
              <div class="text-black flex flex-col">
                <span
                  >Name:
                  {{
                    [newEmployee.firstName, newEmployee.middleName, newEmployee.lastName]
                      .filter(Boolean)
                      .join(' ')
                  }}</span
                >
                <span>Birth Date: {{ newEmployee.dateOfBirth }}</span>
                <span>Gender: {{ newEmployee.gender }}</span>
                <span>Contact: {{ newEmployee.contactNumber }}</span>
                <span>Email: {{ newEmployee.email }}</span>
                <span>Address: {{ newEmployee.address }}</span>
              </div>
            </div>

            <!-- Emergency Contact -->
            <div class="flex flex-row">
              <div class="w-32 text-gray-500">Emergency Contact:</div>
              <div class="text-black flex flex-col">
                <span
                  >Name:
                  {{
                    [
                      newEmployee.emergencyContact.firstName,
                      newEmployee.emergencyContact.middleName,
                      newEmployee.emergencyContact.lastName,
                    ]
                      .filter(Boolean)
                      .join(' ')
                  }}</span
                >
                <span>Relationship: {{ newEmployee.emergencyContact.relationship }}</span>
                <span>Contact: {{ newEmployee.emergencyContact.contactNumber }}</span>
              </div>
            </div>

            <!-- Files -->
            <div v-if="profileImageFile" class="flex flex-row">
              <div class="w-32 text-gray-500">Profile Image:</div>
              <div class="text-black">{{ profileImageFile.name }}</div>
            </div>
          </div>
        </div>

        <div class="modal-action justify-center gap-4">
          <button class="btn-primaryStyle bg-primaryColor text-white" @click="confirmAdd()">
            Add Employee
          </button>
        </div>
      </div>
    </dialog>

    <!-- Replace NotificationModal with Toast -->
    <Toast :show="showToast" :message="toastMessage" :type="toastType" />

    <!-- Add this after the profile selection div -->
    <div v-if="formErrors.files?.profileImage" class="text-red-500 text-xs mt-1 text-center">
      {{ formErrors.files.profileImage }}
    </div>
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
