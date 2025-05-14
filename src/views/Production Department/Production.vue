<template>
  <div class=" min-h-screen">
    <!-- Tabs -->
    <div class="tabs bg-primaryColor text-white rounded-t-lg">
      <a class="tab tab-bordered tab-active px-6">Production</a>
      <a class="tab tab-bordered px-6">Production History</a>
    </div>

    <!-- Filter Section -->
    <div class="bg-white p-4 shadow rounded-b-lg">
      <div class="flex flex-wrap gap-4 items-end mb-4">
        <input type="text" placeholder="Search" class="input input-bordered w-48" />
        <select class="select select-bordered w-48">
          <option disabled selected>Product</option>
          <option>Burger</option>
          <option>Lecheflan</option>
        </select>
        <select class="select select-bordered w-48">
          <option disabled selected>Branch</option>
          <option>Branch 1</option>
          <option>Branch 2</option>
        </select>
        <button class="btn bg-primaryColor text-white">Filter</button>
        <button class="btn bg-primaryColor text-white  ml-auto">+ Add Supplies</button>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto rounded shadow">
        <table class="table table-zebra w-full">
          <thead class="bg-primaryColor text-white">
            <tr>
              <th>SCM Manager</th>
              <th>Branch no.</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Deadline</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Louie</td>
              <td>Branch 2</td>
              <td>Lecheflan</td>
              <td>400</td>
              <td>5/14/2025</td>
              <td>In Progress</td>
              <td>
                <button class="btn btn-xs btn-ghost">⋮</button>
              </td>
            </tr>
            <tr v-for="i in 3" :key="i">
              <td>Louie</td>
              <td>Burger</td>
              <td>500</td>
              <td>In Progress</td>
              <td>5/14/2025</td>
              <td>In Progress</td>
              <td>
                <button class="btn btn-xs btn-ghost">⋮</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="flex justify-end p-2 bg-primaryColor text-white rounded-b">
          <label class="label cursor-pointer">
            <span class="label-text text-white mr-2">Show all</span>
            <input type="checkbox" class="toggle toggle-success" />
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// You can manage form inputs and filters with ref or reactive state
</script>
