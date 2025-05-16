<script setup>
import AttendanceLog from './AttendanceLog.vue'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'
import { computed, ref, onMounted } from 'vue'
import profilePlaceholder from '@/assets/Images/profile-placeholder.png'
import { Upload, ArrowLeft, Save } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const router = useRouter()
const employeeStore = useEmployeeStore()
const employee = computed(() => employeeStore.currentUserEmployee)
const hasPendingChanges = computed(() => employeeStore.hasPendingChanges())
const profileImageFile = ref(null)
const isSaving = ref(false)
const saveMessage = ref('')
const saveStatus = ref('') // 'success' or 'error'
const isPreviewMode = ref(false) // Whether to show the preview with changes

// Computed property for displaying data - show ONLY the original data, not pending changes
const displayData = computed(() => {
  return employee.value
})

// Separate computed property for preview after saving
const previewWithChanges = computed(() => {
  if (!employee.value) return null
  
  // Start with the current employee data
  const data = { ...employee.value }
  
  // If there are pending changes, apply them
  if (employeeStore.pendingChanges) {
    // Apply all pending changes except for the profile image file
    const { profileImageFile: _, ...changes } = employeeStore.pendingChanges
    
    // Merge changes into the display data
    Object.assign(data, changes)
    
    // Make sure full_name is prioritized if it exists in changes
    if (changes.full_name) {
      data.full_name = changes.full_name
    }
  }
  
  return data
})

// Format date helper
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Profile image URL computed property 
const profileImageUrl = computed(() => {
  // Use the existing profile image or placeholder
  if (!employee.value?.profile_image_path) return profilePlaceholder
  return `http://localhost:3000/${employee.value.profile_image_path}`
})

// Preview image URL (for when there are pending changes)
const previewImageUrl = computed(() => {
  // If there's a profile image file pending, use it
  if (employeeStore.pendingChanges && employeeStore.pendingChanges.profileImageFile) {
    return URL.createObjectURL(employeeStore.pendingChanges.profileImageFile)
  }
  
  // Otherwise use the existing profile image or placeholder
  return profileImageUrl.value
})

// Handle profile image upload
const handleProfileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    // Create a copy of existing pending changes or start with an empty object
    const currentChanges = employeeStore.pendingChanges || {}
    
    // Add the profile image file to pending changes
    employeeStore.setPendingChanges({
      ...currentChanges,
      profileImageFile: file
    })
    
    console.log('Profile image added to pending changes')
  } catch (error) {
    console.error('Error processing profile image:', error)
    saveMessage.value = 'Error processing image file'
    saveStatus.value = 'error'
  } finally {
    // Clear the input
    event.target.value = ''
  }
}

// Go back
const goBack = () => {
  // Navigate to the appropriate dashboard based on user's department
  const userDepartment = employee.value?.department
  
  if (userDepartment) {
    // Handle special cases for some departments
    if (userDepartment === 'HR Department') {
      router.push('/hr/dashboard')
    } else if (userDepartment === 'Finance Department') {
      router.push('/finance/dashboard')
    } else if (userDepartment === 'Supply Chain Management') {
      router.push('/scm/dashboard')
    } else if (userDepartment === 'Customer Relationship Management') {
      router.push('/crm/dashboard')
    } else if (userDepartment === 'Sales Department') {
      router.push('/sales/dashboard')
    } else if (userDepartment === 'Production Department') {
      router.push('/production/dashboard')
    } else {
      // Default to a common dashboard or home page
      router.push('/')
    }
  } else {
    // If department is not available, go to home
    router.push('/')
  }
}

// Save pending changes
const saveChanges = async () => {
  try {
    isSaving.value = true
    saveMessage.value = ''
    saveStatus.value = ''
    
    // Turn off preview mode while saving
    isPreviewMode.value = false
    
    console.log('Starting to save changes...')
    const result = await employeeStore.savePendingChanges()
    
    if (result) {
      saveMessage.value = 'Profile changes saved successfully!'
      saveStatus.value = 'success'
      
      // Clear message after 3 seconds
      setTimeout(() => {
        saveMessage.value = ''
      }, 3000)
    } else {
      saveMessage.value = 'No changes were made.'
      saveStatus.value = 'success'
      
      setTimeout(() => {
        saveMessage.value = ''
      }, 3000)
    }
  } catch (error) {
    console.error('Error saving profile changes:', error)
    
    // Create more user-friendly error message
    if (error.message?.includes('Employee not found')) {
      saveMessage.value = 'Could not find your employee record. Please refresh the page and try again.'
    } else if (error.response?.status === 404) {
      saveMessage.value = 'Employee record not found. Please refresh the page and try again.'
    } else if (error.response?.data?.message) {
      saveMessage.value = `Error: ${error.response.data.message}`
    } else {
      saveMessage.value = `Error: ${error.message || 'An unknown error occurred while saving changes.'}`
    }
    
    // Log detailed error information to the console
    console.log('Detailed save error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    })
    
    saveStatus.value = 'error'
    
    // Clear error message after 5 seconds
    setTimeout(() => {
      saveMessage.value = ''
    }, 5000)
  } finally {
    isSaving.value = false
  }
}

// Log employee info on mount for debugging
onMounted(() => {
  console.log('EmployeeProfile mounted, current employee:', 
    employee.value ? {
      id: employee.value.id,
      employee_id: employee.value.employee_id,
      full_name: employee.value.full_name,
      email: employee.value.email
    } : 'No employee found'
  )
})
</script>

<template>
  <div class="p-4">
    <!-- Back Button and Title with Save Changes button -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center">
        <button 
          @click="goBack" 
          class="mr-4 flex items-center gap-1 text-gray-600 hover:text-primaryColor transition-colors"
        >
          <ArrowLeft class="w-5 h-5" />
          <span class="text-sm">Back</span>
        </button>
        <h2 class="text-2xl font-bold">My Profile</h2>
      </div>
      
      <div class="flex items-center gap-2">
        <!-- Toggle Preview Button -->
        <button 
          v-if="hasPendingChanges"
          @click="isPreviewMode = !isPreviewMode" 
          class="btn btn-sm btn-outline"
        >
          {{ isPreviewMode ? 'Hide Preview' : 'Preview Changes' }}
        </button>
        
        <!-- Save Changes Button -->
        <button 
          v-if="hasPendingChanges"
          @click="saveChanges" 
          class="btn btn-primary btn-sm bg-primaryColor"
          :disabled="isSaving"
        >
          <Save class="w-4 h-4 mr-1" />
          <span v-if="!isSaving">Save Changes</span>
          <span v-else class="loading loading-spinner loading-xs"></span>
        </button>
      </div>
    </div>
    
    <div v-if="displayData" class="grid md:grid-cols-3 gap-6">
      <!-- Profile Card -->
      <div class="bg-white rounded-lg shadow-md p-6 flex flex-col items-center">
        <div class="relative">
          <div class="w-32 h-32 rounded-full overflow-hidden ring-2 ring-secondaryColor mb-4 group relative">
            <!-- Image -->
            <img
              :src="isPreviewMode ? previewImageUrl : profileImageUrl"
              class="w-full h-full object-cover"
              alt="Profile"
              @error="$event.target.src = profilePlaceholder"
            />
            
            <!-- Overlay and Upload Button -->
            <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <label class="cursor-pointer">
                <input 
                  type="file" 
                  accept="image/*" 
                  class="hidden" 
                  @change="handleProfileUpload"
                />
                <div class="p-2 bg-white rounded-full">
                  <Upload class="w-6 h-6 text-primaryColor" />
                </div>
              </label>
            </div>
          </div>
        </div>
        
        <h3 class="text-xl font-semibold mb-1">{{ isPreviewMode ? previewWithChanges.full_name : displayData.full_name }}</h3>
        <p class="badge badge-outline badge-warning mb-2">
          {{ isPreviewMode ? previewWithChanges.positionInfo?.position_title : displayData.positionInfo?.position_title || 'Employee' }}
        </p>
        <p class="text-gray-600 text-sm">{{ isPreviewMode ? previewWithChanges.department : displayData.department }}</p>
        
        <!-- Settings link -->
        <div class="mt-4">
          <button 
            @click="router.push('/settings')" 
            class="btn btn-sm btn-outline btn-primary"
          >
            Account Settings
          </button>
        </div>
      </div>

      <!-- Employee Info -->
      <div class="md:col-span-2 grid gap-6">
        <!-- Professional Information -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="font-semibold mb-4 text-lg text-primaryColor border-b pb-2">Professional Information</h3>
          <div class="grid gap-3">
            <div class="flex">
              <div class="w-40 text-gray-500">Employee ID</div>
              <div>{{ isPreviewMode ? previewWithChanges.employee_id : displayData.employee_id }}</div>
            </div>
            <div class="flex">
              <div class="w-40 text-gray-500">Department</div>
              <div>{{ isPreviewMode ? previewWithChanges.department : displayData.department }}</div>
            </div>
            <div class="flex">
              <div class="w-40 text-gray-500">Date of Hire</div>
              <div>{{ formatDate(isPreviewMode ? previewWithChanges.date_of_hire : displayData.date_of_hire) }}</div>
            </div>
            <div class="flex">
              <div class="w-40 text-gray-500">Position</div>
              <div>{{ isPreviewMode ? previewWithChanges.positionInfo?.position_title : displayData.positionInfo?.position_title || 'N/A' }}</div>
            </div>
            <div class="flex">
              <div class="w-40 text-gray-500">Role</div>
              <div>{{ isPreviewMode ? previewWithChanges.role : displayData.role || 'N/A' }}</div>
            </div>
          </div>
        </div>

        <!-- Personal Information -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="font-semibold text-lg text-primaryColor">Personal Information</h3>
            <button 
              class="btn btn-sm btn-outline btn-warning flex items-center gap-1"
              @click="router.push('/profile/edit')"
            >
              <span>Edit</span>
            </button>
          </div>
          <div class="border-b pb-2 mb-4"></div>
          <div class="grid gap-3">
            <div class="flex">
              <div class="w-40 text-gray-500">Full Name</div>
              <div>{{ isPreviewMode ? previewWithChanges.full_name : displayData.full_name }}</div>
            </div>
            <div class="flex">
              <div class="w-40 text-gray-500">Date of Birth</div>
              <div>{{ formatDate(isPreviewMode ? previewWithChanges.date_of_birth : displayData.date_of_birth) }}</div>
            </div>
            <div class="flex">
              <div class="w-40 text-gray-500">Gender</div>
              <div>{{ isPreviewMode ? previewWithChanges.gender : displayData.gender }}</div>
            </div>
            <div class="flex">
              <div class="w-40 text-gray-500">Contact Number</div>
              <div>{{ isPreviewMode ? previewWithChanges.contact_number : displayData.contact_number }}</div>
            </div>
            <div class="flex">
              <div class="w-40 text-gray-500">Email</div>
              <div>{{ isPreviewMode ? previewWithChanges.email : displayData.email }}</div>
            </div>
            <div class="flex">
              <div class="w-40 text-gray-500">Address</div>
              <div class="break-words">{{ isPreviewMode ? previewWithChanges.address : displayData.address }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Attendance Log Section -->
    <div class="mt-6 bg-white rounded-lg shadow-md p-6">
      <h3 class="font-semibold mb-4 text-lg text-primaryColor border-b pb-2">Attendance Log</h3>
      <AttendanceLog v-if="displayData" :employee-id="displayData.employee_id" />
    </div>

    <!-- Save Message -->
    <div v-if="saveMessage" class="mt-6">
      <div 
        :class="[
          'p-3 rounded-md text-white text-sm text-center', 
          saveStatus === 'error' ? 'bg-red-500' : 'bg-green-500'
        ]"
      >
        {{ saveMessage }}
      </div>
    </div>
    
    <!-- Preview Mode Banner -->
    <div v-if="isPreviewMode && hasPendingChanges" class="mb-4 bg-blue-50 p-3 rounded-md border border-blue-200">
      <p class="text-blue-700 text-sm font-medium">
        <span class="font-bold">Preview Mode:</span> You are viewing how your profile will look after saving. These changes are not saved yet.
      </p>
    </div>
  </div>
</template>
