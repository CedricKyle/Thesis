import { defineStore } from 'pinia'
import { ref } from 'vue'
import { employeeScheduleAPI } from '@/services/main branch/employeeScheduleAPI'

export const useEmployeeScheduleStore = defineStore('employeeSchedule', () => {
  const employeeSchedules = ref([])
  const error = ref(null)
  const loading = ref(false)

  const addEmployeeSchedule = async (scheduleData) => {
    try {
      loading.value = true
      error.value = null

      // Add validation and logging
      console.log('Store received scheduleData:', scheduleData)

      if (!scheduleData.employee_id) {
        throw new Error('Employee ID is required')
      }
      if (!scheduleData.schedule_id) {
        throw new Error('Schedule ID is required')
      }

      // Transform the data to match backend expectations
      const payload = {
        employee_id: scheduleData.employee_id,
        schedule_id: scheduleData.schedule_id,
        remarks: scheduleData.remarks,
      }

      console.log('Sending payload to API:', payload)

      const response = await employeeScheduleAPI.assignSchedule(payload)
      await fetchEmployeeSchedules() // Refresh the list
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to add schedule'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  const updateEmployeeSchedule = async (id, scheduleData) => {
    try {
      loading.value = true
      error.value = null

      const payload = {
        schedule_id: scheduleData.schedule_id,
        remarks: scheduleData.remarks,
      }

      const response = await employeeScheduleAPI.updateSchedule(id, payload)
      await fetchEmployeeSchedules() // Refresh the list
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to update schedule'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  const deleteEmployeeSchedule = async (id) => {
    try {
      loading.value = true
      error.value = null

      await employeeScheduleAPI.deleteSchedule(id)
      await fetchEmployeeSchedules() // Refresh the list
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to delete schedule'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  const restoreEmployeeSchedule = async (id) => {
    try {
      loading.value = true
      error.value = null

      await employeeScheduleAPI.restoreSchedule(id)
      await fetchEmployeeSchedules() // Refresh the list
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to restore schedule'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  const fetchEmployeeSchedules = async () => {
    try {
      loading.value = true
      error.value = null

      const response = await employeeScheduleAPI.getAllSchedules()

      if (!response.data) {
        throw new Error('No data received from server')
      }

      // Store all schedules, both active and archived
      employeeSchedules.value = Array.isArray(response.data)
        ? response.data.map(formatScheduleData)
        : [formatScheduleData(response.data)]

      return response.data
    } catch (err) {
      console.error('Error fetching schedules:', err)
      error.value = err.response?.data?.message || 'Failed to fetch schedules'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  // Helper function to format schedule data
  const formatScheduleData = (schedule) => {
    // Helper function to format array or string
    const formatDays = (days) => {
      if (!days) return '-'
      if (typeof days === 'string') {
        // Remove brackets and quotes
        return days.replace(/[\[\]"]/g, '').replace(/,/g, ', ')
      }
      if (Array.isArray(days)) {
        return days.join(', ')
      }
      return days
    }

    return {
      id: schedule.id,
      employee_id: schedule.employee?.employee_id,
      employeeName: schedule.employee?.full_name,
      department: schedule.employee?.department,
      type: schedule.schedule?.type,
      timeIn: schedule.schedule?.time_in,
      timeOut: schedule.schedule?.time_out,
      day: formatDays(schedule.schedule?.work_days),
      dayOff: formatDays(schedule.schedule?.day_off),
      remarks: schedule.remarks || 'N/A',
      deleted_at: schedule.deleted_at,
    }
  }

  return {
    employeeSchedules,
    error,
    loading,
    addEmployeeSchedule,
    updateEmployeeSchedule,
    deleteEmployeeSchedule,
    restoreEmployeeSchedule,
    fetchEmployeeSchedules,
  }
})
