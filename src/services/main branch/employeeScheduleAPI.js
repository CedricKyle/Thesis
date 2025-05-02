import axios from '@/plugins/axios'

export const employeeScheduleAPI = {
  getAllSchedules() {
    return axios.get('/api/employee-schedules')
  },

  assignSchedule(scheduleData) {
    return axios.post('/api/employee-schedules', scheduleData)
  },

  updateSchedule(id, scheduleData) {
    return axios.put(`/api/employee-schedules/${id}`, scheduleData)
  },

  deleteSchedule(id) {
    return axios.delete(`/api/employee-schedules/${id}`)
  },

  restoreSchedule(id) {
    return axios.post(`/api/employee-schedules/${id}/restore`)
  },
}
