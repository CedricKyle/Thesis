<script setup>
import { ChevronLeft, ChevronRight, Eye, EyeOff, Check, X } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { ref } from 'vue'

const router = useRouter()
const step = ref(1)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const selectedRole = ref('')
const removeSelectedRole = ref(false)

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

const selectRole = (role) => {
  selectedRole.value = role
  removeSelectedRole.value = true
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
                type="text"
                placeholder=""
                class="input w-full bg-gray-100 border border-gray-200 !outline-none"
              />
            </div>

            <div class="w-full">
              <legend class="fieldset-legend text-black text-xs">Gender</legend>
              <select
                class="select w-full focus:outline-none bg-gray-100 border-gray-200 text-black"
              >
                <option disabled value="">Select Gender</option>
                <option>Male</option>
                <option>Female</option>
              </select>
            </div>

            <div class="w-full">
              <legend class="fieldset-legend text-black text-xs">Date of Birth</legend>
              <input
                type="date"
                class="input w-full bg-gray-100 border border-gray-200 !outline-none"
              />
            </div>
          </div>
          <!-- contact info -->
          <div class="mt-5">
            <div class="text-sm font-semibold">Contact Information</div>

            <div class="grid grid-cols-2 gap-5">
              <div class="">
                <legend class="fieldset-legend text-black text-xs">Email</legend>
                <input
                  type="email"
                  placeholder="email address"
                  class="input w-full bg-gray-100 border border-gray-200 !outline-none"
                />
              </div>
              <div class="">
                <legend class="fieldset-legend text-black text-xs">Phone Number</legend>
                <input
                  type="text"
                  placeholder="09xxxxxxxxx"
                  class="input w-full bg-gray-100 border border-gray-200 !outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- security step -->
      <div v-if="step === 2" class="mt-5 border border-gray-200 rounded-md p-5 bg-white shadow-sm">
        <div class="font-semibold">Security</div>
        <div class="grid grid-cols-2 gap-5">
          <!-- User ID -->
          <div class="col-span-2">
            <legend class="fieldset-legend text-black text-xs">User ID</legend>
            <input
              type="text"
              class="input w-full bg-gray-100 border border-gray-200 !outline-none"
            />
          </div>
          <!-- password -->
          <div class="">
            <legend class="fieldset-legend text-black text-xs">Password</legend>
            <div class="relative">
              <input
                :type="showPassword ? 'text' : 'password'"
                class="input w-full bg-gray-100 border border-gray-200 !outline-none"
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
            </div>
          </div>

          <!-- confirm password -->
          <div class="">
            <legend class="fieldset-legend text-black text-xs">Confirm Password</legend>
            <div class="relative">
              <input
                :type="showConfirmPassword ? 'text' : 'password'"
                class="input w-full bg-gray-100 border border-gray-200 !outline-none"
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
              class="select w-full focus:outline-none bg-gray-100 border-gray-200 text-black"
              @change="selectedRole = $event.target.value"
            >
              <option disabled value="">Select Role</option>
              <option>Admin</option>
              <option>User</option>
            </select>
          </div>
          <!-- selected role container -->
          <div class="">
            <legend class="fieldset-legend text-black text-xs">Selected Role</legend>
            <div class="bg-gray-100 rounded-md p-2 border border-gray-200 flex justify-between">
              <div class="">
                <p class="">
                  {{ selectedRole }}
                </p>
              </div>
              <div v-if="selectedRole" class="cursor-pointer" @click="toggleShowSelectedRole">
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
              <div>Cedrick</div>
            </div>
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">Gender</div>
              <div>Male</div>
            </div>
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">Date of Birth</div>
              <div>01-01-2000</div>
            </div>
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">Email</div>
              <div>cedrick@gmail.com</div>
            </div>
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">Phone Number</div>
              <div>09123456789</div>
            </div>
          </div>
          <!-- Security Information -->
          <div class="mb-4 text-sm flex flex-col gap-1">
            <h4 class="font-semibold mb-2">Security Information</h4>
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">User ID</div>
              <div>2025-0001</div>
            </div>
            <div class="flex flex-row">
              <div class="w-40 text-gray-500">Password</div>
              <div class="flex items-center gap-2">
                <div>********</div>
                <div class="cursor-pointer" @click="showPassword = !showPassword">
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
              <div>Admin</div>
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
        @click="step++"
      >
        Next <ChevronRight class="w-4 h-4" />
      </button>
      <button v-if="step === 4" class="btn-primaryStyle" @click="step = 4">
        Save<Check class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>
