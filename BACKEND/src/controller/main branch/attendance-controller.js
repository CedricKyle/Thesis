const { Employee, EmployeeAttendance, sequelize } = require('../../model/Index.js')
const { Op } = require('sequelize')

const attendanceController = {
  // Record time in
  async timeIn(req, res) {
    const t = await sequelize.transaction()
    try {
      const { employee_id } = req.body
      const now = new Date()
      const today = now.toISOString().split('T')[0]

      // Check for existing attendance
      let attendance = await EmployeeAttendance.findOne({
        where: {
          employee_id,
          date: today,
          deleted_at: null,
        },
        transaction: t,
      })

      if (attendance && attendance.time_in) {
        await t.rollback()
        return res.status(400).json({
          success: false,
          message: 'Already timed in for today',
        })
      }

      // Determine if late (9:00 AM is start time)
      const timeIn = now.toTimeString().split(' ')[0]
      const [hours, minutes] = timeIn.split(':').map(Number)
      const status = hours > 9 || (hours === 9 && minutes > 0) ? 'Late' : 'Present'

      if (!attendance) {
        attendance = await EmployeeAttendance.create(
          {
            employee_id,
            date: today,
            time_in: timeIn,
            status,
          },
          { transaction: t },
        )
      } else {
        await attendance.update(
          {
            time_in: timeIn,
            status,
          },
          { transaction: t },
        )
      }

      await t.commit()
      res.json({
        success: true,
        data: attendance,
      })
    } catch (error) {
      await t.rollback()
      res.status(500).json({
        success: false,
        message: error.message,
      })
    }
  },

  // Record time out
  async timeOut(req, res) {
    const t = await sequelize.transaction()
    try {
      const { employee_id } = req.body
      const now = new Date()
      const today = now.toISOString().split('T')[0]

      const attendance = await EmployeeAttendance.findOne({
        where: {
          employee_id,
          date: today,
          deleted_at: null,
        },
        transaction: t,
      })

      if (!attendance || !attendance.time_in) {
        await t.rollback()
        return res.status(400).json({
          success: false,
          message: 'No time in record found for today',
        })
      }

      if (attendance.time_out) {
        await t.rollback()
        return res.status(400).json({
          success: false,
          message: 'Already timed out for today',
        })
      }

      const timeOut = now.toTimeString().split(' ')[0]

      // Calculate working hours
      const timeInDate = new Date(`${today}T${attendance.time_in}`)
      const timeOutDate = new Date(`${today}T${timeOut}`)
      const workingHours = Number(((timeOutDate - timeInDate) / (1000 * 60 * 60)).toFixed(2))

      // Calculate overtime (if more than 8 hours)
      const overtime = Math.max(0, workingHours - 8)

      await attendance.update(
        {
          time_out: timeOut,
          working_hours: workingHours,
          overtime_hours: overtime,
        },
        { transaction: t },
      )

      await t.commit()
      res.json({
        success: true,
        data: attendance,
      })
    } catch (error) {
      await t.rollback()
      res.status(500).json({
        success: false,
        message: error.message,
      })
    }
  },

  // Approve attendance
  async approveAttendance(req, res) {
    const t = await sequelize.transaction()
    try {
      const { id } = req.params
      const { approved_by } = req.body

      const attendance = await EmployeeAttendance.findOne({
        where: {
          id,
          deleted_at: null,
        },
        transaction: t,
      })

      if (!attendance) {
        await t.rollback()
        return res.status(404).json({
          success: false,
          message: 'Attendance record not found',
        })
      }

      if (attendance.approval_status === 'Approved') {
        await t.rollback()
        return res.status(400).json({
          success: false,
          message: 'Attendance record is already approved',
        })
      }

      await attendance.update(
        {
          approval_status: 'Approved',
          approved_by,
          approved_at: new Date(),
        },
        { transaction: t },
      )

      await t.commit()
      res.json({
        success: true,
        data: attendance,
      })
    } catch (error) {
      await t.rollback()
      res.status(500).json({
        success: false,
        message: error.message,
      })
    }
  },

  // Get today's attendance
  async getTodayAttendance(req, res) {
    try {
      const { employee_id } = req.query

      // Add validation for employee_id
      if (!employee_id) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID is required',
        })
      }

      const today = new Date().toISOString().split('T')[0]

      const attendance = await EmployeeAttendance.findOne({
        where: {
          employee_id,
          date: today,
          deleted_at: null,
        },
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['full_name', 'department'],
          },
          {
            model: Employee,
            as: 'approver',
            attributes: ['full_name'],
          },
        ],
      })

      // If no attendance found, return appropriate message
      if (!attendance) {
        return res.json({
          success: true,
          data: null,
          message: 'No attendance record found for today',
        })
      }

      res.json({
        success: true,
        data: attendance,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      })
    }
  },

  // Get Attendance History
  async getAttendanceHistory(req, res) {
    try {
      const { employee_id } = req.params
      const { start_date, end_date } = req.query

      const where = {
        employee_id,
        deleted_at: null,
      }

      if (start_date && end_date) {
        where.date = {
          [Op.between]: [start_date, end_date],
        }
      }

      const attendance = await EmployeeAttendance.findAll({
        where,
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['full_name', 'department'],
          },
          {
            model: Employee,
            as: 'approver',
            attributes: ['full_name'],
          },
        ],
        order: [['date', 'DESC']],
      })

      res.json({
        success: true,
        data: attendance,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      })
    }
  },

  // Get Department Attendance
  async getDepartmentAttendance(req, res) {
    try {
      const { department } = req.params
      const date = req.query.date || new Date().toISOString().split('T')[0]

      const attendance = await EmployeeAttendance.findAll({
        where: {
          date,
          deleted_at: null,
        },
        include: [
          {
            model: Employee,
            as: 'employee',
            where: { department },
            attributes: ['full_name', 'department'],
          },
        ],
      })

      const summary = {
        total: attendance.length,
        present: attendance.filter((a) => a.status === 'Present').length,
        late: attendance.filter((a) => a.status === 'Late').length,
        absent: attendance.filter((a) => a.status === 'Absent').length,
      }

      res.json({
        success: true,
        date,
        department,
        summary,
        data: attendance,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      })
    }
  },

  // Get Monthly Report
  async getMonthlyReport(req, res) {
    try {
      const { employee_id } = req.params
      const { month, year } = req.query

      if (!month || !year) {
        return res.status(400).json({
          success: false,
          message: 'Month and year are required',
        })
      }

      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0)

      const attendance = await EmployeeAttendance.findAll({
        where: {
          employee_id,
          date: {
            [Op.between]: [startDate, endDate],
          },
          deleted_at: null,
        },
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['full_name', 'department'],
          },
        ],
        order: [['date', 'ASC']],
      })

      const summary = {
        totalDays: attendance.length,
        presentDays: attendance.filter((a) => a.status === 'Present').length,
        lateDays: attendance.filter((a) => a.status === 'Late').length,
        totalWorkingHours: attendance.reduce((sum, a) => sum + Number(a.working_hours || 0), 0),
        totalOvertimeHours: attendance.reduce((sum, a) => sum + Number(a.overtime_hours || 0), 0),
      }

      res.json({
        success: true,
        month,
        year,
        summary,
        data: attendance,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      })
    }
  },
}

module.exports = attendanceController
