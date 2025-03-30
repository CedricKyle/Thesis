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
import { useAttendanceStore } from '@/composables/Admin Composables/Human Resource/useAttendanceStore'

// Register Chart.js components
ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale)

const formatDate = computed(() => {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

const newTask = ref('')
const todoList = ref([])

const attendanceStore = useAttendanceStore()
const stats = attendanceStore.stats
const chartData = attendanceStore.chartData

const addTask = () => {
  if (newTask.value.trim() !== '') {
    todoList.value.push({ text: newTask.value, completed: false })
    newTask.value = ''
  }
}

const loadTast = () => {
  const saveTask = localStorage.getItem('todoList')
  if (saveTask) {
    todoList.value = JSON.parse(saveTask)
  }
}

const removeTask = (index) => {
  todoList.value.splice(index, 1)
}

watch(
  todoList,
  (newVal) => {
    localStorage.setItem('todoList', JSON.stringify(newVal))
  },
  { deep: true },
)

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
          const value = context.formattedValue
          return `${label}: ${value}%`
        },
      },
    },
  },
  animation: {
    animateScale: true,
    animateRotate: true,
  },
})

// Update every 5 seconds (optional)
onMounted(() => {
  loadTast()
  // Remove the interval update
  // setInterval(() => {
  //   updateChartData()
  // }, 5000)
})

// Update refresh function to actually refresh the data if needed
const refreshData = () => {
  // You can add real-time data fetching here if needed
  console.log('Data refreshed')
}
</script>

<template>
  <div class="min-h-screen overflow-y-auto pb-6">
    <div class="flex flex-col w-full gap-7">
      <div class="card-container flex flex-row w-full text-black justify-between gap-3">
        <div class="card bg-white w-70 shadow-md">
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
                <h1 class="text-4xl font-bold">{{ stats.present }}</h1>
              </div>
              <div class="">
                <UserRoundCheck class="w-10 h-10 text-white rounded-full p-2 bg-[#466114]" />
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

        <div class="card bg-white w-70 shadow-md">
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
                <h1 class="text-4xl font-bold">{{ stats.absent }}</h1>
              </div>
              <div class="">
                <CircleX class="w-10 h-10 text-white rounded-full p-2 bg-[#ef4444]" />
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

        <div class="card bg-white w-70 shadow-md">
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
                <h1 class="text-4xl font-bold">{{ stats.late }}</h1>
              </div>
              <div class="">
                <Timer class="w-10 h-10 text-white rounded-full p-2 bg-[#F87A14]" />
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

        <div class="card bg-white w-70 shadow-md">
          <div class="card-body">
            <!--Card Content-->
            <div class="card-header flex flex-row gap-2 justify-between">
              <div class="">
                <h1 class="">On Leave</h1>
              </div>
              <div class="">
                <EllipsisVertical class="w-4 h-4" />
              </div>
            </div>
            <div class="card-content mt-4 flex flex-row gap-2 justify-between">
              <div class="">
                <h1 class="text-4xl font-bold">{{ stats.onLeave }}</h1>
              </div>
              <div class="">
                <Footprints class="w-10 h-10 text-white rounded-full p-2 bg-[#866135]" />
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

      <div class="chart-todo-container flex w-full justify-between min-h-[500px]">
        <div class="chart w-[70%] bg-white shadow-md rounded-md p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold text-gray-700">Attendance Statistics</h2>
            <button
              @click="refreshData"
              class="text-primaryColor cursor-pointer hover:text-primaryColor/80"
            >
              <RotateCw />
            </button>
          </div>
          <div class="h-[400px]">
            <Pie :data="chartData" :options="chartOptions" />
          </div>
        </div>
        <div class="todo w-[28%] bg-primaryColor flex flex-col rounded-md shadow-md">
          <div class="title text-2xl font-bold text-center text-white mt-3">Todo List</div>

          <div class="flex justify-center items-center">
            <div
              class="divider w-[80%] m-0 before:bg-gray-300 after:bg-gray-300 before:h-[.5px] after:h-[.5px]"
            ></div>
          </div>

          <div
            class="todo-content flex flex-col justify-center items-center max-h-[400px] overflow-y-auto"
          >
            <div class="todo-input w-[80%]">
              <input
                v-model="newTask"
                @keyup.enter="addTask"
                type="text"
                placeholder="Add a new todo"
                class="w-full border-1 rounded-md text-white border-gray-300 focus:outline-none p-2"
              />
            </div>
            <div class="todo-list w-[80%] flex flex-col overflow-y-auto">
              <ul class="mt-5">
                <li
                  v-for="(task, index) in todoList"
                  :key="index"
                  class="flex flex-row gap-2 items-center justify-between mb-2 border-b border-gray-300 pb-2"
                >
                  <div class="flex flex-row gap-2 items-center">
                    <input type="checkbox" v-model="task.completed" class="checkbox checkbox-xs" />
                    <span :class="{ 'line-through': task.completed }" class="text-white">{{
                      task.text
                    }}</span>
                  </div>
                  <div class="">
                    <X class="w-4 h-4 text-white cursor-pointer" @click="removeTask(index)" />
                  </div>
                </li>
              </ul>
            </div>
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
</style>
