const { AvailableSchedule } = require('../../model/Index.js')

const createSchedule = async (req, res) => {
  try {
    const { type, time_in, time_out, work_days, day_off, remarks } = req.body
    const schedule = await AvailableSchedule.create({
      type,
      time_in,
      time_out,
      work_days,
      day_off,
      remarks,
    })
    res.status(201).json({ message: 'Schedule created', data: schedule })
  } catch (error) {
    res.status(500).json({ message: 'Error creating schedule', error: error.message })
  }
}

const getSchedules = async (req, res) => {
  try {
    const schedules = await AvailableSchedule.findAll({ paranoid: false })
    res.json(schedules)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching schedules', error: error.message })
  }
}

const getScheduleById = async (req, res) => {
  try {
    const schedule = await AvailableSchedule.findByPk(req.params.id)
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' })
    res.json(schedule)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching schedule', error: error.message })
  }
}

const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params
    const [updated] = await AvailableSchedule.update(req.body, { where: { id } })
    if (!updated) return res.status(404).json({ message: 'Schedule not found' })
    const updatedSchedule = await AvailableSchedule.findByPk(id)
    res.json({ message: 'Schedule updated', data: updatedSchedule })
  } catch (error) {
    res.status(500).json({ message: 'Error updating schedule', error: error.message })
  }
}

const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params
    const deleted = await AvailableSchedule.destroy({ where: { id } })
    if (!deleted) return res.status(404).json({ message: 'Schedule not found' })
    res.json({ message: 'Schedule deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Error deleting schedule', error: error.message })
  }
}

const restoreSchedule = async (req, res) => {
  try {
    const { id } = req.params
    await AvailableSchedule.restore({ where: { id } })
    res.json({ message: 'Schedule restored' })
  } catch (error) {
    res.status(500).json({ message: 'Error restoring schedule', error: error.message })
  }
}

module.exports = {
  createSchedule,
  getSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
  restoreSchedule,
}
