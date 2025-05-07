<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'
import { useToast } from '@/composables/Admin Composables/Human Resource/useToast'
import { useProfileImage } from '@/composables/Admin Composables/Human Resource/useProfileImage'
import { useResumeUpload } from '@/composables/Admin Composables/Human Resource/useResumeUpload'
import { useRolesStore } from '@/stores/Users & Role/roleStore'
import { usePositionStore } from '@/stores/HR Management/positionStore'
import { storeToRefs } from 'pinia'
import { Upload } from 'lucide-vue-next'
import Toast from '@/components/Admin Components/HR/Toast.vue'
import profilePlaceholder from '@/assets/Images/profile-placeholder.png'
import {
  DEPARTMENTS,
  permissionGroups,
} from '@/composables/Admin Composables/User & Role/role/permissionsId'

const router = useRouter()
const route = useRoute()
const store = useEmployeeStore()
const rolesStore = useRolesStore()
const positionStore = usePositionStore()
const { roles } = storeToRefs(rolesStore)
const { showToast, toastMessage, toastType, showToastMessage } = useToast()
const { profileImage, profileImageFile, showUploadText, handleProfileUpload, removeProfile } =
  useProfileImage(profilePlaceholder)
const { resumeFile, resumeFileName, isProcessing, handleResumeUpload, removeResume } =
  useResumeUpload(showToastMessage)

const employeeData = ref({
  employee_id: '',
  first_name: '',
  middle_name: '',
  last_name: '',
  department: '',
  position_id: '',
  role: '',
  date_of_hire: '',
  date_of_birth: '',
  gender: '',
  contact_number: '',
  email: '',
  address: '',
  emergency_contact: {
    first_name: '',
    middle_name: '',
    last_name: '',
    relationship: '',
    contact_number: '',
  },
  branch_id: '',
})

const isLoading = ref(true)
const confirmModal = ref(null)
const formDataToUpdate = ref(null)
const employeeToUpdate = ref(null)
const originalData = ref(null)
const changedFields = ref(new Set())

const branches = [
  { id: 1, name: 'Dasmariñas Branch' },
  { id: 2, name: 'Silang Branch' },
  { id: 3, name: 'Imus Branch' },
]

// Add departments data
const departmentJobs = {
  [DEPARTMENTS.HR]: ['HR Manager'],
  [DEPARTMENTS.FINANCE]: ['Accountant'],
  [DEPARTMENTS.SALES]: ['Sales Manager'],
  [DEPARTMENTS.CRM]: ['Customer Service Representative'],
  [DEPARTMENTS.SCM]: ['Supply Chain Manager'],
  [DEPARTMENTS.BRANCH_OPERATION]: ['Branch Operation Manager'],
  [DEPARTMENTS.PROCUREMENT]: ['Procurement Manager'],
}

// Add departments computed property
const departments = computed(() => {
  const isAdminRoute = route.path.startsWith('/admin')
  if (isAdminRoute) {
    return Object.values(DEPARTMENTS)
  }
  return Object.values(DEPARTMENTS).filter((dept) => dept !== DEPARTMENTS.ADMIN)
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

// Update computed properties
const availableRoles = computed(() => {
  if (!employeeData.value.department) return []
  return getDepartmentRoles(employeeData.value.department)
})

const availableJobs = computed(() => {
  if (!employeeData.value.department) return []
  return positionStore.positions.filter((pos) => pos.department === employeeData.value.department)
})

const hasPersonalInfoChanges = computed(() => {
  if (!originalData?.value) return false

  // Debug log to help track the comparison
  console.log('Comparing personal info:', {
    currentFirstName: employeeData.value.first_name,
    originalFirstName: originalData.value.first_name,
    isDifferent: employeeData.value.first_name !== originalData.value.first_name,
  })

  return (
    employeeData.value.first_name !== originalData.value.first_name ||
    employeeData.value.middle_name !== originalData.value.middle_name ||
    employeeData.value.last_name !== originalData.value.last_name ||
    employeeData.value.date_of_birth !== originalData.value.date_of_birth ||
    employeeData.value.gender !== originalData.value.gender ||
    employeeData.value.contact_number !== originalData.value.contact_number ||
    employeeData.value.email !== originalData.value.email ||
    employeeData.value.address !== originalData.value.address
  )
})

const hasEmergencyContactChanges = computed(() => {
  if (!originalData?.value?.emergency_contact) return false

  // Debug log for emergency contact comparison
  console.log('Comparing emergency contact:', {
    current: employeeData.value.emergency_contact,
    original: originalData.value.emergency_contact,
  })

  return (
    employeeData.value.emergency_contact.first_name !==
      originalData.value.emergency_contact.first_name ||
    employeeData.value.emergency_contact.middle_name !==
      originalData.value.emergency_contact.middle_name ||
    employeeData.value.emergency_contact.last_name !==
      originalData.value.emergency_contact.last_name ||
    employeeData.value.emergency_contact.relationship !==
      originalData.value.emergency_contact.relationship ||
    employeeData.value.emergency_contact.contact_number !==
      originalData.value.emergency_contact.contact_number
  )
})

// Add this computed property to check for professional info changes
const hasProfessionalInfoChanges = computed(() => {
  if (!originalData?.value) return false

  return (
    employeeData.value.department !== originalData.value.department ||
    employeeData.value.position_id !== originalData.value.position_id ||
    employeeData.value.role !== originalData.value.role ||
    employeeData.value.date_of_hire !== originalData.value.date_of_hire
  )
})

const filteredRoles = computed(() => {
  if (!employeeData.value.department) return []
  return roles.value.filter(
    (role) => role.department === employeeData.value.department && role.role_name !== 'Super Admin',
  )
})

onMounted(async () => {
  try {
    // Load roles first
    await rolesStore.fetchRoles()
    await positionStore.loadPositions()

    const employeeId = route.params.id
    const response = await store.getEmployee(employeeId)

    console.log('API Response:', response) // Debug log

    // Initialize employeeData with the response
    employeeData.value = {
      ...response,
      // Make sure we properly handle the emergency contact data
      emergency_contact: response.emergencyContact || {
        first_name: '',
        middle_name: '',
        last_name: '',
        relationship: '',
        contact_number: '',
      },
    }

    // Store original data for comparison
    originalData.value = JSON.parse(JSON.stringify(response))

    // Set profile image if exists
    if (response.profile_image_path) {
      profileImage.value = `http://localhost:3000/${response.profile_image_path}`
    }

    // Set resume if exists
    if (response.resume_path) {
      resumeFileName.value = response.resume_path.split('/').pop()
    }

    // Debug log to verify data
    console.log('Loaded employee data:', {
      employee: employeeData.value,
      emergencyContact: employeeData.value.emergency_contact,
    })

    isLoading.value = false
  } catch (error) {
    console.error('Error loading employee:', error)
    showToastMessage('Error loading employee data', 'error')
    const isAdmin = route.path.startsWith('/admin')
    router.push(isAdmin ? '/admin/hr/employees' : '/hr/employees')
  }
})

const handleFieldChange = (fieldName, value) => {
  // Add professional fields to tracking
  const professionalFields = ['department', 'position_id', 'role', 'date_of_hire']

  if (professionalFields.includes(fieldName)) {
    if (JSON.stringify(originalData.value[fieldName]) !== JSON.stringify(value)) {
      changedFields.value.add(fieldName)
    } else {
      changedFields.value.delete(fieldName)
    }
  } else if (JSON.stringify(originalData.value[fieldName]) !== JSON.stringify(value)) {
    changedFields.value.add(fieldName)
  } else {
    changedFields.value.delete(fieldName)
  }
}

const handleUpdate = async () => {
  try {
    // Add debug logging
    console.log('Checking for changes:', {
      current: employeeData.value,
      original: originalData.value,
      hasPersonalChanges: hasPersonalInfoChanges.value,
      hasEmergencyChanges: hasEmergencyContactChanges.value,
      hasProfessionalChanges: hasProfessionalInfoChanges.value,
      profileImageChanged: !!profileImageFile.value,
      resumeChanged: !!resumeFile.value,
    })

    // Include professional info changes in the check
    const hasChanges =
      hasPersonalInfoChanges.value ||
      hasEmergencyContactChanges.value ||
      hasProfessionalInfoChanges.value ||
      profileImageFile.value ||
      resumeFile.value

    if (!hasChanges) {
      showToastMessage('No changes detected. Update cancelled.', 'info')
      return
    }

    // Create FormData with the correct field names to match backend
    const formData = new FormData()

    // Format the employee data to match backend expectations (using camelCase)
    const updateData = {
      firstName: employeeData.value.first_name,
      middleName: employeeData.value.middle_name || '',
      lastName: employeeData.value.last_name,
      department: employeeData.value.department,
      position_id: employeeData.value.position_id,
      role_id: employeeData.value.role_id,
      dateOfHire: employeeData.value.date_of_hire,
      dateOfBirth: employeeData.value.date_of_birth,
      gender: employeeData.value.gender,
      contactNumber: employeeData.value.contact_number,
      email: employeeData.value.email.toLowerCase(),
      address: employeeData.value.address,
      emergencyContact: {
        firstName: employeeData.value.emergency_contact?.first_name || '',
        middleName: employeeData.value.emergency_contact?.middle_name || '',
        lastName: employeeData.value.emergency_contact?.last_name || '',
        relationship: employeeData.value.emergency_contact?.relationship || '',
        contactNumber: employeeData.value.emergency_contact?.contact_number || '',
      },
      branch_id:
        employeeData.value.department === DEPARTMENTS.BRANCH_OPERATION
          ? Number(employeeData.value.branch_id)
          : null,
    }

    // Log the data being prepared for update
    console.log('Preparing update data:', {
      updateData,
      emergencyContact: updateData.emergencyContact,
    })

    // Validate required fields
    const requiredFields = {
      firstName: 'First Name',
      lastName: 'Last Name',
      department: 'Department',
      position_id: 'Job Title',
      role_id: 'Role',
      dateOfHire: 'Date of Hire',
      dateOfBirth: 'Date of Birth',
      gender: 'Gender',
      contactNumber: 'Contact Number',
      email: 'Email',
      address: 'Address',
      'emergencyContact.firstName': 'Emergency Contact First Name',
      'emergencyContact.lastName': 'Emergency Contact Last Name',
      'emergencyContact.relationship': 'Emergency Contact Relationship',
      'emergencyContact.contactNumber': 'Emergency Contact Number',
    }

    const missingFields = []
    Object.entries(requiredFields).forEach(([field, label]) => {
      const value = field.includes('.')
        ? updateData[field.split('.')[0]][field.split('.')[1]]
        : updateData[field]
      if (
        value === undefined ||
        value === null ||
        (typeof value === 'string' ? value.trim() === '' : value === '')
      ) {
        missingFields.push(label)
      }
    })

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(updateData.email)) {
      throw new Error('Invalid email format')
    }

    // Validate phone numbers
    const phoneRegex = /^09\d{9}$/
    if (!phoneRegex.test(updateData.contactNumber)) {
      throw new Error('Invalid contact number format (should be 09xxxxxxxxx)')
    }
    if (!phoneRegex.test(updateData.emergencyContact.contactNumber)) {
      throw new Error('Invalid emergency contact number format (should be 09xxxxxxxxx)')
    }

    // Add the formatted data
    formData.append('employeeData', JSON.stringify(updateData))

    // Add files if changed
    if (profileImageFile.value) {
      formData.append('profileImage', profileImageFile.value)
    }
    if (resumeFile.value) {
      formData.append('resume', resumeFile.value)
    }

    formDataToUpdate.value = formData
    employeeToUpdate.value = updateData
    confirmModal.value?.showModal()

    if (
      employeeData.value.department === DEPARTMENTS.BRANCH_OPERATION &&
      !employeeData.value.branch_id
    ) {
      showToastMessage('Branch is required for Branch Operation employees', 'error')
      return
    }
  } catch (error) {
    console.error('Error preparing update:', error)
    showToastMessage(error.message || 'Error preparing update', 'error')
  }
}

const confirmUpdate = async () => {
  try {
    await store.updateEmployee(route.params.id, formDataToUpdate.value)
    await store.loadEmployees()
    showToastMessage('Employee updated successfully', 'success')
    confirmModal.value?.close()

    // Add a small delay before redirecting
    setTimeout(() => {
      const isAdmin = route.path.startsWith('/admin')
      router.push(isAdmin ? '/admin/hr/employees' : '/hr/employees')
    }, 1500)
  } catch (error) {
    console.error('Error updating employee:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    })

    let errorMessage = 'Error updating employee'
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
  }
}

const cancelUpdate = () => {
  confirmModal.value?.close()
  formDataToUpdate.value = null
  employeeToUpdate.value = null
}

const formatFieldName = (field) => {
  return field
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Add this watch for debugging emergency contact changes
watch(
  () => employeeData.value.emergency_contact,
  (newVal) => {
    console.log('Emergency contact data changed:', newVal)
  },
  { deep: true },
)

// Update watch for department changes
watch(
  () => employeeData.value.department,
  (newDepartment) => {
    if (newDepartment === DEPARTMENTS.ADMIN) {
      employeeData.value.position_id = 'Administrator'
      employeeData.value.role = 'Admin'
      employeeData.value.branch_id = ''
    } else {
      employeeData.value.role = ''
      employeeData.value.position_id = ''
      employeeData.value.branch_id = ''
    }
  },
)

// Update watch for role changes
watch(
  () => employeeData.value.role,
  (newRole) => {
    // Reset job title when role changes
    if (newRole && employeeData.value.department !== DEPARTMENTS.ADMIN) {
      employeeData.value.position_id = ''
    }
  },
)
</script>

<template>
  <div class="p-5">
    <div class="flex items-center gap-2 mb-5">
      <button
        class="btn-secondaryStyle bg-gray-100/0 hover:text-gray-600 border-none text-black shadow-none btn-sm"
        @click="router.back()"
      >
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>
      <h2 class="text-xl font-semibold text-black">Edit Employee</h2>
    </div>

    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <div class="loading loading-spinner loading-lg"></div>
    </div>

    <div v-else class="flex gap-4 container text-black">
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
                <img
                  :src="profileImage || profilePlaceholder"
                  class="w-full h-full object-cover rounded-full"
                />
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
                <button
                  v-if="profileImage"
                  @click="removeProfile"
                  class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            </div>
          </div>

          <div class="title font-bold text-md">Professional Information</div>

          <div class="form-control flex flex-col gap-5">
            <!-- Department -->
            <div>
              <legend class="fieldset-legend text-black text-xs justify-start">Department</legend>
              <select
                v-model="employeeData.department"
                class="select focus:outline-none bg-white border-black text-black"
                @change="handleFieldChange('department', employeeData.department)"
              >
                <option disabled value="">Select Department</option>
                <option v-for="dept in departments" :key="dept" :value="dept">{{ dept }}</option>
              </select>
            </div>

            <!-- Role -->
            <div>
              <legend class="fieldset-legend text-black text-xs justify-start">Role</legend>
              <select
                v-model="employeeData.role_id"
                class="select focus:outline-none bg-white border-black text-black"
                @change="handleFieldChange('role_id', employeeData.role_id)"
                :disabled="!employeeData.department"
              >
                <option disabled value="">Select Role</option>
                <option v-for="role in filteredRoles" :key="role.id" :value="role.id">
                  {{ role.role_name }}
                </option>
              </select>
            </div>

            <!-- Job Title -->
            <div v-if="employeeData.department !== DEPARTMENTS.ADMIN">
              <legend class="fieldset-legend text-black text-xs justify-start">Job Title</legend>
              <select
                v-model="employeeData.position_id"
                class="select focus:outline-none bg-white border-black text-black"
                :disabled="!employeeData.department || !employeeData.role_id"
                @change="handleFieldChange('position_id', employeeData.position_id)"
              >
                <option disabled value="">Select Job Title</option>
                <option v-for="position in availableJobs" :key="position.id" :value="position.id">
                  {{ position.position_title }}
                </option>
                <option v-if="availableJobs.length === 0" disabled>
                  No available job titles for this department
                </option>
              </select>
            </div>

            <!-- Resume Upload -->
            <div class="overflow-hidden">
              <legend class="fieldset-legend text-black text-xs justify-start">
                Upload Resume
              </legend>
              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-2">
                  <label
                    class="cursor-pointer flex items-center gap-2 text-primaryColor hover:text-primaryColor/80"
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
            </div>

            <!-- Date of Hire -->
            <div>
              <legend class="fieldset-legend text-black text-xs justify-start">Date of Hire</legend>
              <input
                v-model="employeeData.date_of_hire"
                type="date"
                class="border-b-1 w-full outline-none border-gray-300 p-0 pt-3 text-black"
                @change="handleFieldChange('date_of_hire', employeeData.date_of_hire)"
              />
            </div>

            <!-- Branch Selection (only for Branch Operation) -->
            <div v-if="employeeData.department === DEPARTMENTS.BRANCH_OPERATION">
              <legend class="fieldset-legend text-black text-xs justify-start">
                Branch <span class="text-red-500">*</span>
              </legend>
              <select
                v-model="employeeData.branch_id"
                class="select focus:outline-none bg-white border-black text-black"
              >
                <option disabled value="">Select Branch</option>
                <option v-for="branch in branches" :key="branch.id" :value="branch.id">
                  {{ branch.name }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Personal Information -->
      <div
        class="personal-container w-[70%] border border-gray-200 p-5 rounded-md shadow-md bg-white"
      >
        <div class="container flex flex-col gap-2">
          <div class="title font-bold text-md">Personal Information</div>
          <div
            class="divider m-0 before:bg-gray-200 after:bg-gray-200 before:h-[3px] after:h-[3px]"
          ></div>

          <div class="form-control grid grid-cols-2 gap-5">
            <!-- First Name -->
            <div>
              <legend class="fieldset-legend text-black text-xs justify-start">First Name</legend>
              <input
                v-model="employeeData.first_name"
                type="text"
                class="border-b-1 w-full outline-none border-gray-300 p-0 pt-3 text-black"
              />
            </div>

            <!-- Middle Name -->
            <div>
              <legend class="fieldset-legend text-black text-xs">Middle Name</legend>
              <input
                v-model="employeeData.middle_name"
                type="text"
                placeholder="(Optional)"
                class="border-b-1 w-full outline-none border-gray-300 p-0 pt-3 text-black placeholder:text-xs"
              />
            </div>

            <!-- Last Name -->
            <div class="col-span-2">
              <legend class="fieldset-legend text-black text-xs justify-start">Last Name</legend>
              <input
                v-model="employeeData.last_name"
                type="text"
                class="border-b-1 w-full outline-none border-gray-300 p-0 pt-3 text-black"
              />
            </div>

            <!-- Date of Birth -->
            <div>
              <legend class="fieldset-legend text-black text-xs justify-start">
                Date of Birth
              </legend>
              <input
                v-model="employeeData.date_of_birth"
                type="date"
                class="border-b-1 w-full outline-none border-gray-300 p-0 pt-3 text-black"
              />
            </div>

            <!-- Gender -->
            <div>
              <legend class="fieldset-legend text-black text-xs justify-start">Gender</legend>
              <select
                v-model="employeeData.gender"
                class="select focus:outline-none bg-white border-black text-black"
              >
                <option disabled value="">Select Gender</option>
                <option>Male</option>
                <option>Female</option>
              </select>
            </div>

            <!-- Contact Number -->
            <div>
              <legend class="fieldset-legend text-black text-xs justify-start">
                Contact Number
              </legend>
              <input
                v-model="employeeData.contact_number"
                type="text"
                placeholder="09xxxxxxxxx"
                maxlength="11"
                class="border-b-1 w-full outline-none border-gray-300 p-0 pt-3 text-black"
              />
            </div>

            <!-- Email -->
            <div>
              <legend class="fieldset-legend text-black text-xs justify-start">
                Email Address
              </legend>
              <input
                v-model="employeeData.email"
                type="email"
                class="border-b-1 w-full outline-none border-gray-300 p-0 pt-3 text-black"
              />
            </div>

            <!-- Address -->
            <div class="col-span-2">
              <legend class="fieldset-legend text-black text-xs justify-start">Address</legend>
              <input
                v-model="employeeData.address"
                type="text"
                class="border-b-1 w-full outline-none border-gray-300 p-0 pt-3 text-black"
              />
            </div>
          </div>

          <!-- Emergency Contact -->
          <div class="title font-bold mt-4 text-red-500">Emergency Contact</div>
          <div class="form-control grid grid-cols-2 gap-5">
            <!-- Emergency Contact First Name -->
            <div>
              <legend class="fieldset-legend text-black text-xs justify-start">First Name</legend>
              <input
                v-model="employeeData.emergency_contact.first_name"
                type="text"
                class="border-b-1 w-full outline-none border-gray-300 p-0 pt-3 text-black"
              />
            </div>

            <!-- Emergency Contact Middle Name -->
            <div>
              <legend class="fieldset-legend text-black text-xs">Middle Name</legend>
              <input
                v-model="employeeData.emergency_contact.middle_name"
                type="text"
                placeholder="(Optional)"
                class="border-b-1 w-full outline-none border-gray-300 p-0 pt-3 text-black placeholder:text-xs"
              />
            </div>

            <!-- Emergency Contact Last Name -->
            <div class="col-span-2">
              <legend class="fieldset-legend text-black text-xs justify-start">Last Name</legend>
              <input
                v-model="employeeData.emergency_contact.last_name"
                type="text"
                class="border-b-1 w-full outline-none border-gray-300 p-0 pt-3 text-black"
              />
            </div>

            <!-- Emergency Contact Relationship -->
            <div>
              <legend class="fieldset-legend text-black text-xs justify-start">Relationship</legend>
              <input
                v-model="employeeData.emergency_contact.relationship"
                type="text"
                class="border-b-1 w-full outline-none border-gray-300 p-0 pt-3 text-black"
              />
            </div>

            <!-- Emergency Contact Number -->
            <div>
              <legend class="fieldset-legend text-black text-xs justify-start">
                Contact Number
              </legend>
              <input
                v-model="employeeData.emergency_contact.contact_number"
                type="text"
                placeholder="09xxxxxxxxx"
                maxlength="11"
                class="border-b-1 w-full outline-none border-gray-300 p-0 pt-3 text-black"
              />
            </div>
          </div>

          <!-- Form Buttons -->
          <div class="btn-container flex justify-end mt-6 gap-2">
            <button
              @click="handleUpdate"
              class="btn-primaryStyle btn-sm bg-primaryColor border-none text-white shadow-none"
            >
              Update
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <dialog ref="confirmModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-lg text-black">Confirm Update Employee</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>

        <div v-if="employeeToUpdate" class="py-4">
          <p class="text-center text-black mb-4">
            Update information for
            <span class="font-bold"
              >{{ employeeToUpdate.first_name }} {{ employeeToUpdate.middle_name }}
              {{ employeeToUpdate.last_name }}</span
            >?
          </p>

          <div class="mt-4 flex flex-col gap-2">
            <template v-if="changedFields.size > 0">
              <div class="text-sm font-semibold mb-2">Changed Fields:</div>
              <template v-for="field in Array.from(changedFields)" :key="field">
                <div class="flex flex-row" v-if="employeeToUpdate[field]">
                  <div class="w-32 text-gray-500">{{ formatFieldName(field) }}:</div>
                  <div class="text-black">{{ employeeToUpdate[field] }}</div>
                </div>
              </template>
            </template>

            <!-- File Updates Section -->
            <template
              v-if="formDataToUpdate?.has('profile_picture') || formDataToUpdate?.has('resume')"
            >
              <div class="text-sm font-semibold mt-3 mb-2">File Updates:</div>
              <div v-if="formDataToUpdate?.has('profile_picture')" class="flex flex-row">
                <div class="w-32 text-gray-500">Profile Image:</div>
                <div class="text-black">New image selected</div>
              </div>
              <div v-if="formDataToUpdate?.has('resume')" class="flex flex-row">
                <div class="w-32 text-gray-500">Resume:</div>
                <div class="text-black">New resume selected</div>
              </div>
            </template>
          </div>
        </div>

        <div class="modal-action justify-center gap-4">
          <button
            class="btn-primaryStyle bg-primaryColor border-none text-white shadow-none"
            @click="confirmUpdate"
          >
            Update Employee
          </button>
          <button
            class="btn-secondaryStyle bg-gray-400 border-none text-white shadow-none"
            @click="cancelUpdate"
          >
            Cancel
          </button>
        </div>
      </div>
    </dialog>

    <!-- Add Toast component -->
    <Toast :show="showToast" :message="toastMessage" :type="toastType" />
  </div>
</template>
