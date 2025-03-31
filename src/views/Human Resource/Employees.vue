<script setup>
import { ref } from 'vue'
import { Search, Upload } from 'lucide-vue-next'
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
          <div class="search-container flex justify-start">
            <div class="flex items-center gap-2 border-b-1 border-gray-500 w-96">
              <div class="flex">
                <Search class="w-5 h-5 text-gray-500 cursor-pointer" />
              </div>
              <div class="">
                <input
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
                  <th>Employee ID</th>
                  <th>Full Name</th>
                  <th>Department</th>
                  <th>Job Title</th>
                  <th>Email Address</th>
                  <th>Contact Number</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr class="hover:bg-gray-100 bg-white border-b border-gray-200">
                  <th>1</th>
                  <td>Test</td>
                  <td>Test</td>
                  <td>Test</td>
                  <td>Test@gmail.com</td>
                  <td>09123456789</td>
                  <td>test</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Add Employee Tab -->
      <input type="radio" name="my_tabs_2" class="tab" aria-label="Add Employee" />
      <div class="tab-content bg-white p-5">
        <!-- Add employee form will go here -->
        <div class="flex gap-4 container h-[600px] text-black">
          <div
            class="professional-container w-[30%] border border-gray-200 p-5 rounded-md shadow-md"
          >
            <div class="flex flex-col gap-4 m-5">
              <!-- profile selection -->
              <div class="profile-selection">
                <div class="avatar justify-center items-center flex flex-col gap-2">
                  <div
                    class="cursor-pointer ring-primary ring-offset-base-100 w-24 rounded-full ring ring-offset-2"
                  >
                    <img
                      src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
                    />
                  </div>
                  <div class="text-sm text-gray-500 h-10 w-full flex items-center justify-center">
                    <div class="flex justify-center gap-2">
                      <p>Upload Profile</p>
                      <Upload class="w-4 h-4 text-gray-500 cursor-pointer" />
                    </div>
                  </div>
                </div>
              </div>
              <div class="title font-bold text-lg">Professional Information</div>

              <div class="form-control flex flex-col gap-5">
                <!-- Employee ID -->
                <div class="">
                  <legend class="fieldset-legend text-black text-xs">Employee ID</legend>
                  <input
                    type="text"
                    placeholder=""
                    class="border-b-1 w-full outline-none border-gray-300 p-0 pt-4 text-black"
                  />
                </div>

                <div class="">
                  <legend class="fieldset-legend text-black text-xs">Date of Hire</legend>
                  <input
                    type="date"
                    placeholder=""
                    class="border-b-1 w-full outline-none border-gray-300 p-0 pt-3 text-black"
                  />
                </div>
                <!-- department selection -->
                <div class="">
                  <legend class="fieldset-legend text-black text-xs">Department</legend>
                  <select class="select focus:outline-none bg-white border-black text-black">
                    <option disabled selected>Select Department</option>
                    <option>Crimson</option>
                    <option>Amber</option>
                    <option>Velvet</option>
                  </select>
                </div>

                <!-- Job Title selection -->
                <div class="">
                  <legend class="fieldset-legend text-black text-xs">Job Title</legend>
                  <select class="select focus:outline-none bg-white border-black text-black">
                    <option disabled selected>Select Job Title</option>
                    <option>Crimson</option>
                    <option>Amber</option>
                    <option>Velvet</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div
            class="divider lg:divider-horizontal m-0 before:bg-gray-200 after:bg-gray-200 before:h-[.5px] after:h-[.5px]"
          ></div>

          <div class="personal-container w-[70%] border border-gray-200 p-5 rounded-md shadow-md">
            <div class="container flex flex-col gap-2">
              <div class="title font-bold text-lg">Personal Information</div>
              <div
                class="divider m-0 before:bg-gray-200 after:bg-gray-200 before:h-[3px] after:h-[3px]"
              ></div>
              <div class="form-control grid grid-cols-2 gap-5">
                <!-- Employee Full Name -->
                <div class="">
                  <legend class="fieldset-legend text-black text-xs">Full Name</legend>
                  <input
                    type="text"
                    placeholder=""
                    class="border-b-1 w-full outline-none border-gray-300 p-0 pt-3 text-black"
                  />
                </div>

                <!-- Employee Date of Birth -->
                <div class="">
                  <legend class="fieldset-legend text-black text-xs">Date of Birth</legend>
                  <input
                    type="date"
                    placeholder=""
                    class="border-b-1 w-full outline-none border-gray-300 p-0 pt-3 text-black"
                  />
                </div>

                <!-- Employee Gender -->
                <div class="">
                  <legend class="fieldset-legend text-black text-xs">Gender</legend>
                  <div class="border-b-1 border-gray-300 p-0">
                    <select class="select !outline-none bg-white w-full p-0 text-black">
                      <option disabled selected>Select Gender</option>
                      <option>Male</option>
                      <option>Female</option>
                    </select>
                  </div>
                </div>

                <!-- Employee Marital Status -->
                <div class="">
                  <legend class="fieldset-legend text-black text-xs">Marital Status</legend>
                  <div class="border-b-1 border-gray-300 p-0">
                    <select class="select !outline-none bg-white w-full p-0 text-black">
                      <option disabled selected>Select Marital Status</option>
                      <option>Single</option>
                      <option>Married</option>
                      <option>Divorced</option>
                      <option>Widowed</option>
                    </select>
                  </div>
                </div>

                <!-- Employee Contact Number -->
                <div class="">
                  <legend class="fieldset-legend text-black text-xs">Contact Number</legend>
                  <input
                    type="text"
                    placeholder=""
                    class="border-b-1 w-full outline-none border-gray-300 p-0 pt-3 text-black"
                  />
                </div>

                <!-- Employee Email Address -->
                <div class="">
                  <legend class="fieldset-legend text-black text-xs">Email Address</legend>
                  <input
                    type="email"
                    placeholder="@example.com"
                    class="border-b-1 w-full outline-none border-gray-300 p-0 pt-3 text-black"
                  />
                </div>
                <!-- Employee Address -->
                <div class="col-span-2">
                  <legend class="fieldset-legend text-black text-xs">Address</legend>
                  <input
                    type="text"
                    placeholder=""
                    class="border-b-1 w-full outline-none border-gray-300 p-0 pt-3 text-black"
                  />
                </div>
              </div>
              <div class="title font-bold text-lg">Emergency Contact</div>
              <div class="form-control grid grid-cols-2 gap-5">
                <!-- Emergency Contact Name -->
                <div class="">
                  <legend class="fieldset-legend text-black text-xs">Name</legend>
                  <input
                    type="text"
                    placeholder=""
                    class="border-b-1 w-full outline-none border-gray-300 p-0 pt-3 text-black"
                  />
                </div>

                <!-- Emergency Contact Number -->
                <div class="">
                  <legend class="fieldset-legend text-black text-xs">Contact Number</legend>
                  <input
                    type="text"
                    placeholder=""
                    class="border-b-1 w-full outline-none border-gray-300 p-0 pt-3 text-black"
                  />
                </div>
              </div>

              <div class="btn-container flex justify-end mt-3 gap-2">
                <button class="btn btn-sm bg-secondaryColor border-none text-white shadow-none">
                  Save
                </button>
                <button class="btn btn-sm bg-gray-400 border-none text-white shadow-none">
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
  </div>
</template>

<style scoped>
input[type='date']::-webkit-calendar-picker-indicator,
input[type='time']::-webkit-calendar-picker-indicator {
  filter: invert(0%) brightness(0%);
  cursor: pointer;
}
</style>
