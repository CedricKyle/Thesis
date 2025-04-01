<script setup>
import { ref, computed } from 'vue'
import { Search, Upload, Eye } from 'lucide-vue-next'
import profilePlaceholder from '@/assets/Images/profile-placeholder.png'

// State management
const state = ref({
  currentPage: 1,
  itemsPerPage: 8,
  searchQuery: '',
  sortBy: 'id',
  sortDesc: false,
  employees: [
    {
      id: '2024-50000',
      fullName: 'John Doe',
      department: 'IT Department',
      jobTitle: 'Software Engineer',
      email: 'john.doe@example.com',
      contactNumber: '09123456789',
      dateOfHire: '2024-03-20',
      dateOfBirth: '1990-01-01',
      gender: 'Male',
      maritalStatus: 'Single',
      address: '123 Main St',
      emergencyContact: {
        fullName: 'Jane Doe',
        contactNumber: '09876543210',
      },
    },
  ],
  // Add form state
  newEmployee: {
    id: '',
    fullName: '',
    department: '',
    jobTitle: '',
    dateOfHire: '',
    dateOfBirth: '',
    gender: '',
    maritalStatus: '',
    contactNumber: '',
    email: '',
    address: '',
    emergencyContact: {
      fullName: '',
      contactNumber: '',
    },
    profileImage: '',
  },
  showUploadText: true,
  profilePlaceholder: profilePlaceholder,
  showViewModal: false,
  selectedEmployee: null,
})

// Form validation state
const formErrors = ref({
  professional: {
    dateOfHire: '',
    department: '',
    jobTitle: '',
  },
  personal: {
    fullName: '',
    dateOfBirth: '',
    gender: '',
    maritalStatus: '',
    contactNumber: '',
    email: '',
    address: '',
  },
  emergencyContact: {
    fullName: '',
    contactNumber: '',
  },
})

// Form validation functions
const validateProfessionalInfo = () => {
  let isValid = true
  const errors = formErrors.value.professional

  // Date of Hire validation
  if (!state.value.newEmployee.dateOfHire) {
    errors.dateOfHire = 'Date of hire is required'
    isValid = false
  } else {
    errors.dateOfHire = ''
  }

  // Department validation
  if (!state.value.newEmployee.department) {
    errors.department = 'Department is required'
    isValid = false
  } else {
    errors.department = ''
  }

  // Job Title validation
  if (!state.value.newEmployee.jobTitle) {
    errors.jobTitle = 'Job title is required'
    isValid = false
  } else {
    errors.jobTitle = ''
  }

  return isValid
}

const validatePersonalInfo = () => {
  let isValid = true
  const errors = formErrors.value.personal

  // Full Name validation
  if (!state.value.newEmployee.fullName) {
    errors.fullName = 'Full name is required'
    isValid = false
  } else if (state.value.newEmployee.fullName.length < 2) {
    errors.fullName = 'Full name must be at least 2 characters'
    isValid = false
  } else {
    errors.fullName = ''
  }

  // Date of Birth validation
  if (!state.value.newEmployee.dateOfBirth) {
    errors.dateOfBirth = 'Date of birth is required'
    isValid = false
  } else {
    const birthDate = new Date(state.value.newEmployee.dateOfBirth)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    if (age < 18) {
      errors.dateOfBirth = 'Employee must be at least 18 years old'
      isValid = false
    } else {
      errors.dateOfBirth = ''
    }
  }

  // Gender validation
  if (!state.value.newEmployee.gender) {
    errors.gender = 'Gender is required'
    isValid = false
  } else {
    errors.gender = ''
  }

  // Marital Status validation
  if (!state.value.newEmployee.maritalStatus) {
    errors.maritalStatus = 'Marital status is required'
    isValid = false
  } else {
    errors.maritalStatus = ''
  }

  // Contact Number validation (Philippine format)
  const phoneRegex = /^09\d{9}$/
  if (!state.value.newEmployee.contactNumber) {
    errors.contactNumber = 'Contact number is required'
    isValid = false
  } else if (!phoneRegex.test(state.value.newEmployee.contactNumber)) {
    errors.contactNumber = 'Invalid Philippine contact number (format: 09XXXXXXXXX)'
    isValid = false
  } else {
    errors.contactNumber = ''
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!state.value.newEmployee.email) {
    errors.email = 'Email is required'
    isValid = false
  } else if (!emailRegex.test(state.value.newEmployee.email)) {
    errors.email = 'Invalid email format'
    isValid = false
  } else {
    errors.email = ''
  }

  // Address validation
  if (!state.value.newEmployee.address) {
    errors.address = 'Address is required'
    isValid = false
  } else {
    errors.address = ''
  }

  return isValid
}

const validateEmergencyContact = () => {
  let isValid = true
  const errors = formErrors.value.emergencyContact

  // Emergency Contact Name
  if (!state.value.newEmployee.emergencyContact.fullName) {
    errors.fullName = 'Emergency contact name is required'
    isValid = false
  } else {
    errors.fullName = ''
  }

  // Emergency Contact Number (Philippine format)
  const phoneRegex = /^09\d{9}$/
  if (!state.value.newEmployee.emergencyContact.contactNumber) {
    errors.contactNumber = 'Emergency contact number is required'
    isValid = false
  } else if (!phoneRegex.test(state.value.newEmployee.emergencyContact.contactNumber)) {
    errors.contactNumber = 'Invalid Philippine contact number (format: 09XXXXXXXXX)'
    isValid = false
  } else {
    errors.contactNumber = ''
  }

  return isValid
}

// Form handling
const handleFormSubmit = () => {
  // Validate all sections
  const isProfessionalValid = validateProfessionalInfo()
  const isPersonalValid = validatePersonalInfo()
  const isEmergencyValid = validateEmergencyContact()

  if (!isProfessionalValid || !isPersonalValid || !isEmergencyValid) {
    alert('Please fill in all required fields correctly')
    return
  }

  // Generate new employee ID based on hire year
  const hireYear = new Date(state.value.newEmployee.dateOfHire).getFullYear()

  // Get the current highest number for this year
  const yearEmployees = state.value.employees
    .filter((emp) => emp.id.startsWith(hireYear.toString()))
    .map((emp) => parseInt(emp.id.split('-')[1]))

  const nextNumber = yearEmployees.length > 0 ? Math.max(...yearEmployees) + 1 : 50000 // Start from 50000 if no employees for this year

  const newId = `${hireYear}-${nextNumber.toString().padStart(5, '0')}`

  // Create new employee object with the generated ID
  const employeeData = {
    ...state.value.newEmployee,
    id: newId,
  }

  state.value.employees.push(employeeData)
  alert('Employee added successfully!')
  resetForm()
}

const resetForm = () => {
  state.value.newEmployee = {
    id: '',
    fullName: '',
    department: '',
    jobTitle: '',
    dateOfHire: '',
    dateOfBirth: '',
    gender: '',
    maritalStatus: '',
    contactNumber: '',
    email: '',
    address: '',
    emergencyContact: {
      fullName: '',
      contactNumber: '',
    },
    profileImage: '',
  }
  state.value.showUploadText = true

  // Reset all error messages
  formErrors.value = {
    professional: {
      dateOfHire: '',
      department: '',
      jobTitle: '',
    },
    personal: {
      fullName: '',
      dateOfBirth: '',
      gender: '',
      maritalStatus: '',
      contactNumber: '',
      email: '',
      address: '',
    },
    emergencyContact: {
      fullName: '',
      contactNumber: '',
    },
  }
}

// Computed properties for filtering and sorting
const filteredEmployees = computed(() => {
  let records = [...state.value.employees]

  if (state.value.searchQuery) {
    const query = state.value.searchQuery.toLowerCase()
    records = records.filter(
      (employee) =>
        employee.fullName.toLowerCase().includes(query) ||
        employee.department.toLowerCase().includes(query) ||
        employee.jobTitle.toLowerCase().includes(query) ||
        employee.email.toLowerCase().includes(query),
    )
  }

  records.sort((a, b) => {
    const comparison =
      state.value.sortBy === 'id' ? a.id.localeCompare(b.id) : a.fullName.localeCompare(b.fullName)
    return state.value.sortDesc ? -comparison : comparison
  })

  return records
})

const paginatedEmployees = computed(() => {
  const start = (state.value.currentPage - 1) * state.value.itemsPerPage
  const end = start + state.value.itemsPerPage
  return filteredEmployees.value.slice(start, end)
})

const totalPages = computed(() =>
  Math.ceil(filteredEmployees.value.length / state.value.itemsPerPage),
)

// Sorting handler
const handleSort = (column) => {
  if (state.value.sortBy === column) {
    state.value.sortDesc = !state.value.sortDesc
  } else {
    state.value.sortBy = column
    state.value.sortDesc = false
  }
}

// Add these new functions for profile image handling
const handleProfileUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should not exceed 5MB')
      return
    }

    // Create URL for preview
    const reader = new FileReader()
    reader.onload = (e) => {
      state.value.newEmployee.profileImage = e.target.result
      state.value.showUploadText = false
    }
    reader.readAsDataURL(file)
  }
}

const removeProfile = () => {
  state.value.newEmployee.profileImage = ''
  state.value.showUploadText = true
}

// View employee details
const viewEmployee = (employee) => {
  state.value.selectedEmployee = employee
  state.value.showViewModal = true
}
</script>

<template>
  <div class="employees-container">
    <!-- name of each tab group should be unique -->
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
        <!-- Employee list content will go here -->
        <div class="flex flex-col gap-8 mt-4">
          <!-- search container -->
          <div class="search-container flex justify-between items-center">
            <div class="flex items-center gap-2 border-b-1 border-gray-500 w-96">
              <div class="flex">
                <Search class="w-5 h-5 text-gray-500 cursor-pointer" />
              </div>
              <div class="">
                <input
                  v-model="state.searchQuery"
                  type="text"
                  placeholder="Search"
                  class="h-10 p-2 outline-none placeholder:text-gray-500 text-black"
                />
              </div>
            </div>
          </div>

          <!-- table container -->
          <div class="overflow-x-auto border shadow-lg">
            <table class="table text-black">
              <!-- head -->
              <thead class="bg-primaryColor text-white">
                <tr>
                  <th @click="handleSort('id')" class="cursor-pointer">
                    Employee ID
                    <span v-if="state.sortBy === 'id'" class="ml-1">
                      {{ state.sortDesc ? '↓' : '↑' }}
                    </span>
                  </th>
                  <th @click="handleSort('fullName')" class="cursor-pointer">
                    Full Name
                    <span v-if="state.sortBy === 'fullName'" class="ml-1">
                      {{ state.sortDesc ? '↓' : '↑' }}
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
                <tr
                  v-for="employee in paginatedEmployees"
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
                    <button class="btn btn-sm btn-circle btn-ghost" @click="viewEmployee(employee)">
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
              v-for="page in totalPages"
              :key="page"
              @click="state.currentPage = page"
              class="btn btn-sm"
              :class="state.currentPage === page ? 'bg-primaryColor text-white' : 'bg-gray-200'"
            >
              {{ page }}
            </button>
          </div>
        </div>
      </div>

      <!-- Add Employee Tab -->
      <input type="radio" name="my_tabs_2" class="tab" aria-label="Add Employee" />
      <div class="tab-content bg-white p-5">
        <div class="flex gap-4 container h-[600px] text-black">
          <div
            class="professional-container w-[30%] border border-gray-200 p-5 rounded-md shadow-md overflow-y-auto"
          >
            <div class="flex flex-col gap-4 m-5">
              <!-- profile selection -->
              <div class="profile-selection">
                <div class="avatar justify-center items-center flex flex-col gap-2">
                  <div
                    class="cursor-pointer ring-secondaryColor w-24 h-24 rounded-full ring ring-offset-2 relative group"
                  >
                    <!-- Profile Image -->
                    <img
                      :src="state.newEmployee.profileImage || state.profilePlaceholder"
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
                      v-if="state.newEmployee.profileImage"
                      @click="removeProfile"
                      class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>

                  <!-- Upload text -->
                  <div
                    v-if="state.showUploadText"
                    class="text-sm text-gray-500 h-10 w-full flex items-center justify-center"
                  >
                    <div class="flex justify-center gap-2">
                      <p>Upload Profile</p>
                      <Upload class="w-4 h-4 text-gray-500 cursor-pointer" />
                    </div>
                  </div>
                </div>
              </div>
              <div class="title font-bold text-lg">Professional Information</div>

              <div class="form-control flex flex-col gap-5">
                <!-- Employee ID will be auto-generated -->
                <div class="">
                  <legend class="fieldset-legend text-black text-xs">Date of Hire</legend>
                  <input
                    v-model="state.newEmployee.dateOfHire"
                    type="date"
                    class="border-b-1 w-full outline-none border-gray-300 p-0 pt-3 text-black"
                    :class="{ 'border-red-500': formErrors.professional.dateOfHire }"
                  />
                  <span v-if="formErrors.professional.dateOfHire" class="text-red-500 text-xs mt-1">
                    {{ formErrors.professional.dateOfHire }}
                  </span>
                </div>

                <div class="">
                  <legend class="fieldset-legend text-black text-xs">Department</legend>
                  <select
                    v-model="state.newEmployee.department"
                    class="select focus:outline-none bg-white border-black text-black"
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
                    v-model="state.newEmployee.jobTitle"
                    class="select focus:outline-none bg-white border-black text-black"
                  >
                    <option disabled value="">Select Job Title</option>
                    <option>HR Manager</option>
                    <option>Financial Analyst</option>
                    <option>Sales Manager</option>
                    <option>Supply Chain Manager</option>
                    <option>Customer Service Representative</option>
                  </select>
                  <span v-if="formErrors.professional.jobTitle" class="text-red-500 text-xs mt-1">
                    {{ formErrors.professional.jobTitle }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div
            class="divider lg:divider-horizontal m-0 before:bg-gray-200 after:bg-gray-200 before:h-[.5px] after:h-[.5px]"
          ></div>

          <div
            class="personal-container w-[70%] border border-gray-200 p-5 rounded-md shadow-md overflow-y-auto"
          >
            <div class="container flex flex-col gap-2">
              <div class="title font-bold text-lg">Personal Information</div>
              <div
                class="divider m-0 before:bg-gray-200 after:bg-gray-200 before:h-[3px] after:h-[3px]"
              ></div>

              <div class="form-control grid grid-cols-2 gap-5">
                <div class="">
                  <legend class="fieldset-legend text-black text-xs">Full Name</legend>
                  <input
                    v-model="state.newEmployee.fullName"
                    type="text"
                    class="border-b-1 w-full outline-none border-gray-300 p-0 pt-3 text-black"
                    :class="{ 'border-red-500': formErrors.personal.fullName }"
                  />
                  <span v-if="formErrors.personal.fullName" class="text-red-500 text-xs mt-1">
                    {{ formErrors.personal.fullName }}
                  </span>
                </div>

                <div class="">
                  <legend class="fieldset-legend text-black text-xs">Date of Birth</legend>
                  <input
                    v-model="state.newEmployee.dateOfBirth"
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
                  <div class="border-b-1 border-gray-300 p-0">
                    <select
                      v-model="state.newEmployee.gender"
                      class="select !outline-none bg-white w-full p-0 text-black"
                      :class="{ 'border-red-500': formErrors.personal.gender }"
                    >
                      <option disabled value="">Select Gender</option>
                      <option>Male</option>
                      <option>Female</option>
                    </select>
                  </div>
                  <span v-if="formErrors.personal.gender" class="text-red-500 text-xs mt-1">
                    {{ formErrors.personal.gender }}
                  </span>
                </div>

                <div class="">
                  <legend class="fieldset-legend text-black text-xs">Marital Status</legend>
                  <div class="border-b-1 border-gray-300 p-0">
                    <select
                      v-model="state.newEmployee.maritalStatus"
                      class="select !outline-none bg-white w-full p-0 text-black"
                      :class="{ 'border-red-500': formErrors.personal.maritalStatus }"
                    >
                      <option disabled value="">Select Marital Status</option>
                      <option>Single</option>
                      <option>Married</option>
                      <option>Divorced</option>
                      <option>Widowed</option>
                    </select>
                  </div>
                  <span v-if="formErrors.personal.maritalStatus" class="text-red-500 text-xs mt-1">
                    {{ formErrors.personal.maritalStatus }}
                  </span>
                </div>

                <div class="">
                  <legend class="fieldset-legend text-black text-xs">Contact Number</legend>
                  <input
                    v-model="state.newEmployee.contactNumber"
                    type="text"
                    placeholder="09XXXXXXXXX"
                    class="border-b-1 w-full outline-none border-gray-300 p-0 pt-3 text-black"
                    :class="{ 'border-red-500': formErrors.personal.contactNumber }"
                    maxlength="11"
                  />
                  <span v-if="formErrors.personal.contactNumber" class="text-red-500 text-xs mt-1">
                    {{ formErrors.personal.contactNumber }}
                  </span>
                </div>

                <div class="">
                  <legend class="fieldset-legend text-black text-xs">Email Address</legend>
                  <input
                    v-model="state.newEmployee.email"
                    type="email"
                    placeholder="@example.com"
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
                    v-model="state.newEmployee.address"
                    type="text"
                    class="border-b-1 w-full outline-none border-gray-300 p-0 pt-3 text-black"
                    :class="{ 'border-red-500': formErrors.personal.address }"
                  />
                  <span v-if="formErrors.personal.address" class="text-red-500 text-xs mt-1">
                    {{ formErrors.personal.address }}
                  </span>
                </div>
              </div>

              <div class="title font-bold text-lg">Emergency Contact</div>
              <div class="form-control grid grid-cols-2 gap-5">
                <div class="">
                  <legend class="fieldset-legend text-black text-xs">Full Name</legend>
                  <input
                    v-model="state.newEmployee.emergencyContact.fullName"
                    type="text"
                    class="border-b-1 w-full outline-none border-gray-300 p-0 pt-3 text-black"
                    :class="{ 'border-red-500': formErrors.emergencyContact.fullName }"
                  />
                  <span
                    v-if="formErrors.emergencyContact.fullName"
                    class="text-red-500 text-xs mt-1"
                  >
                    {{ formErrors.emergencyContact.fullName }}
                  </span>
                </div>

                <div class="">
                  <legend class="fieldset-legend text-black text-xs">Contact Number</legend>
                  <input
                    v-model="state.newEmployee.emergencyContact.contactNumber"
                    type="text"
                    class="border-b-1 w-full outline-none border-gray-300 p-0 pt-3 text-black"
                    :class="{ 'border-red-500': formErrors.emergencyContact.contactNumber }"
                    maxlength="11"
                  />
                  <span
                    v-if="formErrors.emergencyContact.contactNumber"
                    class="text-red-500 text-xs mt-1"
                  >
                    {{ formErrors.emergencyContact.contactNumber }}
                  </span>
                </div>
              </div>

              <div class="btn-container flex justify-end mt-3 gap-2">
                <button
                  @click="handleFormSubmit"
                  class="btn btn-sm bg-secondaryColor border-none text-white shadow-none"
                >
                  Save
                </button>
                <button
                  @click="resetForm"
                  class="btn btn-sm bg-gray-400 border-none text-white shadow-none"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Department Management Tab -->
      <input type="radio" name="my_tabs_2" class="tab" aria-label="Departments" />
      <div class="tab-content bg-white p-2">
        <!-- Department management content will go here -->
        <h2 class="text-2xl font-semibold mb-4">Department Management</h2>
      </div>
    </div>

    <!-- Add View Modal -->
    <dialog :open="state.showViewModal" class="modal">
      <div class="modal-box bg-white text-black">
        <h3 class="font-bold text-lg">Employee Details</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>

        <div v-if="state.selectedEmployee" class="pt-4 flex flex-col gap-2">
          <!-- Employee Image -->
          <div class="flex justify-center mb-4">
            <div class="w-24 h-24 rounded-full overflow-hidden">
              <img
                :src="state.selectedEmployee.profileImage || profilePlaceholder"
                class="w-full h-full object-cover"
              />
            </div>
          </div>

          <!-- Professional Information -->
          <div class="mb-4">
            <h4 class="font-semibold mb-2">Professional Information</h4>
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">Employee ID</div>
              <div>{{ state.selectedEmployee.id }}</div>
            </div>
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">Department</div>
              <div>{{ state.selectedEmployee.department }}</div>
            </div>
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">Job Title</div>
              <div>{{ state.selectedEmployee.jobTitle }}</div>
            </div>
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">Date of Hire</div>
              <div>{{ state.selectedEmployee.dateOfHire }}</div>
            </div>
          </div>

          <!-- Personal Information -->
          <div class="mb-4">
            <h4 class="font-semibold mb-2">Personal Information</h4>
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">Full Name</div>
              <div>{{ state.selectedEmployee.fullName }}</div>
            </div>
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">Date of Birth</div>
              <div>{{ state.selectedEmployee.dateOfBirth }}</div>
            </div>
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">Gender</div>
              <div>{{ state.selectedEmployee.gender }}</div>
            </div>
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">Marital Status</div>
              <div>{{ state.selectedEmployee.maritalStatus }}</div>
            </div>
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">Contact Number</div>
              <div>{{ state.selectedEmployee.contactNumber }}</div>
            </div>
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">Email</div>
              <div>{{ state.selectedEmployee.email }}</div>
            </div>
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">Address</div>
              <div>{{ state.selectedEmployee.address }}</div>
            </div>
          </div>

          <!-- Emergency Contact -->
          <div>
            <h4 class="font-semibold mb-2">Emergency Contact</h4>
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">Full Name</div>
              <div>{{ state.selectedEmployee.emergencyContact.fullName }}</div>
            </div>
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">Contact Number</div>
              <div>{{ state.selectedEmployee.emergencyContact.contactNumber }}</div>
            </div>
          </div>
        </div>

        <div class="modal-action">
          <button
            class="btn bg-gray-200 text-gray-600 border-none shadow-none"
            @click="state.showViewModal = false"
          >
            Close
          </button>
        </div>
      </div>
    </dialog>
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
