<script setup>
import { Lock, Mail } from 'lucide-vue-next'
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
          <form class="w-80 mx-auto">
            <div class="flex flex-col items-center w-full gap-3">
              <!-- Email Input -->
              <div class="relative w-full">
                <label class="input bg-white">
                  <Mail class="text-gray-500 w-4 h-4" />
                  <input
                    type="email"
                    placeholder="Email"
                    class="placeholder:text-gray-500 text-black w-full"
                  />
                </label>
              </div>
              <!-- Password Input -->
              <div class="relative w-full">
                <label class="input bg-white">
                  <Lock class="text-gray-500 w-4 h-4" />
                  <input
                    type="password"
                    placeholder="Password"
                    class="placeholder:text-gray-500 text-black w-full"
                  />
                </label>
              </div>
              <!-- Submit Button -->
              <button
                type="submit"
                class="btn bg-secondaryColor border-none w-full shadow-none font-thin"
              >
                Login
              </button>
            </div>
            <p class="text-center mt-5 text-[12px]">All Right Reserved | 2025</p>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
