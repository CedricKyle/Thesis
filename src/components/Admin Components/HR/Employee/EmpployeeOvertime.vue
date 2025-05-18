<script setup>
import { ref, computed, onMounted } from 'vue'
import BaseTable from '@/components/common/BaseTable.vue'
import { useAttendanceStore } from '@/stores/HR Management/attendanceStore'
import { PERMISSION_IDS } from '@/composables/Admin Composables/User & Role/role/permissionsId'
import { useAuthStore } from '@/stores/Authentication/authStore'

const attendanceStore = useAttendanceStore()
const authStore = useAuthStore()
// Calendar logic
const today = new Date().toISOString().split('T')[0]
const selectedDate = ref(today)
const API_URL = import.meta.env.VITE_API_URL

// Table columns
const columns = [
  { title: 'Date', field: 'date', sorter: 'date' },
  { title: 'Name', field: 'full_name', sorter: 'string' },
  {
    title: 'No. Hours',
    field: 'overtimeHours',
    formatter: (cell) => Number(cell.getValue()).toFixed(2),
  },
  {
    title: 'Proof',
    field: 'overtimeProof',
    formatter: (cell) => {
      const value = cell.getValue()
      if (!value) return '-'
      const url = value.startsWith('http')
        ? value
        : `${API_URL}/${value.startsWith('/') ? value.slice(1) : value}`
      return `<img src="${url}" style="max-width:30px;max-height:30px;cursor:pointer;" onclick="window.open('${url}','_blank')" />`
    },
  },
  {
    title: 'OT Approval Status',
    field: 'ot_approval_status',
    formatter: (cell) => {
      const status = cell.getValue()
      if (status === 'Approved')
        return `<span class="badge badge-success badge-outline badge-sm">${status}</span>`
      if (status === 'Rejected')
        return `<span class="badge badge-error badge-outline badge-sm">${status}</span>`
      return `<span class="badge badge-warning badge-outline badge-sm">${status || 'Pending'}</span>`
    },
  },
  {
    title: 'OT Remarks',
    field: 'ot_remarks',
    formatter: (cell) => cell.getValue() || '-',
  },
  {
    title: 'Actions',
    field: 'actions',
    formatter: (cell) => {
      const record = cell.getRow().getData()
      if (record.ot_approval_status === 'Pending' || !record.ot_approval_status) {
        if (canManageOT.value) {
          return `
            <button class="btn-primaryStyle btn-xs approve-ot">Approve</button>
            <button class="btn-errorStyle btn-xs reject-ot">Reject</button>
          `
        } else {
          return `<span class="text-xs text-gray-400">HR Only</span>`
        }
      }
      return ''
    },
    cellClick: async (e, cell) => {
      const record = cell.getRow().getData()
      if (e.target.classList.contains('approve-ot')) {
        openConfirmModal('approve', record.id)
      } else if (e.target.classList.contains('reject-ot')) {
        openConfirmModal('reject', record.id)
      }
    },
  },
]

// Example data
const overtimes = ref([
  { date: '2024-06-01', name: 'Juan Dela Cruz', hours: 2, rate: 120.0 },
  { date: '2024-06-03', name: 'Maria Santos', hours: 1.5, rate: 150.0 },
  { date: '2024-06-05', name: 'Pedro Reyes', hours: 3, rate: 100.0 },
])

// Filtered data based on selected date
const filteredOvertimes = computed(() =>
  overtimes.value.filter((ot) => ot.date === selectedDate.value),
)

// Modal logic
const createModal = ref(null)
const viewModal = ref(null)
const newOvertime = ref({
  date: '',
  name: '',
  hours: '',
  rate: '',
})
const selectedOvertime = ref(null)

const openCreateModal = () => {
  newOvertime.value = { date: selectedDate.value, name: '', hours: '', rate: '' }
  createModal.value?.showModal()
}

const closeCreateModal = () => {
  createModal.value?.close()
}

const addOvertime = () => {
  if (
    newOvertime.value.date &&
    newOvertime.value.name &&
    newOvertime.value.hours &&
    newOvertime.value.rate
  ) {
    overtimes.value.push({ ...newOvertime.value })
    closeCreateModal()
  }
}

function openViewModal(overtime) {
  selectedOvertime.value = overtime
  viewModal.value?.showModal()
}

function closeViewModal() {
  viewModal.value?.close()
}

onMounted(() => {
  attendanceStore.loadRecords()
})

const overtimeRecords = computed(() =>
  attendanceStore.attendanceRecords
    .filter(
      (record) =>
        (record.overtimeProof || record.overtime_proof) &&
        (selectedDate.value
          ? new Date(record.date).toISOString().split('T')[0] === selectedDate.value
          : true),
    )
    .map((record) => ({
      ...record,
      ot_approval_status: record.ot_approval_status || record.otApprovalStatus || 'Pending',
      // ...other fields...
    })),
)

const confirmModal = ref(null)
const confirmActionType = ref('') // 'approve' or 'reject'
const selectedOvertimeId = ref(null)
const rejectRemarks = ref('') // For remarks if needed
const isProcessing = ref(false)

function openConfirmModal(action, id) {
  confirmActionType.value = action
  selectedOvertimeId.value = id
  rejectRemarks.value = ''
  confirmModal.value?.showModal()
}

function closeConfirmModal() {
  confirmModal.value?.close()
  selectedOvertimeId.value = null
  confirmActionType.value = ''
  rejectRemarks.value = ''
}

async function confirmOvertimeAction() {
  isProcessing.value = true
  try {
    if (confirmActionType.value === 'approve') {
      await attendanceStore.approveOvertime(selectedOvertimeId.value)
    } else if (confirmActionType.value === 'reject') {
      await attendanceStore.rejectOvertime(selectedOvertimeId.value, rejectRemarks.value)
    }
    await attendanceStore.loadRecords()
    closeConfirmModal()
  } catch (error) {
    closeConfirmModal()
  } finally {
    isProcessing.value = false
  }
}

const canManageOT = computed(() => {
  const userPermissions = authStore.currentUser?.permissions || []
  return userPermissions.includes(PERMISSION_IDS.HR_FULL_ACCESS)
})
</script>

<template>
  <div class="flex flex-col mt-4">
    <!-- Calendar and Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
      <div class="flex items-center gap-2">
        <input type="date" v-model="selectedDate" class="input-search input-sm" />
      </div>
      <button class="btn-primaryStyle" @click="openCreateModal">Add Overtime</button>
    </div>

    <!-- Table -->
    <BaseTable :columns="columns" :data="overtimeRecords" :showExport="false" />
    <div class="flex justify-end gap-2 mt-4">
      <input type="checkbox" class="checkbox checkbox-xs checkbox-neutral" />
      <span class="text-sm cursor-pointer hover:text-gray-500 text-black"
        >Show Archived Overtime</span
      >
    </div>

    <!-- Create Overtime Modal -->
    <dialog ref="createModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-md text-black">Add Overtime</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>
        <form @submit.prevent="addOvertime" class="flex flex-col gap-4 mt-2">
          <div>
            <label class="block text-sm text-black mb-1">Date</label>
            <input v-model="newOvertime.date" type="date" class="input-search" required />
          </div>
          <div>
            <label class="block text-sm text-black mb-1">Name</label>
            <input v-model="newOvertime.name" type="text" class="input-search" required />
          </div>
          <div>
            <label class="block text-sm text-black mb-1">No. Hours</label>
            <input
              v-model="newOvertime.hours"
              type="number"
              min="0"
              step="0.01"
              class="input-search"
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <label class="block text-sm text-black mb-1">Rate</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 transform -translate-y-1/2 !text-gray-900"
                >₱</span
              >
              <input
                v-model="newOvertime.rate"
                type="number"
                min="0"
                step="0.01"
                class="input-search pl-7"
                placeholder="0.00"
                required
              />
            </div>
          </div>
          <div class="modal-action justify-center gap-4 mt-2">
            <button type="submit" class="btn-primaryStyle">Add</button>
            <button type="button" class="btn-secondaryStyle" @click="closeCreateModal">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </dialog>

    <!-- View Overtime Modal (Styled like EmployeeList) -->
    <dialog ref="viewModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-md text-black">Overtime Details</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>
        <div v-if="selectedOvertime" class="flex flex-col gap-2 mt-2 text-black">
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Date:</span>
            <span class="text-sm">{{ selectedOvertime.date }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Name:</span>
            <span class="text-sm">{{ selectedOvertime.name }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">No. Hours:</span>
            <span class="text-sm">
              {{
                Number(selectedOvertime.hours).toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Rate:</span>
            <span class="text-sm">
              ₱
              {{
                Number(selectedOvertime.rate).toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              }}
            </span>
          </div>
        </div>
        <div class="modal-action justify-end gap-4 mt-5">
          <button type="button" class="btn-secondaryStyle" @click="closeViewModal">Close</button>
        </div>
      </div>
    </dialog>

    <!-- Confirmation Modal -->
    <dialog ref="confirmModal" class="modal">
      <div class="modal-box bg-white w-96">
        <h3 class="font-bold text-md text-black">Confirm Action</h3>
        <div
          class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
        ></div>
        <p class="py-4 text-center text-black text-sm">
          Are you sure you want to
          <span class="font-bold">
            {{ confirmActionType === 'approve' ? 'approve' : 'reject' }}
          </span>
          this overtime request?
        </p>
        <div v-if="confirmActionType === 'reject'" class="mb-2">
          <label class="block text-xs text-black mb-1">Remarks (optional):</label>
          <textarea
            v-model="rejectRemarks"
            class="input-search w-full"
            rows="2"
            placeholder="Enter remarks"
          ></textarea>
        </div>
        <div class="modal-action justify-center gap-4">
          <button
            class="btn-primaryStyle"
            :class="{ 'btn-errorStyle': confirmActionType === 'reject' }"
            :disabled="isProcessing"
            @click="confirmOvertimeAction"
          >
            Yes
          </button>
          <button class="btn-secondaryStyle" @click="closeConfirmModal">Cancel</button>
        </div>
      </div>
    </dialog>
  </div>
</template>

<style scoped>
.relative {
  position: relative;
  display: inline-block;
  width: 100%;
}
</style>
