<script setup>
import { ref, computed, onMounted } from 'vue'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'
import { useRouter } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import { employeeAPI } from '@/services/main branch/api'

const router = useRouter()
const employeeStore = useEmployeeStore()
const employee = computed(() => employeeStore.currentUserEmployee)

// Form data for editing
const formData = ref({
  full_name: '',
  gender: '',
  date_of_birth: '',
  contact_number: '',
  email: '',
  address: ''
})

// Notification state
const notification = ref({
  show: false,
  message: '',
  type: 'success' // 'success' or 'error'
})

// Loading state
const isSaving = ref(false)

// Load employee data into the form
onMounted(() => {
  if (employee.value) {
    formData.value = {
      full_name: employee.value.full_name || '',
      gender: employee.value.gender || '',
      date_of_birth: employee.value.date_of_birth ? new Date(employee.value.date_of_birth).toISOString().split('T')[0] : '',
      contact_number: employee.value.contact_number || '',
      email: employee.value.email || '',
      address: employee.value.address || ''
    }
  }
})

// Form validation
const errors = ref({})

const validateForm = () => {
  errors.value = {}
  let isValid = true

  // Required fields
  if (!formData.value.full_name.trim()) {
    errors.value.full_name = 'Full name is required'
    isValid = false
  } else if (formData.value.full_name.trim().length < 3) {
    errors.value.full_name = 'Full name must be at least 3 characters'
    isValid = false
  } else if (formData.value.full_name.trim().split(' ').length < 2) {
    errors.value.full_name = 'Please enter at least first and last name'
    isValid = false
  }
  
  if (!formData.value.gender) {
    errors.value.gender = 'Gender is required'
    isValid = false
  }
  
  if (!formData.value.date_of_birth) {
    errors.value.date_of_birth = 'Date of birth is required'
    isValid = false
  }
  
  // Email validation
  if (!formData.value.email.trim()) {
    errors.value.email = 'Email is required'
    isValid = false
  } else if (!/^\S+@\S+\.\S+$/.test(formData.value.email)) {
    errors.value.email = 'Please enter a valid email address'
    isValid = false
  }
  
  // Phone validation (basic check)
  if (!formData.value.contact_number.trim()) {
    errors.value.contact_number = 'Contact number is required'
    isValid = false
  }
  
  if (!formData.value.address.trim()) {
    errors.value.address = 'Address is required'
    isValid = false
  }
  
  return isValid
}

// Collect changes without saving them
const collectChanges = () => {
  if (!validateForm()) {
    showNotification('Please correct the errors in the form', 'error')
    return
  }
  
  // Format the full name properly (trim extra spaces and ensure proper capitalization)
  const formattedFullName = formData.value.full_name
    .trim()
    .split(' ')
    .filter(part => part.length > 0) // Remove any empty parts
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()) // Proper case
    .join(' ');
  
  // Store pending changes in the employee store
  employeeStore.setPendingChanges({
    full_name: formattedFullName,
    gender: formData.value.gender,
    date_of_birth: formData.value.date_of_birth,
    contact_number: formData.value.contact_number, 
    email: formData.value.email,
    address: formData.value.address
  })
  
  console.log('Collected changes:', {
    full_name: formattedFullName,
    date_of_birth: formData.value.date_of_birth,
    contact_number: formData.value.contact_number
  });
  
  // Show notification
  showNotification('Your changes have been collected but NOT SAVED yet. Please click the "Save Changes" button on your profile page to save them permanently.', 'success')
  
  // Navigate back after 3 seconds
  setTimeout(() => {
    router.push('/profile')
  }, 3000)
}

// Show notification
const showNotification = (message, type = 'success') => {
  notification.value = {
    show: true,
    message,
    type
  }
  
  // Auto hide after 5 seconds
  setTimeout(() => {
    notification.value.show = false
  }, 5000)
}

// Go back
const goBack = () => {
  router.push('/profile')
}
</script>

<template>
  <div class="p-4">
    <!-- Back Button -->
    <button 
      @click="goBack" 
      class="mb-4 flex items-center gap-1 text-gray-600 hover:text-primaryColor transition-colors"
    >
      <ArrowLeft class="w-5 h-5" />
      <span class="text-sm">Back</span>
    </button>

    <h2 class="text-2xl font-bold mb-6">Edit Personal Information</h2>
    
    <!-- Info Message -->
    <div class="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
      <p class="text-blue-700 text-sm">
        <strong>Note:</strong> You can update your full name, contact number, and date of birth without requiring permission.
      </p>
    </div>
    
    <!-- Notification -->
    <div v-if="notification.show" class="mb-6">
      <div 
        :class="[
          'p-3 rounded-md text-white text-sm', 
          notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        ]"
      >
        {{ notification.message }}
      </div>
    </div>
    
    <div class="bg-white rounded-lg shadow-md p-6">
      <form @submit.prevent="collectChanges" class="grid gap-6">
        <!-- Full Name Field -->
        <div class="form-control">
          <label class="label">
            <span class="label-text text-gray-700">Full Name <span class="text-red-500">*</span></span>
          </label>
          <input 
            v-model="formData.full_name" 
            type="text" 
            class="input input-bordered w-full" 
            :class="{'input-error': errors.full_name}"
            placeholder="Enter your full name"
          />
          <span v-if="errors.full_name" class="text-red-500 text-xs mt-1">{{ errors.full_name }}</span>
        </div>
        
        <!-- Gender and Birth Date -->
        <div class="grid md:grid-cols-2 gap-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text text-gray-700">Gender <span class="text-red-500">*</span></span>
            </label>
            <select 
              v-model="formData.gender" 
              class="select select-bordered w-full"
              :class="{'select-error': errors.gender}"
            >
              <option value="" disabled>Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <span v-if="errors.gender" class="text-red-500 text-xs mt-1">{{ errors.gender }}</span>
          </div>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text text-gray-700">Date of Birth <span class="text-red-500">*</span></span>
            </label>
            <input 
              v-model="formData.date_of_birth" 
              type="date" 
              class="input input-bordered w-full"
              :class="{'input-error': errors.date_of_birth}"
            />
            <span v-if="errors.date_of_birth" class="text-red-500 text-xs mt-1">{{ errors.date_of_birth }}</span>
          </div>
        </div>
        
        <!-- Contact Information -->
        <div class="grid md:grid-cols-2 gap-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text text-gray-700">Contact Number <span class="text-red-500">*</span></span>
            </label>
            <input 
              v-model="formData.contact_number" 
              type="text" 
              class="input input-bordered w-full"
              :class="{'input-error': errors.contact_number}"
            />
            <span v-if="errors.contact_number" class="text-red-500 text-xs mt-1">{{ errors.contact_number }}</span>
          </div>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text text-gray-700">Email <span class="text-red-500">*</span></span>
            </label>
            <input 
              v-model="formData.email" 
              type="email" 
              class="input input-bordered w-full"
              :class="{'input-error': errors.email}"
            />
            <span v-if="errors.email" class="text-red-500 text-xs mt-1">{{ errors.email }}</span>
          </div>
        </div>
        
        <!-- Address -->
        <div class="form-control">
          <label class="label">
            <span class="label-text text-gray-700">Address <span class="text-red-500">*</span></span>
          </label>
          <textarea 
            v-model="formData.address" 
            class="textarea textarea-bordered h-20"
            :class="{'textarea-error': errors.address}"
          ></textarea>
          <span v-if="errors.address" class="text-red-500 text-xs mt-1">{{ errors.address }}</span>
        </div>
        
        <!-- Submit Button -->
        <div class="flex justify-end gap-2">
          <button 
            type="button" 
            @click="goBack" 
            class="btn btn-ghost"
            :disabled="isSaving"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            class="btn btn-primary bg-primaryColor"
            :disabled="isSaving"
          >
            <span v-if="isSaving" class="loading loading-spinner loading-xs mr-2"></span>
            {{ isSaving ? 'Collecting...' : 'Okay' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template> 