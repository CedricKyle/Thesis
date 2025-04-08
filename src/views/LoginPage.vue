<script setup>
import { Lock, IdCard } from 'lucide-vue-next'
import { ref } from 'vue'

const userId = ref('')
const userPassword = ref('')
</script>

<template>
  <div class="flex w-full justify-center items-center h-screen bg-auth">
    <div class="flex justify-center items-center w-full max-w-md bg-white shadow-md h-96">
      <img class="h-full" src="../assets/Images/Landing-Page.jpg" alt="" />
    </div>
    <div class="w-full max-w-md p-5 bg-primaryColor shadow-md h-96">
      <div class="form-container flex flex-col items-center w-full h-full">
        <div class="logo flex flex-col items-center">
          <img
            class="h-15 w-15"
            src="../assets/Images/countryside-logo.png"
            alt="this is logo img"
          />
          <h1 class="text-2xl font-bold text-secondaryColor">Welcome back,</h1>
        </div>

        <div class="input-container card items-center w-96 p-5">
          <form @submit.prevent="submitForm" class="w-80 mx-auto">
            <div class="flex flex-col items-center w-full gap-3">
              <!-- User ID Input -->
              <div class="relative w-full">
                <label class="input bg-white">
                  <IdCard class="text-gray-500" />
                  <input
                    type="text"
                    placeholder="User ID"
                    required
                    class="placeholder:text-gray-500 text-black"
                  />
                </label>
              </div>
              <!-- Password Input -->
              <div class="relative w-full">
                <label class="input bg-white">
                  <Lock class="text-gray-500 w-5 h-5" />
                  <input
                    type="password"
                    required
                    placeholder="Password"
                    minlength="8"
                    class="placeholder:text-gray-500 text-black"
                  />
                </label>
              </div>
              <!-- Submit Button -->
              <button type="submit" class="btn bg-secondaryColor border-none w-full">Login</button>
            </div>
            <p class="text-center mt-5 text-[12px]">All Right Reserved | 2025</p>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
