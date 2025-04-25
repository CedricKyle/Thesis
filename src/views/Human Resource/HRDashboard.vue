<script setup>
import {
  Footprints,
  UserRoundCheck,
  Timer,
  CircleX,
  EllipsisVertical,
  X,
  RotateCw,
} from 'lucide-vue-next'
import { computed, ref, watch, onMounted } from 'vue'
// Import Chart.js components
import { Pie } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale } from 'chart.js'
import { useAttendanceStore } from '@/stores/HR Management/attendanceStore'
import { storeToRefs } from 'pinia'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'

// Register Chart.js components
ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale)

// Date state
const selectedDate = ref(new Date().toISOString().split('T')[0]) // Default to today

const attendanceStore = useAttendanceStore()
const { attendanceRecords } = storeToRefs(attendanceStore)
const { loadRecords } = attendanceStore

// Add employee store
const employeeStore = useEmployeeStore()
const { employees } = storeToRefs(employeeStore)

// Filtered stats based on selected date
const filteredStats = computed(() => {
  if (!attendanceRecords.value || !employees.value) {
    return { present: 0, absent: 0, late: 0 }
  }

  const dateToCheck = new Date(selectedDate.value)

  // Get all records for the selected date
  const recordsForDate = attendanceRecords.value.filter((record) => {
    const recordDate = new Date(record.date)
    return recordDate.toDateString() === dateToCheck.toDateString()
  })

  // Create a map of attendance records by employee_id
  const attendanceMap = new Map(recordsForDate.map((record) => [record.employee_id, record]))

  // Initialize counters
  let present = 0
  let absent = 0
  let late = 0

  // Only count active employees (not soft-deleted) and exclude Super Admin
  const activeEmployees = employees.value.filter(
    (employee) => !employee.deleted_at && employee.role !== 'Super Admin',
  )

  // Check each employee's attendance status
  activeEmployees.forEach((employee) => {
    const record = attendanceMap.get(employee.employee_id)

    if (record) {
      // Employee has an attendance record for this date
      switch (record.status) {
        case 'Present':
        case 'Present + OT':
          present++
          break
        case 'Late':
        case 'Late + OT':
          late++
          break
        default:
          absent++
      }
    } else {
      // No attendance record means absent
      absent++
    }
  })

  return {
    present,
    absent,
    late,
  }
})

// Chart data based on filtered stats
const filteredChartData = computed(() => {
  const total = employees.value?.length || 0
  const stats = filteredStats.value

  // Calculate percentages
  const getPercentage = (value) => {
    return total > 0 ? Math.round((value / total) * 100) : 0
  }

  return {
    labels: ['Present', 'Absent', 'Late'],
    datasets: [
      {
        data: [
          getPercentage(stats.present),
          getPercentage(stats.absent),
          getPercentage(stats.late),
        ],
        backgroundColor: ['#466114', '#ef4444', '#F87A14'],
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  }
})

// Format date for display
const formattedDate = computed(() => {
  return new Date(selectedDate.value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

// Todo list state
const newTask = ref('')
const todoList = ref([])

// Add task
const addTask = () => {
  if (newTask.value.trim() !== '') {
    todoList.value.push({
      id: Date.now(),
      text: newTask.value,
      completed: false,
    })
    newTask.value = ''
    localStorage.setItem('todoList', JSON.stringify(todoList.value))
  }
}

// Remove task
const removeTask = (index) => {
  todoList.value.splice(index, 1)
  localStorage.setItem('todoList', JSON.stringify(todoList.value))
}

// Update this function to handle checkbox changes
const toggleTask = (index) => {
  todoList.value[index].completed = !todoList.value[index].completed
  localStorage.setItem('todoList', JSON.stringify(todoList.value))
}

// Custom chart options
const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right',
      labels: {
        padding: 20,
        font: {
          size: 14,
        },
        usePointStyle: true,
        pointStyle: 'circle',
      },
    },
    title: {
      display: true,
      text: 'Employee Attendance Overview',
      font: {
        size: 20,
      },
      padding: {
        top: 20,
        bottom: 20,
      },
      color: '#374151',
    },
    tooltip: {
      callbacks: {
        label: function (context) {
          const label = context.label || ''
          const value = context.raw || 0 // Use raw value instead of formatted
          return `${label}: ${value}% (${filteredStats.value[label.toLowerCase()]} employees)`
        },
      },
    },
  },
  animation: {
    animateScale: true,
    animateRotate: true,
  },
})

// Load data on component mount
onMounted(() => {
  loadRecords()
  employeeStore.loadEmployees()
  const savedTodos = localStorage.getItem('todoList')
  if (savedTodos) {
    todoList.value = JSON.parse(savedTodos)
  }
})
</script>

<template>
  <div class="min-h-screen overflow-y-auto pb-6">
    <!-- Date Selector -->
    <div class="w-full flex justify-end mb-4 px-4">
      <div class="flex items-center gap-2">
        <input
          type="date"
          v-model="selectedDate"
          class="input input-bordered input-sm w-auto !outline-none hover:shadow-md"
        />
      </div>
    </div>

    <div class="grid grid-cols-4 grid-rows-[auto_auto_auto_auto] gap-4 text-black">
      <!--Stats Grid-->
      <div class="col-span-3 flex gap-4 justify-between">
        <div class="">
          <div class="card bg-white w-65 shadow-md">
            <div class="card-body">
              <!--Card Content-->
              <div class="card-header flex flex-row gap-2 justify-between">
                <div class="">
                  <h1 class="text-gray-600">Present</h1>
                </div>
                <div class="">
                  <EllipsisVertical class="w-4 h-4" />
                </div>
              </div>
              <div class="card-content mt-4 flex flex-row gap-2 justify-between">
                <div class="">
                  <h1 class="text-4xl font-bold">{{ filteredStats.present }}</h1>
                </div>
                <div class="">
                  <UserRoundCheck class="w-9 h-9 text-white rounded-full p-2 bg-[#466114]" />
                </div>
              </div>
              <div
                class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
              ></div>
            </div>
          </div>
        </div>
        <div>
          <div class="card bg-white w-65 shadow-md">
            <div class="card-body">
              <!--Card Content-->
              <div class="card-header flex flex-row gap-2 justify-between">
                <div class="">
                  <h1 class="text-gray-600">Absent</h1>
                </div>
                <div class="">
                  <EllipsisVertical class="w-4 h-4" />
                </div>
              </div>
              <div class="card-content mt-4 flex flex-row gap-2 justify-between">
                <div class="">
                  <h1 class="text-4xl font-bold">{{ filteredStats.absent }}</h1>
                </div>
                <div class="">
                  <CircleX class="w-9 h-9 text-white rounded-full p-2 bg-[#ef4444]" />
                </div>
              </div>
              <div
                class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
              ></div>
            </div>
          </div>
        </div>
        <div>
          <div class="card bg-white w-65 shadow-md">
            <div class="card-body">
              <!--Card Content-->
              <div class="card-header flex flex-row gap-2 justify-between">
                <div class="">
                  <h1 class="text-gray-600">Late</h1>
                </div>
                <div class="">
                  <EllipsisVertical class="w-4 h-4" />
                </div>
              </div>
              <div class="card-content mt-4 flex flex-row gap-2 justify-between">
                <div class="">
                  <h1 class="text-4xl font-bold">{{ filteredStats.late }}</h1>
                </div>
                <div class="">
                  <Timer class="w-9 h-9 text-white rounded-full p-2 bg-[#F87A14]" />
                </div>
              </div>
              <div
                class="divider m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!--Todo Grid-->
      <div class="row-span-2 col-start-4">
        <div class="chart-todo-container flex w-full justify-between h-full">
          <!--todo list container-->
          <div
            class="todo glass flex flex-col rounded-md shadow-md border border-black bg-white w-full h-full"
          >
            <div
              class="todo-content flex flex-col justify-center items-center max-h-[600px] overflow-y-auto mt-5 text-sm"
            >
              <div class="todo-input w-[80%]">
                <input
                  v-model="newTask"
                  @keyup.enter="addTask"
                  type="text"
                  placeholder="Add a new todo"
                  class="w-full border-1 rounded-md text-black border-gray-300 focus:outline-none p-2 placeholder:text-gray-500"
                />
              </div>
              <div class="todo-list w-[80%] flex flex-col overflow-y-auto">
                <ul class="mt-5">
                  <li
                    v-for="(task, index) in todoList"
                    :key="task.id"
                    class="flex flex-row gap-2 items-center justify-between mb-2 border-b border-gray-300 pb-2"
                  >
                    <div class="flex flex-row gap-2 items-center">
                      <input
                        type="checkbox"
                        :checked="task.completed"
                        @change="toggleTask(index)"
                        class="checkbox checkbox-xs checkbox-neutral"
                      />
                      <span :class="{ 'line-through': task.completed }" class="text-black">
                        {{ task.text }}
                      </span>
                    </div>
                    <div class="">
                      <X class="w-4 h-4 text-black cursor-pointer" @click="removeTask(index)" />
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!--Chart Grid-->
      <div class="col-span-3 row-start-2">
        <div class="chart bg-white shadow-md rounded-md p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold text-gray-700">
              Attendance Statistics for {{ formattedDate }}
            </h2>
          </div>
          <div class="h-[400px]">
            <Pie :data="filteredChartData" :options="chartOptions" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart {
  transition: all 0.3s ease;
}

.chart:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

input[type='date'] {
  color: #374151;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  padding: 0.375rem 0.75rem;
}

input[type='date']::-webkit-calendar-picker-indicator {
  filter: invert(0%) brightness(0%);
  cursor: pointer;
}

/* For both Webkit browsers (Chrome, Safari, Edge) */
.todo-content::-webkit-scrollbar,
.todo-list::-webkit-scrollbar {
  width: 8px;
}

.todo-content::-webkit-scrollbar-track,
.todo-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.todo-content::-webkit-scrollbar-thumb,
.todo-list::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.todo-content::-webkit-scrollbar-thumb:hover,
.todo-list::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* For Firefox */
.todo-content,
.todo-list {
  scrollbar-width: thin;
  scrollbar-color: #888 #f1f1f1;
}
</style>
