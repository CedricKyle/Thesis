<script setup>
import { ChevronLeft, ChevronRight, Eye, EyeOff, Check, X } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import { useRolesStore } from '@/stores/Users & Role/roleStore'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/Users & Role/userStore'
import { useNotification } from '@/composables/Admin Composables/User & Role/role/useNotification'

const router = useRouter()
const step = ref(1)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const selectedRole = ref('')
const removeSelectedRole = ref(false)

// Reactive form data
const formData = ref({
  fullName: '',
  email: '',
  contactNumber: '',
  gender: '',
  dateOfBirth: '',
  password: '',
  confirmPassword: '',
})

// Form errors object
const formErrors = ref({
  fullName: '',
  email: '',
  contactNumber: '',
  gender: '',
  dateOfBirth: '',
  password: '',
  confirmPassword: '',
})

// Add roles store
const rolesStore = useRolesStore()
const { roles } = storeToRefs(rolesStore)

// Add user store
const userStore = useUserStore()
const { showNotification } = useNotification()
const confirmModal = ref(null)

// Fetch roles on component mount
onMounted(async () => {
  try {
    await rolesStore.fetchRoles()
  } catch (error) {
    console.error('Error fetching roles:', error)
  }
})

// Validation function for General Information
const validateGeneralInfo = () => {
  let isValid = true
  formErrors.value = {
    fullName: '',
    email: '',
    contactNumber: '',
    gender: '',
    dateOfBirth: '',
  }

  if (!formData.value.fullName) {
    formErrors.value.fullName = 'Full Name is required'
    isValid = false
  }
  if (!formData.value.email) {
    formErrors.value.email = 'Email is required'
    isValid = false
  } else if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(formData.value.email)) {
    formErrors.value.email = 'Email must be a Gmail address'
    isValid = false
  }
  if (!formData.value.contactNumber) {
    formErrors.value.contactNumber = 'Contact Number is required'
    isValid = false
  } else if (!/^09\d{9}$/.test(formData.value.contactNumber)) {
    formErrors.value.contactNumber =
      'Contact Number must be a valid Philippine number (e.g., 09XXXXXXXXX)'
    isValid = false
  }
  if (!formData.value.gender) {
    formErrors.value.gender = 'Gender is required'
    isValid = false
  }
  if (!formData.value.dateOfBirth) {
    formErrors.value.dateOfBirth = 'Date of Birth is required'
    isValid = false
  }

  return isValid
}

// Add password validation function
const validateSecurity = () => {
  let isValid = true
  formErrors.value.password = ''
  formErrors.value.confirmPassword = ''

  // Password validation
  if (!formData.value.password) {
    formErrors.value.password = 'Password is required'
    isValid = false
  } else if (formData.value.password.length < 8) {
    formErrors.value.password = 'Password must be at least 8 characters long'
    isValid = false
  }

  // Confirm password validation
  if (!formData.value.confirmPassword) {
    formErrors.value.confirmPassword = 'Confirm Password is required'
    isValid = false
  } else if (formData.value.password !== formData.value.confirmPassword) {
    formErrors.value.confirmPassword = 'Passwords do not match'
    isValid = false
  }

  return isValid
}

// Add this to your script section
const validateRole = () => {
  let isValid = true

  if (!selectedRole.value) {
    isValid = false
    // You might want to add a visual indication that role selection is required
  }

  return isValid
}

// Update the handleNext function to include role validation
const handleNext = () => {
  if (step.value === 1 && validateGeneralInfo()) {
    step.value++
  } else if (step.value === 2 && validateSecurity()) {
    step.value++
  } else if (step.value === 3 && validateRole()) {
    step.value++
  }
}

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

const toggleConfirmPassword = () => {
  showConfirmPassword.value = !showConfirmPassword.value
}

const toggleShowSelectedRole = () => {
  selectedRole.value = ''
  removeSelectedRole.value = false
}

// Update selectRole function to handle v-model
const handleRoleSelect = (event) => {
  selectedRole.value = event.target.value
  removeSelectedRole.value = true
}

// Add save related functions
const handleSubmit = () => {
  confirmModal.value?.showModal()
}

const confirmSave = async () => {
  try {
    const userData = {
      fullName: formData.value.fullName,
      email: formData.value.email,
      contactNumber: formData.value.contactNumber,
      gender: formData.value.gender,
      dateOfBirth: formData.value.dateOfBirth,
      password: formData.value.password,
      role: selectedRole.value,
      createdAt: new Date().toISOString(),
      status: 'Active',
    }

    await userStore.createUser(userData)
    confirmModal.value?.close()
    showNotification('User created successfully', 'success')
    router.push({ name: 'UserManagement' })
  } catch (error) {
    showNotification(error.message, 'error')
  }
}

const cancelSave = () => {
  confirmModal.value?.close()
}
</script>

<template>
  <div class="container p-5 text-black">
    <div class="title flex items-center gap-2">
      <ChevronLeft
        class="w-6 h-6 cursor-pointer hover:bg-primaryColor/20 rounded-full"
        @click="router.back()"
      />
      <div class="text-[24px] font-semibold">Create User</div>
    </div>

    <div class="flex gap-2 flex-col">
      <!-- form status -->
      <div class="bg-white rounded-md p-5 mt-5 border border-gray-200 shadow-sm">
        <!-- steps -->
        <div class="">
          <ul class="steps w-full text-xs [--size:1rem] [--success:var(--color-primaryColor)]">
            <li
              class="step text-gray-400"
              :class="{
                'step-success': step >= 1,
                '!text-black': step === 1,
              }"
            >
              General Information
            </li>
            <li
              class="step text-gray-400"
              :class="{
                'step-success ': step >= 2,
                '!text-black': step === 2,
              }"
            >
              Security
            </li>
            <li
              class="step text-gray-400"
              :class="{
                'step-success': step >= 3,
                '!text-black': step === 3,
              }"
            >
              Roles
            </li>
            <li
              class="step text-gray-400"
              :class="{ 'step-success': step >= 4, '!text-black': step === 4 }"
            >
              Overview
            </li>
          </ul>
        </div>
      </div>

      <!-- general information step -->
      <div v-if="step === 1" class="mt-5 border border-gray-200 rounded-md p-5 bg-white shadow-sm">
        <div class="font-semibold">General Information</div>

        <!-- form -->
        <div class="mt-5">
          <div class="grid grid-cols-2 gap-5">
            <div class="col-span-2">
              <legend class="fieldset-legend text-black text-xs">Full Name</legend>
              <input
                v-model="formData.fullName"
                type="text"
                placeholder=""
                class="input w-full bg-gray-100 border border-gray-200 !outline-none"
              />
              <span class="text-red-500 text-xs">{{ formErrors.fullName }}</span>
            </div>

            <div class="w-full">
              <legend class="fieldset-legend text-black text-xs">Gender</legend>
              <select
                v-model="formData.gender"
                class="select w-full focus:outline-none bg-gray-100 border-gray-200 text-black"
              >
                <option disabled value="">Select Gender</option>
                <option>Male</option>
                <option>Female</option>
              </select>
              <span class="text-red-500 text-xs">{{ formErrors.gender }}</span>
            </div>

            <div class="w-full">
              <legend class="fieldset-legend text-black text-xs">Date of Birth</legend>
              <input
                v-model="formData.dateOfBirth"
                type="date"
                class="input w-full bg-gray-100 border border-gray-200 !outline-none"
              />
              <span class="text-red-500 text-xs">{{ formErrors.dateOfBirth }}</span>
            </div>
          </div>
          <!-- contact info -->
          <div class="mt-5">
            <div class="text-sm font-semibold">Contact Information</div>

            <div class="grid grid-cols-2 gap-5">
              <div class="">
                <legend class="fieldset-legend text-black text-xs">Email</legend>
                <input
                  v-model="formData.email"
                  type="email"
                  placeholder="email address"
                  class="input w-full bg-gray-100 border border-gray-200 !outline-none"
                />
                <span class="text-red-500 text-xs">{{ formErrors.email }}</span>
              </div>
              <div class="">
                <legend class="fieldset-legend text-black text-xs">Contact Number</legend>
                <input
                  v-model="formData.contactNumber"
                  type="text"
                  placeholder="09xxxxxxxxx"
                  class="input w-full bg-gray-100 border border-gray-200 !outline-none"
                  maxlength="11"
                />
                <span class="text-red-500 text-xs">{{ formErrors.contactNumber }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- security step -->
      <div v-if="step === 2" class="mt-5 border border-gray-200 rounded-md p-5 bg-white shadow-sm">
        <div class="font-semibold">Security</div>
        <div class="grid grid-cols-2 gap-5">
          <!-- password -->
          <div class="">
            <legend class="fieldset-legend text-black text-xs">Password</legend>
            <div class="relative">
              <input
                v-model="formData.password"
                :type="showPassword ? 'text' : 'password'"
                class="input w-full bg-gray-100 border border-gray-200 !outline-none"
                placeholder="Minimum 8 characters"
              />
              <Eye
                v-if="!showPassword"
                class="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 w-4 h-4"
                @click="togglePassword"
              />
              <EyeOff
                v-else
                class="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 w-4 h-4"
                @click="togglePassword"
              />
              <span class="text-red-500 text-xs">{{ formErrors.password }}</span>
            </div>
          </div>

          <!-- confirm password -->
          <div class="">
            <legend class="fieldset-legend text-black text-xs">Confirm Password</legend>
            <div class="relative">
              <input
                v-model="formData.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                class="input w-full bg-gray-100 border border-gray-200 !outline-none"
                placeholder="Re-enter password"
              />
              <Eye
                v-if="!showConfirmPassword"
                class="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 w-4 h-4"
                @click="toggleConfirmPassword"
              />
              <EyeOff
                v-else
                class="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 w-4 h-4"
                @click="toggleConfirmPassword"
              />
              <span class="text-red-500 text-xs">{{ formErrors.confirmPassword }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- role step -->
      <div v-if="step === 3" class="mt-5 border border-gray-200 rounded-md p-5 bg-white shadow-sm">
        <div class="font-semibold">Roles</div>
        <div class="flex gap-5 flex-col">
          <div class="w-full">
            <legend class="fieldset-legend text-black text-xs">Select Role</legend>
            <select
              v-model="selectedRole"
              class="select w-full focus:outline-none bg-gray-100 border-gray-200 text-black"
              @change="handleRoleSelect"
            >
              <option disabled value="">Select Role</option>
              <option v-for="role in roles" :key="role['role name']" :value="role['role name']">
                {{ role['role name'] }}
              </option>
            </select>
          </div>
          <!-- selected role container -->
          <div class="">
            <legend class="fieldset-legend text-black text-xs">Selected Role</legend>
            <div
              class="bg-gray-100 rounded-md p-2 border border-gray-200 flex items-center justify-between"
            >
              <div class="">
                <p class="">
                  {{ selectedRole }}
                </p>
              </div>
              <div
                v-if="selectedRole"
                class="cursor-pointer hover:bg-red-500/20 rounded-full p-1"
                @click="toggleShowSelectedRole"
              >
                <X class="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- overview step -->
      <div v-if="step === 4" class="mt-5 border border-gray-200 rounded-md p-5 bg-white shadow-sm">
        <div class="font-semibold mb-4">Overview</div>

        <!-- Overview list -->
        <div class="flex flex-col gap-2 p-5 border border-gray-200 rounded-md">
          <!-- General Information -->
          <div class="mb-4 text-sm flex flex-col gap-1">
            <h4 class="font-semibold mb-2">General Information</h4>
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">Full Name</div>
              <div>{{ formData.fullName }}</div>
            </div>
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">Gender</div>
              <div>{{ formData.gender }}</div>
            </div>
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">Date of Birth</div>
              <div>{{ formData.dateOfBirth }}</div>
            </div>
          </div>

          <!-- Contact Information -->
          <div class="mb-4 text-sm flex flex-col gap-1">
            <h4 class="font-semibold mb-2">Contact Information</h4>
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">Email</div>
              <div>{{ formData.email }}</div>
            </div>
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">Contact Number</div>
              <div>{{ formData.contactNumber }}</div>
            </div>
          </div>

          <!-- Security Information -->
          <div class="mb-4 text-sm flex flex-col gap-1">
            <h4 class="font-semibold mb-2">Security Information</h4>
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">Password</div>
              <div class="flex items-center gap-2">
                <div>{{ showPassword ? formData.password : '********' }}</div>
                <div class="cursor-pointer" @click="togglePassword">
                  <Eye v-if="!showPassword" class="w-4 h-4 text-gray-500" />
                  <EyeOff v-else class="w-4 h-4 text-gray-500" />
                </div>
              </div>
            </div>
          </div>

          <!-- Role Information -->
          <div class="mb-4 text-sm flex flex-col gap-1">
            <h4 class="font-semibold mb-2">Role Information</h4>
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">Role</div>
              <div>{{ selectedRole || 'No role selected' }}</div>
            </div>
            <!-- Add role description if available -->
            <div v-if="selectedRole" class="flex flex-row">
              <div class="w-40 text-gray-500">Role Description</div>
              <div>
                {{ roles.find((role) => role['role name'] === selectedRole)?.description || '' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- for back and next btn -->
    <div class="flex justify-between items-center mt-5">
      <button
        class="btn-secondaryStyle disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="step === 1"
        @click="step--"
      >
        <ChevronLeft class="w-4 h-4" /> Back
      </button>
      <button
        class="btn-primaryStyle disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="step === 4"
        @click="handleNext"
      >
        Next <ChevronRight class="w-4 h-4" />
      </button>
      <button v-if="step === 4" class="btn-primaryStyle" @click="handleSubmit">
        Save<Check class="w-4 h-4" />
      </button>
    </div>
  </div>

  <!-- Update the confirmation modal -->
  <dialog ref="confirmModal" class="modal">
    <div class="modal-box bg-white w-[400px]">
      <h3 class="font-bold text-lg text-black">Confirm User Creation</h3>
      <div
        class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
      ></div>

      <div class="py-4">
        <p class="text-black mb-4">Are you sure you want to create this user?</p>

        <div class="bg-gray-50 p-4 rounded-md">
          <div class="grid gap-3 text-sm">
            <div class="flex items-center">
              <span class="text-gray-500 w-24">Full Name:</span>
              <span class="text-black">{{ formData.fullName }}</span>
            </div>
            <div class="flex items-center">
              <span class="text-gray-500 w-24">Email:</span>
              <span class="text-black">{{ formData.email }}</span>
            </div>
            <div class="flex items-center">
              <span class="text-gray-500 w-24">Contact:</span>
              <span class="text-black">{{ formData.contactNumber }}</span>
            </div>
            <div class="flex items-center">
              <span class="text-gray-500 w-24">Role:</span>
              <span class="text-black">{{ selectedRole }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-action flex justify-center gap-3">
        <button class="btn-primaryStyle" @click="confirmSave">Confirm</button>
        <button class="btn-secondaryStyle" @click="cancelSave">Cancel</button>
      </div>
    </div>
  </dialog>
</template>

<style>
.error {
  color: red;
  font-size: 0.875em;
}
</style>
