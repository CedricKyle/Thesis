<script setup>
import { Users, UserRoundCheck, Timer, CircleX, EllipsisVertical } from 'lucide-vue-next'
import { computed } from 'vue'

const formatDate = computed(() => {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})
</script>

<template>
  <div class="h-full flex flex-col w-full">
    <div class="card-container flex flex-row w-full text-black justify-between gap-3">
      <div class="card bg-white w-70">
        <div class="card-body">
          <!--Card Content-->
          <div class="card-header flex flex-row gap-2 justify-between">
            <div class="">
              <h1 class="">Total Employees</h1>
            </div>
            <div class="">
              <EllipsisVertical class="w-4 h-4" />
            </div>
          </div>
          <div class="card-content mt-4 flex flex-row gap-2 justify-between">
            <div class="">
              <h1 class="text-4xl font-bold">100</h1>
            </div>
            <div class="">
              <Users class="w-10 h-10 text-white rounded-full p-2 bg-primaryColor" />
            </div>
          </div>
          <div
            class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
          ></div>
          <div class="card-footer m-0">
            <p class="text-[11px] text-gray-500">{{ formatDate }}</p>
          </div>
        </div>
      </div>

      <div class="card bg-white w-70">
        <div class="card-body">
          <!--Card Content-->
          <div class="card-header flex flex-row gap-2 justify-between">
            <div class="">
              <h1 class="">Present</h1>
            </div>
            <div class="">
              <EllipsisVertical class="w-4 h-4" />
            </div>
          </div>
          <div class="card-content mt-4 flex flex-row gap-2 justify-between">
            <div class="">
              <h1 class="text-4xl font-bold">100</h1>
            </div>
            <div class="">
              <UserRoundCheck class="w-10 h-10 text-white rounded-full p-2 bg-green-500" />
            </div>
          </div>
          <div
            class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
          ></div>
          <div class="card-footer m-0">
            <p class="text-[11px] text-gray-500">{{ formatDate }}</p>
          </div>
        </div>
      </div>

      <div class="card bg-white w-70">
        <div class="card-body">
          <!--Card Content-->
          <div class="card-header flex flex-row gap-2 justify-between">
            <div class="">
              <h1 class="">Absent</h1>
            </div>
            <div class="">
              <EllipsisVertical class="w-4 h-4" />
            </div>
          </div>
          <div class="card-content mt-4 flex flex-row gap-2 justify-between">
            <div class="">
              <h1 class="text-4xl font-bold">100</h1>
            </div>
            <div class="">
              <CircleX class="w-10 h-10 text-white rounded-full p-2 bg-red-500" />
            </div>
          </div>
          <div
            class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
          ></div>
          <div class="card-footer m-0">
            <p class="text-[11px] text-gray-500">{{ formatDate }}</p>
          </div>
        </div>
      </div>

      <div class="card bg-white w-70">
        <div class="card-body">
          <!--Card Content-->
          <div class="card-header flex flex-row gap-2 justify-between">
            <div class="">
              <h1 class="">Late</h1>
            </div>
            <div class="">
              <EllipsisVertical class="w-4 h-4" />
            </div>
          </div>
          <div class="card-content mt-4 flex flex-row gap-2 justify-between">
            <div class="">
              <h1 class="text-4xl font-bold">100</h1>
            </div>
            <div class="">
              <Timer class="w-10 h-10 text-white rounded-full p-2 bg-secondaryColor" />
            </div>
          </div>
          <div
            class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
          ></div>
          <div class="card-footer m-0">
            <p class="text-[11px] text-gray-500">{{ formatDate }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
