<script setup>
import { Eye, X, SquarePen } from 'lucide-vue-next'
</script>

<template>
  <div class="attendance-report-container min-h-screen overflow-y-auto">
    <div class="report-container w-full flex flex-col justify-between gap-4 text-black">
      <!-- find employee name -->
      <div class="p-5 bg-white rounded-md shadow-md">
        <div class="flex flex-col gap-4">
          <div class="report-title">
            <h1 class="font-semibold">Attendance Report</h1>
          </div>

          <!-- Department -->
          <div class="flex gap-4 w-full">
            <div class="">
              <legend class="fieldset-legend text-black text-xs">Department</legend>
              <select class="select focus:outline-none bg-white border-black text-black">
                <option disabled value="">Select Department</option>
                <option>HR Department</option>
                <option>Finance Department</option>
                <option>Sales Department</option>
                <option>Supply Chain Department</option>
                <option>CRM Department</option>
              </select>
            </div>

            <div class="w-full">
              <legend class="fieldset-legend text-black text-xs">Employee</legend>
              <select class="select focus:outline-none bg-white border-black text-black">
                <option disabled value=" ">Select Employee</option>
              </select>
            </div>
          </div>

          <!-- Date and Action Button -->
          <div class="flex gap-4 w-full justify-between items-end">
            <div class="flex gap-8 w-full">
              <div class="">
                <legend class="fieldset-legend text-black text-xs">From</legend>
                <input type="date" class="border-black border-1 rounded-md p-2" />
              </div>

              <div class="w-full">
                <legend class="fieldset-legend text-black text-xs">To</legend>
                <input type="date" class="border-black border-1 rounded-md p-2" />
              </div>
            </div>

            <div class="action-button">
              <button class="btn bg-primaryColor border-none btn-sm px-4 py-2">Submit</button>
            </div>
          </div>
        </div>
      </div>

      <!-- attendance records -->
      <div class="bg-white shadow-md rounded-md p-5">
        <!-- employee name -->
        <div class="flex gap-4 flex-col">
          <div class="">
            <h1 class="font-semibold">Employee Name</h1>
          </div>
          <div class="">
            <p>Worked Hours in Days</p>
          </div>
        </div>
      </div>

      <!-- full attendance summary -->
      <div class="bg-white shadow-md rounded-md p-5">
        <div class="flex gap-4 flex-col">
          <div class="">
            <h1 class="font-semibold">Attendance Summary</h1>
          </div>

          <!-- table content -->
          <div class="overflow-x-auto border border-gray-300/50 shadow-lg">
            <table class="table text-black">
              <!-- head -->
              <thead class="bg-primaryColor text-white">
                <tr>
                  <th>Date</th>
                  <th>Time In</th>
                  <th>Time Out</th>
                  <th>Worked Hours</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <!-- row 1 -->
                <tr class="hover:bg-gray-50 border-b-1 border-gray-200">
                  <th></th>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td>
                    <button
                      class="btn btn-sm btn-circle hover:bg-primaryColor/80 border-none btn-ghost"
                    >
                      <Eye class="h-4 w-4" />
                    </button>

                    <button
                      class="btn btn-sm btn-circle hover:bg-primaryColor/80 border-none btn-ghost"
                    >
                      <SquarePen class="h-4 w-4" />
                    </button>
                    <button class="btn btn-sm btn-circle hover:bg-red-400 border-none btn-ghost">
                      <X class="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
