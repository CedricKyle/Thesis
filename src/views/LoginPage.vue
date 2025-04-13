<script setup>
import { Lock, IdCard } from 'lucide-vue-next'
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
                  <IdCard class="text-gray-500 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="User ID"
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
              <button type="submit" class="btn-loginStyle w-full h-10">Login</button>
            </div>

            <div class="flex justify-between text-xs mt-2">
              <div class="flex items-center gap-1">
                <input type="checkbox" class="checkbox checkbox-white checkbox-xs" />
                <p>Remember Me</p>
              </div>
              <div class="">
                <p class="hover:text-secondaryColor cursor-pointer transition-all">
                  Forgot Password?
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
