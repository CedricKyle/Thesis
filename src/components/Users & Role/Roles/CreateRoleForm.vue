<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronLeft } from 'lucide-vue-next'

const router = useRouter()
</script>

<template>
  <div class="container p-5 text-black">
    <div class="title flex items-center gap-2">
      <ChevronLeft
        class="w-6 h-6 cursor-pointer hover:bg-primaryColor/20 rounded-full"
        @click="router.back()"
      />
      <div class="text-[24px] font-semibold">Create Role</div>
    </div>

    <!-- role name -->
    <div class="role-name p-5 bg-white rounded-md flex gap-5 mt-5 border border-gray-200 shadow-sm">
      <div class="input-container flex-1">
        <legend class="fieldset-legend text-black !m-0 !text-xs">Role Name</legend>
        <input type="text" class="input bg-white border-b border-gray-400 w-full" />
        <p class="fieldset-label text-gray-500 text-xs mt-1">Enter a name for the role</p>
      </div>
      <div class="description-container flex-1">
        <legend class="fieldset-legend text-black !m-0 !text-xs">Description</legend>
        <input class="input bg-white border-b border-gray-400 w-full" />
        <p class="fieldset-label text-gray-500 text-xs mt-1">
          Add a description to help identify the role
        </p>
      </div>
    </div>

    <!-- permissions -->
    <div
      class="permissions p-5 bg-white rounded-md flex flex-col gap-5 mt-5 border border-gray-200 shadow-sm"
    >
      <div class="permissions-container flex-1">
        <p class="text-black text-sm font-semibold">Select permissions to enable access control</p>
      </div>

      <div class="flex flex-col gap-5">
        <!-- permissions list -->
        <div class="permissions-list grid grid-cols-2 gap-5 border border-gray-200 rounded-md p-2">
          <!-- User Management -->
          <div class="user-management">
            <p class="text-black text-sm border border-gray-200 rounded-md p-2 bg-gray-50">
              User Management
            </p>

            <div class="p-5 flex flex-col gap-5">
              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">User List</p>
              </div>
              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">View</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Create</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Edit</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Delete</p>
              </div>
            </div>
          </div>

          <!-- Roles and Permissions -->
          <div class="roles-and-permissions">
            <p class="text-black text-sm border border-gray-200 rounded-md p-2 bg-gray-50">
              Roles and Permissions
            </p>

            <div class="p-5 flex flex-col gap-5">
              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Role List</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Create</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Edit</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Delete</p>
              </div>
            </div>
          </div>

          <!-- Human Resource -->
          <div class="human-resource col-span-2">
            <p class="text-black text-sm border border-gray-200 rounded-md p-2 bg-gray-50">
              Human Resource
            </p>

            <div class="grid grid-cols-4 gap-5">
              <div class="p-5 flex flex-col gap-5">
                <p class="text-black text-sm font-semibold">HR Dashboard</p>
                <div class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                  <p class="text-black text-sm">View Dashboard</p>
                </div>

                <div class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                  <p class="text-black text-sm">Manage Dashboard</p>
                </div>
              </div>

              <div class="p-5 flex flex-col gap-5">
                <p class="text-black text-sm font-semibold">Attendance Report</p>
                <div class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                  <p class="text-black text-sm">View Attendance Report</p>
                </div>

                <div class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                  <p class="text-black text-sm">Export Attendance Report</p>
                </div>
              </div>

              <div class="p-5 flex flex-col gap-5">
                <p class="text-black text-sm font-semibold">Employee Management</p>
                <div class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                  <p class="text-black text-sm">View Employee List</p>
                </div>

                <div class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                  <p class="text-black text-sm">Create Employee</p>
                </div>

                <div class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                  <p class="text-black text-sm">Edit Employee</p>
                </div>

                <div class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                  <p class="text-black text-sm">Delete Employee</p>
                </div>
              </div>

              <div class="p-5 flex flex-col gap-5">
                <p class="text-black text-sm font-semibold">Attendance Management</p>
                <div class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                  <p class="text-black text-sm">View Attendance List</p>
                </div>

                <div class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                  <p class="text-black text-sm">Create Attendance</p>
                </div>

                <div class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                  <p class="text-black text-sm">Edit Attendance</p>
                </div>

                <div class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                  <p class="text-black text-sm">Delete Attendance</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Inventory Management -->
          <div class="inventory-management">
            <p class="text-black text-sm border border-gray-200 rounded-md p-2 bg-gray-50">
              Inventory Management
            </p>

            <div class="p-5 flex flex-col gap-5">
              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Product List</p>
              </div>
              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">View</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Create</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Edit</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Delete</p>
              </div>
            </div>
          </div>

          <!-- Sales Management -->
          <div class="sales-management">
            <p class="text-black text-sm border border-gray-200 rounded-md p-2 bg-gray-50">
              Sales Management
            </p>

            <div class="p-5 flex flex-col gap-5">
              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Order List</p>
              </div>
              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">View</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Create</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Edit</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Delete</p>
              </div>
            </div>
          </div>

          <!-- CRM Management -->
          <div class="crm-management">
            <p class="text-black text-sm border border-gray-200 rounded-md p-2 bg-gray-50">
              CRM Management
            </p>

            <div class="p-5 flex flex-col gap-5">
              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Customer List</p>
              </div>
              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">View</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Create</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Edit</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Delete</p>
              </div>
            </div>
          </div>

          <!-- Finance Management -->
          <div class="finance-management">
            <p class="text-black text-sm border border-gray-200 rounded-md p-2 bg-gray-50">
              Finance Management
            </p>

            <div class="p-5 flex flex-col gap-5">
              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Invoice List</p>
              </div>
              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">View</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Create</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Edit</p>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-neutral" />
                <p class="text-black text-sm">Delete</p>
              </div>
            </div>
          </div>
        </div>

        <!-- add permission -->
        <div class="">
          <button class="btn bg-primaryColor text-white rounded-none btn-sm border-none">
            Add Permission
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
