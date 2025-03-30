<script setup>
import { Users, UserRoundCheck, Timer, CircleX, EllipsisVertical, X } from 'lucide-vue-next'
import { computed, ref, watch, onMounted } from 'vue'

const formatDate = computed(() => {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

const newTask = ref('')
const todoList = ref([])

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

onMounted(() => {
  loadTast()
})
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

      <div class="chart-todo-container flex w-full justify-between min-h-[500px]">
        <div class="chart w-[70%] bg-white shadow-md rounded-md"></div>
        <div class="todo w-[28%] bg-secondaryColor flex flex-col rounded-md shadow-md">
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
                    <input type="checkbox" v-model="task.completed" class="checkbox" />
                    <span :class="{ 'line-through': task.completed }" class="text-white">{{
                      task.text
                    }}</span>
                  </div>
                  <div class="">
                    <X class="w-6 h-6 text-white cursor-pointer" @click="removeTask(index)" />
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
