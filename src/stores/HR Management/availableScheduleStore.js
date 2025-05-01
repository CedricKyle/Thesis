import { defineStore } from 'pinia'
import axios from 'axios'
import { ref } from 'vue'

export const useAvailableScheduleStore = defineStore('availableSchedule', () => {
  const schedules = ref([])
  const archivedSchedules = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Fetch active schedules
  async function fetchSchedules(includeDeleted = false) {
    loading.value = true
    error.value = null
    try {
      const res = await axios.get('/api/available-schedules', {
        params: includeDeleted ? { includeDeleted: true } : {},
      })
      // Filter out deleted if not including
      if (includeDeleted) {
        schedules.value = res.data.filter((s) => !s.deleted_at)
        archivedSchedules.value = res.data.filter((s) => s.deleted_at)
      } else {
        schedules.value = res.data
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message
    } finally {
      loading.value = false
    }
  }

  // Fetch archived schedules
  async function fetchArchivedSchedules() {
    try {
      const res = await axios.get('/api/available-schedules?archived=true')
      archivedSchedules.value = res.data
    } catch (err) {
      error.value = err.message
    }
  }

  async function addSchedule(schedule) {
    loading.value = true
    error.value = null
    try {
      const res = await axios.post('/api/available-schedules', schedule)
      schedules.value.push(res.data.data)
      return res.data.data
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateSchedule(id, schedule) {
    loading.value = true
    error.value = null
    try {
      const res = await axios.put(`/api/available-schedules/${id}`, schedule)
      const idx = schedules.value.findIndex((s) => s.id === id)
      if (idx !== -1) schedules.value[idx] = res.data.data
      return res.data.data
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteSchedule(id) {
    loading.value = true
    error.value = null
    try {
      await axios.delete(`/api/available-schedules/${id}`)
      schedules.value = schedules.value.filter((s) => s.id !== id)
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function restoreSchedule(id) {
    loading.value = true
    error.value = null
    try {
      await axios.post(`/api/available-schedules/${id}/restore`)
      await fetchSchedules(true)
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    schedules,
    archivedSchedules,
    loading,
    error,
    fetchSchedules,
    fetchArchivedSchedules,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    restoreSchedule,
  }
})
