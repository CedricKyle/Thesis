const { EmployeeSchedule, Employee, AvailableSchedule } = require('../../model/Index.js')

const assignSchedule = async (req, res) => {
  try {
    const { employee_id, schedule_id, remarks } = req.body

    // Add logging
    console.log('Received request body:', req.body)
    console.log('employee_id:', employee_id)
    console.log('schedule_id:', schedule_id)

    // Find employee by employee_id
    const employee = await Employee.findOne({
      where: {
        employee_id: employee_id,
      },
    })

    console.log('Found employee:', employee)

    if (!employee) {
      return res.status(404).json({
        message: 'Employee not found',
        debug: {
          searched_employee_id: employee_id,
        },
      })
    }

    // Check if schedule exists
    const schedule = await AvailableSchedule.findByPk(schedule_id)
    console.log('Found schedule:', schedule)

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' })
    }

    // Check for existing active schedule for this employee
    const existingSchedule = await EmployeeSchedule.findOne({
      where: {
        employee_id: employee.employee_id,
        deleted_at: null,
      },
    })

    if (existingSchedule) {
      return res.status(400).json({
        message:
          'Employee already has an active schedule. Please archive the existing schedule first.',
      })
    }

    const employeeSchedule = await EmployeeSchedule.create({
      employee_id: employee.employee_id,
      schedule_id,
      remarks,
    })

    res.status(201).json({
      message: 'Schedule assigned successfully',
      data: employeeSchedule,
    })
  } catch (error) {
    console.error('Error in assignSchedule:', error)
    res.status(500).json({ message: 'Error assigning schedule', error: error.message })
  }
}

const getEmployeeSchedules = async (req, res) => {
  try {
    const schedules = await EmployeeSchedule.findAll({
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['employee_id', 'full_name', 'department'],
          paranoid: false,
        },
        {
          model: AvailableSchedule,
          as: 'schedule',
          paranoid: false,
        },
      ],
      paranoid: false, // This will include soft deleted records
    })
    res.json(schedules)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching schedules', error: error.message })
  }
}

const updateEmployeeSchedule = async (req, res) => {
  try {
    const { id } = req.params
    const { schedule_id, remarks } = req.body

    const schedule = await EmployeeSchedule.findByPk(id)
    if (!schedule) {
      return res.status(404).json({ message: 'Employee schedule not found' })
    }

    await schedule.update({ schedule_id, remarks })

    const updatedSchedule = await EmployeeSchedule.findByPk(id, {
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['employee_id', 'full_name', 'department'],
          paranoid: false,
        },
        {
          model: AvailableSchedule,
          as: 'schedule',
          paranoid: false,
        },
      ],
      paranoid: false,
    })

    res.json({
      message: 'Schedule updated successfully',
      data: updatedSchedule,
    })
  } catch (error) {
    res.status(500).json({ message: 'Error updating schedule', error: error.message })
  }
}

const deleteEmployeeSchedule = async (req, res) => {
  try {
    const { id } = req.params

    // Check if schedule exists
    const schedule = await EmployeeSchedule.findByPk(id)
    if (!schedule) {
      return res.status(404).json({ message: 'Employee schedule not found' })
    }

    // Use soft delete
    await schedule.update({ deleted_at: new Date() })

    res.json({ message: 'Schedule archived successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Error archiving schedule', error: error.message })
  }
}

const restoreEmployeeSchedule = async (req, res) => {
  try {
    const { id } = req.params

    // Find the schedule including soft deleted ones
    const schedule = await EmployeeSchedule.findByPk(id, { paranoid: false })
    if (!schedule) {
      return res.status(404).json({ message: 'Employee schedule not found' })
    }

    // Clear the deleted_at field
    await schedule.update({ deleted_at: null })

    res.json({ message: 'Schedule restored successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Error restoring schedule', error: error.message })
  }
}

const getEmployeeSchedule = async (req, res) => {
  const { employee_id } = req.params
  try {
    const schedule = await EmployeeSchedule.findOne({
      where: { employee_id, deleted_at: null },
      include: [{ model: AvailableSchedule, as: 'schedule' }],
    })
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'No schedule found' })
    }
    res.json({
      success: true,
      data: {
        time_in: schedule.schedule.time_in,
        time_out: schedule.schedule.time_out,
        type: schedule.schedule.type,
        work_days: schedule.schedule.work_days,
        day_off: schedule.schedule.day_off,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const getActiveEmployeeSchedules = async (req, res) => {
  try {
    const schedules = await EmployeeSchedule.findAll({
      where: { deleted_at: null }, // Only active
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['employee_id', 'full_name', 'department'],
        },
        {
          model: AvailableSchedule,
          as: 'schedule',
        },
      ],
    })
    res.json(schedules)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching active schedules', error: error.message })
  }
}

module.exports = {
  assignSchedule,
  getEmployeeSchedules,
  updateEmployeeSchedule,
  deleteEmployeeSchedule,
  restoreEmployeeSchedule,
  getEmployeeSchedule,
  getActiveEmployeeSchedules,
}
