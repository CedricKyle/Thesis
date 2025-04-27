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
import { computed, ref, onMounted } from 'vue'
// Import Chart.js components
import { Pie, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  BarElement,
  LinearScale,
} from 'chart.js'
import { useAttendanceStore } from '@/stores/HR Management/attendanceStore'
import { storeToRefs } from 'pinia'
import { useEmployeeStore } from '@/stores/HR Management/employeeStore'
import { DEPARTMENTS } from '@/composables/Admin Composables/User & Role/role/permissionsId'

// Register Chart.js components
ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, BarElement, LinearScale)

// Date state
const selectedDate = ref(new Date().toISOString().split('T')[0]) // Default to today

const attendanceStore = useAttendanceStore()
const { attendanceRecords } = storeToRefs(attendanceStore)
const { loadRecords } = attendanceStore

// Add employee store
const employeeStore = useEmployeeStore()
const { employees } = storeToRefs(employeeStore)

// Dynamic department list (excluding Admin)
const departmentList = computed(() =>
  Object.values(DEPARTMENTS).filter((dept) => dept !== DEPARTMENTS.ADMIN),
)

// Trend range state
const trendRange = ref('1day') // options: '1day', '7days', '1month'

// Utility to get date range array
function getDateRange() {
  const end = new Date(selectedDate.value)
  let days = []
  if (trendRange.value === '1day') {
    days = [end.toISOString().split('T')[0]]
  } else if (trendRange.value === '7days') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(end)
      d.setDate(end.getDate() - i)
      days.push(d.toISOString().split('T')[0])
    }
  } else if (trendRange.value === '1month') {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(end)
      d.setDate(end.getDate() - i)
      days.push(d.toISOString().split('T')[0])
    }
  }
  return days
}

// Filtered stats based on selected range
const filteredStats = computed(() => {
  if (!attendanceRecords.value || !employees.value) {
    return { present: 0, absent: 0, late: 0 }
  }
  const dateRange = getDateRange()
  const activeEmployees = employees.value.filter(
    (employee) => !employee.deleted_at && employee.role !== 'Super Admin',
  )
  let present = 0
  let absent = 0
  let late = 0

  dateRange.forEach((date) => {
    const recordsForDate = attendanceRecords.value.filter((record) => record.date === date)
    const attendanceMap = new Map(recordsForDate.map((record) => [record.employee_id, record]))
    let dayPresent = 0
    let dayAbsent = activeEmployees.length
    let dayLate = 0
    activeEmployees.forEach((employee) => {
      const record = attendanceMap.get(employee.employee_id)
      if (record && record.signIn !== '-') {
        switch (record.status) {
          case 'Present':
          case 'Present + OT':
            dayPresent++
            dayAbsent--
            break
          case 'Late':
          case 'Late + OT':
            dayLate++
            dayAbsent--
            break
        }
      }
    })
    present += dayPresent
    absent += dayAbsent
    late += dayLate
  })
  return { present, absent, late }
})

// Pie chart data (still for the selected date only)
const filteredChartData = computed(() => {
  const total = employees.value?.length || 0
  const stats = filteredStats.value
  const getPercentage = (value) => (total > 0 ? Math.round((value / total) * 100) : 0)
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
const formattedDate = computed(() =>
  new Date(selectedDate.value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }),
)

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
      position: 'top',
      labels: {
        padding: 20,
        font: { size: 14 },
        usePointStyle: true,
        pointStyle: 'circle',
      },
    },
    title: {
      display: true,
      text: 'Attendance Trend',
      font: { size: 18 },
      color: '#466114',
      padding: { top: 10, bottom: 10 },
    },
    tooltip: {
      callbacks: {
        label: function (context) {
          const label = context.dataset.label || ''
          const value = context.raw || 0
          return `${label}: ${value}`
        },
      },
    },
  },
  animation: {
    animateScale: true,
    animateRotate: true,
  },
})

// Add this computed property for task completion percentage
const taskCompletionPercentage = computed(() => {
  if (todoList.value.length === 0) return 0
  const completedTasks = todoList.value.filter((task) => task.completed).length
  return Math.round((completedTasks / todoList.value.length) * 100)
})

// Add this computed property for the progress color
const progressColor = computed(() => {
  const percentage = taskCompletionPercentage.value
  if (percentage >= 80) return 'text-success'
  if (percentage >= 50) return 'text-warning'
  return 'text-error'
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

// Department breakdown for selected range
const departmentStats = computed(() => {
  if (!employees.value || !attendanceRecords.value) return []
  const dateRange = getDateRange()
  return departmentList.value.map((dept) => {
    const deptEmployees = employees.value.filter(
      (e) => e.department === dept && !e.deleted_at && e.role !== 'Super Admin',
    )
    let present = 0
    let absent = 0
    let late = 0
    let onLeave = 0

    dateRange.forEach((date) => {
      const records = attendanceRecords.value.filter(
        (r) => r.date === date && r.department === dept,
      )
      present += records.filter((r) => r.status === 'Present' || r.status === 'Present + OT').length
      late += records.filter((r) => r.status === 'Late' || r.status === 'Late + OT').length
      onLeave += records.filter((r) => r.status === 'On Leave').length

      // Absent: employees with no record or signIn === '-'
      const attendanceMap = new Map(records.map((r) => [r.employee_id, r]))
      deptEmployees.forEach((emp) => {
        const rec = attendanceMap.get(emp.employee_id)
        if (!rec || rec.signIn === '-') {
          absent++
        }
      })
    })

    return {
      name: dept,
      present,
      absent,
      late,
      onLeave,
      total: deptEmployees.length * dateRange.length, // total possible attendance slots
    }
  })
})

// Attendance trend chart data
const trendLabels = computed(() => {
  const today = new Date(selectedDate.value)
  let days = []
  if (trendRange.value === '1day') {
    days = [today.toISOString().split('T')[0]]
  } else if (trendRange.value === '7days') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      days.push(d.toISOString().split('T')[0])
    }
  } else if (trendRange.value === '1month') {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      days.push(d.toISOString().split('T')[0])
    }
  }
  return days
})

const attendanceTrendData = computed(() => {
  const present = []
  const absent = []
  const late = []
  trendLabels.value.forEach((date) => {
    const activeEmployees = employees.value.filter((e) => !e.deleted_at && e.role !== 'Super Admin')
    const records = attendanceRecords.value.filter((r) => r.date === date)
    const attendanceMap = new Map(records.map((r) => [r.employee_id, r]))
    let presentCount = 0,
      absentCount = 0,
      lateCount = 0
    activeEmployees.forEach((emp) => {
      const rec = attendanceMap.get(emp.employee_id)
      if (rec && rec.signIn !== '-') {
        if (rec.status === 'Present' || rec.status === 'Present + OT') presentCount++
        else if (rec.status === 'Late' || rec.status === 'Late + OT') lateCount++
      } else {
        absentCount++
      }
    })
    present.push(presentCount)
    absent.push(absentCount)
    late.push(lateCount)
  })
  return {
    labels: trendLabels.value,
    datasets: [
      { label: 'Present', data: present, backgroundColor: '#466114' },
      { label: 'Absent', data: absent, backgroundColor: '#ef4444' },
      { label: 'Late', data: late, backgroundColor: '#F87A14' },
    ],
  }
})

// Helper: Get date range for leaderboard
const leaderboardDateRange = computed(() => getDateRange())

// Helper: Get all attendance records in range
const recordsInRange = computed(() =>
  attendanceRecords.value
    ? attendanceRecords.value.filter((r) => leaderboardDateRange.value.includes(r.date))
    : [],
)

// Helper: Map employee_id to employee object
const employeeMap = computed(() => {
  const map = new Map()
  if (employees.value) {
    employees.value.forEach((e) => {
      if (!e.deleted_at && e.role !== 'Super Admin') map.set(e.employee_id, e)
    })
  }
  return map
})

// Count attendance per employee in range
function getAttendanceCounts(statuses) {
  const counts = {}
  recordsInRange.value.forEach((rec) => {
    if (!employeeMap.value.has(rec.employee_id)) return
    if (statuses.includes(rec.status)) {
      counts[rec.employee_id] = (counts[rec.employee_id] || 0) + 1
    }
  })
  return counts
}

// Top 3 Present
const topPresent = computed(() => {
  const counts = getAttendanceCounts(['Present', 'Present + OT'])
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, count]) => ({
      ...employeeMap.value.get(id),
      count,
    }))
})

// Top 3 Late
const topLate = computed(() => {
  const counts = getAttendanceCounts(['Late', 'Late + OT'])
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, count]) => ({
      ...employeeMap.value.get(id),
      count,
    }))
})

// Top 3 Absent (most days with no record or signIn === '-')
const topAbsent = computed(() => {
  const range = leaderboardDateRange.value
  const activeEmployees = employees.value
    ? employees.value.filter((e) => !e.deleted_at && e.role !== 'Super Admin')
    : []
  const absentCounts = {}
  activeEmployees.forEach((emp) => {
    let absent = 0
    range.forEach((date) => {
      const rec = recordsInRange.value.find(
        (r) => r.employee_id === emp.employee_id && r.date === date,
      )
      if (!rec || rec.signIn === '-') absent++
    })
    absentCounts[emp.employee_id] = absent
  })
  return Object.entries(absentCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, count]) => ({
      ...employeeMap.value.get(id),
      count,
    }))
})

// ALERTS: Employees with frequent absences or lateness in the selected range

// Helper: Get active employees
const activeEmployees = computed(() =>
  employees.value ? employees.value.filter((e) => !e.deleted_at && e.role !== 'Super Admin') : [],
)

// Helper: Get all attendance records in range
const alertRecordsInRange = computed(() =>
  attendanceRecords.value
    ? attendanceRecords.value.filter((r) => getDateRange().includes(r.date))
    : [],
)

// Frequent Absentees (e.g., absent >= 50% of days in range)
const frequentAbsentees = computed(() => {
  const range = getDateRange()
  return activeEmployees.value
    .map((emp) => {
      let absent = 0
      range.forEach((date) => {
        const rec = alertRecordsInRange.value.find(
          (r) => r.employee_id === emp.employee_id && r.date === date,
        )
        if (!rec || rec.signIn === '-') absent++
      })
      return { ...emp, absent }
    })
    .filter((emp) => emp.absent >= Math.ceil(range.length / 2))
    .sort((a, b) => b.absent - a.absent)
})

// Frequent Late (e.g., late >= 3 times in range)
const frequentLate = computed(() => {
  const counts = {}
  alertRecordsInRange.value.forEach((rec) => {
    if (rec.status === 'Late' || rec.status === 'Late + OT') {
      counts[rec.employee_id] = (counts[rec.employee_id] || 0) + 1
    }
  })
  return activeEmployees.value
    .map((emp) => ({
      ...emp,
      late: counts[emp.employee_id] || 0,
    }))
    .filter((emp) => emp.late >= 3)
    .sort((a, b) => b.late - a.late)
})

// No Records (no attendance at all in range)
const noRecords = computed(() => {
  const range = getDateRange()
  return activeEmployees.value.filter((emp) =>
    range.every(
      (date) =>
        !alertRecordsInRange.value.find(
          (r) => r.employee_id === emp.employee_id && r.date === date,
        ),
    ),
  )
})
</script>

<template>
  <div class="min-h-screen overflow-y-auto pb-6">
    <!-- Date Selector -->
    <div class="w-full flex justify-between mb-4">
      <div class="flex items-center gap-2">
        <input
          type="date"
          v-model="selectedDate"
          class="input input-bordered input-sm w-auto !outline-none hover:shadow-md"
        />
      </div>

      <div class="flex gap-2">
        <button
          class="btn-secondaryStyle"
          :class="trendRange === '1day' ? 'bg-primaryColor text-white' : 'bg-gray-200'"
          @click="trendRange = '1day'"
        >
          1 Day
        </button>
        <button
          class="btn-secondaryStyle"
          :class="trendRange === '7days' ? 'bg-primaryColor text-white' : 'bg-gray-200'"
          @click="trendRange = '7days'"
        >
          7 Days
        </button>
        <button
          class="btn-secondaryStyle"
          :class="trendRange === '1month' ? 'bg-primaryColor text-white' : 'bg-gray-200'"
          @click="trendRange = '1month'"
        >
          1 Month
        </button>
      </div>
    </div>

    <div class="grid grid-cols-4 grid-rows-[auto_auto_auto_auto] gap-4 text-black">
      <!--Stats Grid-->
      <div class="col-span-3 flex gap-4 justify-between">
        <div>
          <div class="card bg-white w-65 shadow-md">
            <div class="card-body">
              <div class="card-header flex flex-row gap-2 justify-between">
                <div><h1 class="text-gray-600">Present</h1></div>
                <div><EllipsisVertical class="w-4 h-4" /></div>
              </div>
              <div class="card-content mt-4 flex flex-row gap-2 justify-between">
                <div>
                  <h1 class="text-4xl font-bold">{{ filteredStats.present }}</h1>
                </div>
                <div>
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
              <div class="card-header flex flex-row gap-2 justify-between">
                <div><h1 class="text-gray-600">Absent</h1></div>
                <div><EllipsisVertical class="w-4 h-4" /></div>
              </div>
              <div class="card-content mt-4 flex flex-row gap-2 justify-between">
                <div>
                  <h1 class="text-4xl font-bold">{{ filteredStats.absent }}</h1>
                </div>
                <div>
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
              <div class="card-header flex flex-row gap-2 justify-between">
                <div><h1 class="text-gray-600">Late</h1></div>
                <div><EllipsisVertical class="w-4 h-4" /></div>
              </div>
              <div class="card-content mt-4 flex flex-row gap-2 justify-between">
                <div>
                  <h1 class="text-4xl font-bold">{{ filteredStats.late }}</h1>
                </div>
                <div>
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
          <div
            class="todo glass flex flex-col rounded-md shadow-md border border-black bg-white w-full h-full"
          >
            <div
              class="todo-content flex flex-col justify-center items-center max-h-[600px] overflow-y-auto mt-5 text-sm"
            >
              <div class="todo-input w-[90%]">
                <input
                  v-model="newTask"
                  @keyup.enter="addTask"
                  type="text"
                  placeholder="Add a new todo"
                  class="w-full border-1 rounded-md text-black border-gray-300 focus:outline-none p-2 placeholder:text-gray-500"
                />
                <div v-if="todoList.length > 0" class="flex items-center justify-start mt-2 gap-2">
                  <div
                    class="radial-progress"
                    :class="progressColor"
                    :style="`--value: ${taskCompletionPercentage}; --size: 3rem;`"
                  >
                    {{ taskCompletionPercentage }}%
                  </div>
                  <div class="text-xs text-gray-600">
                    <p>
                      Task Completed: {{ todoList.filter((t) => t.completed).length }}/{{
                        todoList.length
                      }}
                    </p>
                  </div>
                </div>
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
                        class="checkbox checkbox-xs"
                        :class="task.completed ? 'checkbox-success' : 'checkbox-neutral'"
                      />
                      <span
                        :class="{
                          'line-through text-gray-400': task.completed,
                          'text-black': !task.completed,
                        }"
                      >
                        {{ task.text }}
                      </span>
                    </div>
                    <div>
                      <X
                        class="w-4 h-4 cursor-pointer"
                        :class="task.completed ? 'text-gray-400' : 'text-black'"
                        @click="removeTask(index)"
                      />
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
        <div class="chart bg-white shadow-md rounded-md p-6 flex flex-col items-center">
          <div
            class="w-full"
            :style="`min-height: 350px; height: ${trendRange === '1month' ? 600 : 350}px;`"
          >
            <Bar :data="attendanceTrendData" :options="chartOptions" />
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="trendRange === '7days' || trendRange === '1month'"
      class="bg-white p-4 rounded shadow mb-6 text-black"
    >
      <h2 class="font-semibold mb-4">
        Employee Leaderboard ({{
          trendRange === '1day'
            ? formattedDate
            : trendRange === '7days'
              ? 'Last 7 Days'
              : 'Last 30 Days'
        }})
      </h2>
      <div class="grid grid-cols-3 gap-4">
        <!-- Most Present -->
        <div>
          <h3 class="font-semibold text-green-700 mb-2">Most Present</h3>
          <ol>
            <li v-for="(emp, idx) in topPresent" :key="emp.employee_id" class="mb-1">
              <span class="font-bold">{{ idx + 1 }}.</span>
              <span>{{ emp?.first_name }} {{ emp?.last_name }}</span>
              <span class="ml-2 text-xs text-gray-500">({{ emp.department }})</span>
              <span class="ml-2 text-xs text-gray-400">- {{ emp.count }} days</span>
            </li>
            <li v-if="topPresent.length === 0" class="text-gray-400">No data</li>
          </ol>
        </div>
        <!-- Most Late -->
        <div>
          <h3 class="font-semibold text-orange-600 mb-2">Most Late</h3>
          <ol>
            <li v-for="(emp, idx) in topLate" :key="emp.employee_id" class="mb-1">
              <span class="font-bold">{{ idx + 1 }}.</span>
              <span>{{ emp?.first_name }} {{ emp?.last_name }}</span>
              <span class="ml-2 text-xs text-gray-500">({{ emp.department }})</span>
              <span class="ml-2 text-xs text-gray-400">- {{ emp.count }} days</span>
            </li>
            <li v-if="topLate.length === 0" class="text-gray-400">No data</li>
          </ol>
        </div>
        <!-- Most Absent -->
        <div>
          <h3 class="font-semibold text-red-700 mb-2">Most Absent</h3>
          <ol>
            <li v-for="(emp, idx) in topAbsent" :key="emp.employee_id" class="mb-1">
              <span class="font-bold">{{ idx + 1 }}.</span>
              <span>{{ emp?.first_name }} {{ emp?.last_name }}</span>
              <span class="ml-2 text-xs text-gray-500">({{ emp.department }})</span>
              <span class="ml-2 text-xs text-gray-400">- {{ emp.count }} days</span>
            </li>
            <li v-if="topAbsent.length === 0" class="text-gray-400">No data</li>
          </ol>
        </div>
      </div>
    </div>

    <div class="bg-white p-4 rounded shadow mb-6 text-black">
      <h2 class="font-semibold mb-2">
        Department Breakdown
        <span v-if="trendRange === '1day'">({{ formattedDate }})</span>
        <span v-else-if="trendRange === '7days'">(Last 7 Days)</span>
        <span v-else>(Last 30 Days)</span>
      </h2>
      <table class="min-w-full text-sm">
        <thead>
          <tr>
            <th class="text-left px-2 py-1">Department</th>
            <th class="text-center px-2 py-1">Present</th>
            <th class="text-center px-2 py-1">Late</th>
            <th class="text-center px-2 py-1">Absent</th>
            <th class="text-center px-2 py-1">On Leave</th>
            <th class="text-center px-2 py-1">Total Slots</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="dept in departmentStats" :key="dept.name">
            <td class="px-2 py-1">{{ dept.name }}</td>
            <td class="text-center px-2 py-1">{{ dept.present }}</td>
            <td class="text-center px-2 py-1">{{ dept.late }}</td>
            <td class="text-center px-2 py-1">{{ dept.absent }}</td>
            <td class="text-center px-2 py-1">{{ dept.onLeave }}</td>
            <td class="text-center px-2 py-1">{{ dept.total }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="trendRange === '7days' || trendRange === '1month'"
      class="bg-white p-4 rounded shadow mb-6 text-black"
    >
      <h2 class="font-semibold mb-4">
        Attendance Alerts ({{
          trendRange === '1day'
            ? formattedDate
            : trendRange === '7days'
              ? 'Last 7 Days'
              : 'Last 30 Days'
        }})
      </h2>
      <div class="grid grid-cols-3 gap-4">
        <!-- Frequent Absentees -->
        <div>
          <h3 class="font-semibold text-red-700 mb-2">Frequent Absentees</h3>
          <ul>
            <li v-for="emp in frequentAbsentees" :key="emp.employee_id" class="mb-1">
              <span>{{ emp.first_name }} {{ emp.last_name }}</span>
              <span class="ml-2 text-xs text-gray-500">({{ emp.department }})</span>
              <span class="ml-2 text-xs text-gray-400">- {{ emp.absent }} absences</span>
            </li>
            <li v-if="frequentAbsentees.length === 0" class="text-gray-400">
              No frequent absentees
            </li>
          </ul>
        </div>
        <!-- Frequent Late -->
        <div>
          <h3 class="font-semibold text-orange-600 mb-2">Frequent Late</h3>
          <ul>
            <li v-for="emp in frequentLate" :key="emp.employee_id" class="mb-1">
              <span>{{ emp.first_name }} {{ emp.last_name }}</span>
              <span class="ml-2 text-xs text-gray-500">({{ emp.department }})</span>
              <span class="ml-2 text-xs text-gray-400">- {{ emp.late }} times</span>
            </li>
            <li v-if="frequentLate.length === 0" class="text-gray-400">No frequent latecomers</li>
          </ul>
        </div>
        <!-- No Records -->
        <div>
          <h3 class="font-semibold text-gray-700 mb-2">No Records</h3>
          <ul>
            <li v-for="emp in noRecords" :key="emp.employee_id" class="mb-1">
              <span>{{ emp.first_name }} {{ emp.last_name }}</span>
              <span class="ml-2 text-xs text-gray-500">({{ emp.department }})</span>
            </li>
            <li v-if="noRecords.length === 0" class="text-gray-400">All employees have records</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart {
  transition: all 0.3s ease;
  width: 100%;
  min-height: 350px;
  height: 350px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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

.radial-progress {
  transition: all 0.3s ease;
}

/* Optional: Add hover effect */
.radial-progress:hover {
  transform: scale(1.05);
}
</style>
