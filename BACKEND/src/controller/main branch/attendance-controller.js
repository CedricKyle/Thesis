const {
  Employee,
  EmployeeAttendance,
  EmployeeSchedule,
  AvailableSchedule,
  Position,
  sequelize,
} = require('../../model/Index.js')
const { Op } = require('sequelize')
const ExcelJS = require('exceljs')
const PDFDocument = require('pdfkit')
const moment = require('moment')
const attendanceLogic = require('../../utils/attendance-logic-calculator.js')
const { getEmployeeRatePerHour } = require('../../utils/employee-utils.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
dayjs.extend(utc)
dayjs.extend(timezone)

const attendanceController = {
  // Record time in
  async timeIn(req, res) {
    const t = await sequelize.transaction()
    try {
      const { employee_id, date, start_time } = req.body

      if (!employee_id || !date || !start_time) {
        await t.rollback()
        return res
          .status(400)
          .json({ success: false, message: 'Employee ID, date, and start_time are required' })
      }

      // Find the existing "Absent" record for today
      const attendance = await EmployeeAttendance.findOne({
        where: { employee_id, date, absent: true, deleted_at: null },
        transaction: t,
      })

      if (!attendance) {
        // Hanapin kung may Day Off record
        const dayOffAttendance = await EmployeeAttendance.findOne({
          where: { employee_id, date, status: 'Day Off', deleted_at: null },
          transaction: t,
        })
        if (dayOffAttendance) {
          // I-update ang Day Off record to Rest Day attendance
          await dayOffAttendance.update(
            {
              start_time,
              status: 'Rest Day',
              absent: false,
              approval_status: 'Pending',
              hours_worked: 0,
              regular_hours: 0,
              overtime_hours: 0,
            },
            { transaction: t },
          )
          await t.commit()
          return res.json({ success: true, data: dayOffAttendance })
        }
        // Check if today is day off
        const empSchedule = await EmployeeSchedule.findOne({
          where: { employee_id, deleted_at: null },
          include: [{ model: AvailableSchedule, as: 'schedule' }],
        })
        if (!empSchedule || !empSchedule.schedule) {
          await t.rollback()
          return res.status(404).json({
            success: false,
            message: 'No schedule assigned for this employee.',
          })
        }
        const schedule = empSchedule.schedule
        const isDayOff = schedule && schedule.type === 'Day Off'
        if (isDayOff) {
          // Create rest day attendance record
          const newAttendance = await EmployeeAttendance.create(
            {
              employee_id,
              date,
              start_time,
              status: 'Rest Day',
              absent: false,
              schedule_id: empSchedule.id,
              approval_status: 'Pending',
              hours_worked: 0,
              regular_hours: 0,
              overtime_hours: 0,
            },
            { transaction: t },
          )
          await t.commit()
          return res.json({ success: true, data: newAttendance })
        }
        // Else, error as usual
        await t.rollback()
        return res.status(404).json({
          success: false,
          message: 'No absent record found for today. Please run the absent cron job.',
        })
      }

      // Get the employee's schedule for today
      const empSchedule = await EmployeeSchedule.findOne({
        where: { employee_id, deleted_at: null },
        include: [{ model: AvailableSchedule, as: 'schedule' }],
      })
      if (!empSchedule || !empSchedule.schedule) {
        await t.rollback()
        return res
          .status(404)
          .json({ success: false, message: 'No schedule assigned for this employee.' })
      }
      const schedule = empSchedule.schedule
      const scheduledStart = schedule.time_in // e.g. "08:00:00"
      const [schedH, schedM] = scheduledStart.split(':').map(Number)
      const [inH, inM] = start_time.split(':').map(Number)
      const scheduledStartMinutes = schedH * 60 + schedM
      const actualStartMinutes = inH * 60 + inM

      // Calculate allowed time-in window
      const minAllowedMinutes = scheduledStartMinutes - 30 // 30 mins before scheduled time-in
      const maxAllowedMinutes = scheduledStartMinutes + 300 // 5 hours after scheduled time-in

      if (actualStartMinutes < minAllowedMinutes) {
        await t.rollback()
        return res.status(400).json({
          success: false,
          message: `Too early to time-in. You can only time-in starting at ${String(Math.floor(minAllowedMinutes / 60)).padStart(2, '0')}:${String(
            minAllowedMinutes % 60,
          )
            .padStart(2, '0')
            .padStart(2, '0')}.`,
        })
      }
      if (actualStartMinutes > maxAllowedMinutes) {
        await t.rollback()
        return res.status(400).json({
          success: false,
          message: `Too late to time-in. You can only time-in up to 5 hours after your scheduled time-in.`,
        })
      }

      const late_minutes = attendanceLogic.calculateLateMinutes(scheduledStart, start_time)
      let status = late_minutes > 0 ? 'Late' : 'Present'
      const ratePerHour = await getEmployeeRatePerHour(employee_id)
      const tardinessDeduction =
        late_minutes > 0 ? ((late_minutes / 60) * ratePerHour).toFixed(2) : 0

      await attendance.update(
        {
          start_time,
          late_minutes,
          status,
          absent: false,
          schedule_id: empSchedule.id,
          tardiness_deduction: tardinessDeduction,
        },
        { transaction: t },
      )

      await t.commit()
      res.json({ success: true, data: attendance })
    } catch (error) {
      await t.rollback()
      res.status(500).json({ success: false, message: error.message })
    }
  },

  // Record time out
  async timeOut(req, res) {
    const t = await sequelize.transaction()
    try {
      const { employee_id, date, end_time } = req.body

      if (!employee_id || !date || !end_time) {
        await t.rollback()
        return res
          .status(400)
          .json({ success: false, message: 'Employee ID, date, and end_time are required' })
      }

      const attendance = await EmployeeAttendance.findOne({
        where: { employee_id, date, absent: false, deleted_at: null },
        transaction: t,
      })

      if (!attendance || !attendance.start_time) {
        await t.rollback()
        return res
          .status(400)
          .json({ success: false, message: 'No time in record found for this date' })
      }

      // Get the employee's schedule for today
      const empSchedule = await EmployeeSchedule.findOne({
        where: { id: attendance.schedule_id, deleted_at: null },
        include: [{ model: AvailableSchedule, as: 'schedule' }],
      })
      const schedule = empSchedule.schedule

      // Get the employee's rate per hour using the utility
      const ratePerHour = await getEmployeeRatePerHour(attendance.employee_id)

      // Only count up to scheduled out for hours_worked
      function minTime(a, b) {
        // Compare two time strings (HH:mm:ss)
        return a < b ? a : b
      }
      const actualOutForWork = minTime(end_time, schedule.time_out)
      const hours_worked = attendanceLogic.calculateHoursWorked(
        attendance.start_time,
        actualOutForWork,
      )
      const regular_hours = attendanceLogic.calculateHoursWorked(
        attendance.start_time,
        schedule.time_out,
      )
      const undertime = attendanceLogic.calculateUndertime(schedule.time_out, end_time)
      const nightDiff = attendanceLogic.calculateNightDifferential(
        attendance.start_time,
        end_time,
        hours_worked,
        ratePerHour,
      )

      // TODO: Replace with your actual logic for holidays/rest days
      const isHoliday = false
      const isSpecialHoliday = false
      const isRestDay = false

      const holidayPay = attendanceLogic.calculateHolidayPay(isHoliday, hours_worked, ratePerHour)
      const specialHolidayPay = attendanceLogic.calculateSpecialHolidayPay(
        isSpecialHoliday,
        hours_worked,
        ratePerHour,
      )
      const restDayPay = attendanceLogic.calculateRestDayPay(
        isRestDay,
        isHoliday,
        hours_worked,
        ratePerHour,
      )

      // If you want to calculate deductions, you need to pass late_minutes and absentDays
      // You may need to fetch these or calculate them as needed
      // const deductions = attendanceLogic.calculateDeductions(late_minutes, undertime, absentDays, ratePerHour)

      await attendance.update(
        {
          end_time,
          hours_worked,
          regular_hours,
          undertime,
          holiday_pay: holidayPay,
          special_holiday_pay: specialHolidayPay,
          rest_day_pay: restDayPay,
          night_diff_hours: nightDiff.nightHours,
          night_diff_pay: nightDiff.nightDiffPay,
          // DO NOT set overtime_hours here!
        },
        { transaction: t },
      )

      await t.commit()
      res.json({ success: true, data: attendance })
    } catch (error) {
      await t.rollback()
      res.status(500).json({ success: false, message: error.message })
    }
  },

  // Approve attendance (regular only)
  async approveAttendance(req, res) {
    const t = await sequelize.transaction()
    try {
      const { id } = req.params
      const { approved_by } = req.body

      const attendance = await EmployeeAttendance.findOne({
        where: { id, deleted_at: null },
        transaction: t,
      })

      if (!attendance) {
        await t.rollback()
        return res.status(404).json({ success: false, message: 'Attendance record not found' })
      }

      if (attendance.approval_status === 'Approved') {
        await t.rollback()
        return res.status(400).json({ success: false, message: 'Attendance already approved' })
      }

      // ... (overtime_hours calculation if needed) ...

      await attendance.update(
        {
          approval_status: 'Approved',
          approved_by,
          approved_at: new Date(),
        },
        { transaction: t },
      )

      await t.commit()
      res.json({ success: true, data: attendance })
    } catch (error) {
      await t.rollback()
      res.status(500).json({ success: false, message: error.message })
    }
  },

  // File overtime (update regular record)
  async fileOvertime(req, res) {
    const t = await sequelize.transaction()
    try {
      const { employee_id, date } = req.body
      const image = req.file

      if (!employee_id || !date || !image) {
        await t.rollback()
        return res
          .status(400)
          .json({ success: false, message: 'Employee ID, date, and image are required.' })
      }

      // Find the regular attendance record
      const regular = await EmployeeAttendance.findOne({
        where: {
          employee_id,
          date,
          deleted_at: null,
        },
        transaction: t,
      })
      if (!regular || !regular.start_time || !regular.end_time) {
        await t.rollback()
        return res
          .status(400)
          .json({ success: false, message: 'Complete regular attendance first.' })
      }
      // Check end_time >= 18:00
      const [h, m] = regular.end_time.split(':').map(Number)
      if (h < 18) {
        await t.rollback()
        return res
          .status(400)
          .json({ success: false, message: 'Overtime can only be filed after 6:00 PM.' })
      }
      // Check if attendance is approved
      if (regular.ot_approval_status === 'Approved' || regular.ot_approval_status === 'Rejected') {
        await t.rollback()
        return res
          .status(400)
          .json({ success: false, message: 'Cannot file OT. Already approved or rejected.' })
      }
      // Prevent duplicate OT filing
      if (regular.overtime_proof) {
        await t.rollback()
        return res
          .status(400)
          .json({ success: false, message: 'Overtime already filed for this date.' })
      }

      // Update the regular record with OT info
      const filePath = `/uploads/overtime_proofs/${image.filename}`
      await regular.update(
        {
          overtime_proof: filePath,
          ot_approval_status: 'Pending', // <-- ito lang ang gagalawin
        },
        { transaction: t },
      )

      await t.commit()
      res.json({ success: true, data: regular })
    } catch (error) {
      await t.rollback()
      res.status(500).json({ success: false, message: error.message })
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
            attributes: ['full_name', 'department', 'position_id'],
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

      if (!start_date || !end_date) {
        return res
          .status(400)
          .json({ success: false, message: 'start_date and end_date are required' })
      }

      // 1. Get employee info
      const employee = await Employee.findOne({
        where: { employee_id, deleted_at: null },
        attributes: ['employee_id', 'full_name', 'department', 'position_id'],
      })
      if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee not found' })
      }

      // 2. Build date range array
      function getDateRangeArray(start, end) {
        const arr = []
        let dt = new Date(start)
        while (dt <= new Date(end)) {
          arr.push(dt.toISOString().split('T')[0])
          dt.setDate(dt.getDate() + 1)
        }
        return arr
      }
      const dateRange = getDateRangeArray(start_date, end_date)

      // 3. Fetch all attendance records for this employee in the range
      const attendanceRecords = await EmployeeAttendance.findAll({
        where: {
          employee_id,
          date: { [Op.between]: [start_date, end_date] },
          deleted_at: null,
        },
        order: [['date', 'ASC']],
      })

      // 4. Build a map for quick lookup
      const attendanceMap = {}
      attendanceRecords.forEach((rec) => {
        attendanceMap[rec.date] = rec
      })

      // 5. Build the complete attendance grid
      const completeAttendance = dateRange.map((date) => {
        if (attendanceMap[date]) {
          return attendanceMap[date]
        } else {
          // Virtual "Absent" record
          return {
            employee_id: employee.employee_id,
            date,
            status: 'Absent',
            employee,
            start_time: null,
            end_time: null,
            hours_worked: 0,
            overtime_hours: 0,
            approval_status: 'Pending',
            approved_by: null,
            approved_at: null,
            created_at: null,
            deleted_at: null,
          }
        }
      })

      res.json({
        success: true,
        employee,
        start_date,
        end_date,
        data: completeAttendance,
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
      const { start_date, end_date } = req.query

      if (!start_date || !end_date) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required',
        })
      }

      // Get all non-Super Admin employees
      const employees = await Employee.findAll({
        where: {
          ...(department !== 'ALL_DEPARTMENTS' && { department }),
          deleted_at: null,
          role_id: { [Op.ne]: 1 }, // Exclude Super Admin
        },
        attributes: ['employee_id', 'full_name', 'department', 'position_id'],
      })

      // Get attendance records for these employees
      const attendanceRecords = await EmployeeAttendance.findAll({
        where: {
          employee_id: employees.map((e) => e.employee_id),
          date: { [Op.between]: [start_date, end_date] },
          deleted_at: null,
        },
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['employee_id', 'full_name', 'department', 'position_id'],
            where: {
              role_id: { [Op.ne]: 1 }, // Double-check to ensure no Super Admin records
            },
          },
        ],
      })

      // Create attendance map
      const attendanceMap = {}
      attendanceRecords.forEach((record) => {
        attendanceMap[`${record.employee_id}_${record.date}`] = record
      })

      // Generate date range
      const dates = []
      let currentDate = new Date(start_date)
      const endDate = new Date(end_date)
      while (currentDate <= endDate) {
        dates.push(currentDate.toISOString().split('T')[0])
        currentDate.setDate(currentDate.getDate() + 1)
      }

      // Build complete attendance grid with proper DTO format
      const completeAttendance = []
      for (const emp of employees) {
        for (const date of dates) {
          const key = `${emp.employee_id}_${date}`
          const record = attendanceMap[key]

          completeAttendance.push({
            id: record?.id || null,
            employee_id: emp.employee_id,
            full_name: emp.full_name,
            department: emp.department,
            date: date,
            signIn: record?.start_time || '-',
            signOut: record?.end_time || '-',
            hoursWorked: record?.hours_worked || 0,
            status: record?.status || 'Absent',
            approval_status: record?.approval_status || 'Pending',
            overtime_hours: record?.overtime_hours || 0,
            overtime_proof: record?.overtime_proof || null,
            ot_approval_status: record?.ot_approval_status || null,
            ot_approved_by: record?.ot_approved_by || null,
            ot_approved_at: record?.ot_approved_at || null,
          })
        }
      }

      return res.json({
        success: true,
        data: completeAttendance,
        metadata: {
          department,
          start_date,
          end_date,
          total_employees: employees.length,
          total_dates: dates.length,
        },
      })
    } catch (error) {
      console.error('Department attendance error:', error)
      return res.status(500).json({
        success: false,
        message: 'An error occurred while fetching department attendance',
        error: error.message,
      })
    }
  },

  // Get Monthly Report
  async getMonthlyReport(req, res) {
    try {
      const { employee_id } = req.params
      const { month, year, format } = req.query

      const reportMonth = parseInt(month) || new Date().getMonth() + 1
      const reportYear = parseInt(year) || new Date().getFullYear()

      // Get current month's data
      const currentMonthData = await getMonthData(employee_id, reportMonth, reportYear)

      // Get previous month's data for comparison
      const prevMonthData = await getMonthData(
        employee_id,
        reportMonth === 1 ? 12 : reportMonth - 1,
        reportMonth === 1 ? reportYear - 1 : reportYear,
      )

      // Get department averages
      const departmentAverages = await getDepartmentAverages(
        currentMonthData.employee.department,
        reportMonth,
        reportYear,
      )

      const report = {
        success: true,
        employee: currentMonthData.employee,
        period: {
          month: reportMonth,
          year: reportYear,
          daysInMonth: currentMonthData.daysInMonth,
          workingDays: currentMonthData.workingDays,
        },
        currentMonth: {
          attendance: {
            total: currentMonthData.attendance.length,
            present: currentMonthData.summary.presentDays,
            late: currentMonthData.summary.lateDays,
            absent: currentMonthData.workingDays - currentMonthData.attendance.length,
            attendanceRate: `${((currentMonthData.summary.presentDays / currentMonthData.workingDays) * 100).toFixed(2)}%`,
          },
          workingHours: {
            total: currentMonthData.summary.totalWorkingHours,
            average: currentMonthData.summary.averageWorkingHoursPerDay,
            overtime: currentMonthData.summary.totalOvertimeHours,
            expectedTotal: currentMonthData.workingDays * 8,
            efficiency: `${((currentMonthData.summary.totalWorkingHours / (currentMonthData.workingDays * 8)) * 100).toFixed(2)}%`,
          },
          punctuality: {
            onTime: currentMonthData.summary.attendance.onTime,
            late: currentMonthData.summary.attendance.late,
            averageArrivalTime: calculateAverageTime(
              currentMonthData.attendance.filter((a) => a.start_time).map((a) => a.start_time),
            ),
            averageDepartureTime: calculateAverageTime(
              currentMonthData.attendance.filter((a) => a.end_time).map((a) => a.end_time),
            ),
          },
          approvals: {
            approved: currentMonthData.summary.approvalStatus.approved,
            pending: currentMonthData.summary.approvalStatus.pending,
            rate: `${(currentMonthData.attendance.length > 0
              ? (currentMonthData.summary.approvalStatus.approved /
                  currentMonthData.attendance.length) *
                100
              : 0
            ).toFixed(2)}%`,
          },
        },
        comparison: {
          previousMonth: {
            attendanceRate: calculatePercentageChange(
              prevMonthData.summary.presentDays / prevMonthData.workingDays,
              currentMonthData.summary.presentDays / currentMonthData.workingDays,
            ),
            workingHours: calculatePercentageChange(
              prevMonthData.summary.averageWorkingHoursPerDay,
              currentMonthData.summary.averageWorkingHoursPerDay,
            ),
            punctuality: calculatePercentageChange(
              prevMonthData.summary.attendance.onTime / prevMonthData.attendance.length,
              currentMonthData.summary.attendance.onTime / currentMonthData.attendance.length,
            ),
          },
          departmentAverages: {
            attendanceRate: calculatePercentageChange(
              departmentAverages.attendanceRate,
              currentMonthData.summary.presentDays / currentMonthData.workingDays,
            ),
            workingHours: calculatePercentageChange(
              departmentAverages.averageWorkingHours,
              currentMonthData.summary.averageWorkingHoursPerDay,
            ),
            punctuality: calculatePercentageChange(
              departmentAverages.punctualityRate,
              currentMonthData.summary.attendance.onTime / currentMonthData.attendance.length,
            ),
          },
        },
        details: currentMonthData.attendance.map((record) => ({
          ...record.toJSON(),
          duration: calculateDuration(record.start_time, record.end_time),
          dayOfWeek: new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' }),
        })),
      }

      // Handle export formats
      if (format) {
        switch (format.toLowerCase()) {
          case 'excel':
            return await exportToExcel(res, report)
          case 'pdf':
            return await exportToPDF(res, report)
          default:
            return res.json(report)
        }
      }

      res.json(report)
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      })
    }
  },

  // Add this new method to your attendanceController object
  async getAllAttendance(req, res) {
    try {
      const attendance = await EmployeeAttendance.findAll({
        where: {
          deleted_at: null,
        },
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['full_name', 'department', 'position_id', 'role_id'],
          },
          {
            model: Employee,
            as: 'approver',
            attributes: ['full_name'],
            foreignKey: 'approved_by',
          },
          {
            model: EmployeeSchedule,
            as: 'schedule',
            include: [
              {
                model: AvailableSchedule,
                as: 'schedule',
                attributes: ['time_in', 'time_out'],
              },
            ],
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

  // Add this to attendanceController
  async deleteAttendance(req, res) {
    const t = await sequelize.transaction()
    try {
      const { id } = req.params

      // 1. Find the attendance record to delete
      const attendance = await EmployeeAttendance.findOne({
        where: { id, deleted_at: null },
        transaction: t,
      })

      if (!attendance) {
        await t.rollback()
        return res.status(404).json({
          success: false,
          message: 'Attendance record not found',
        })
      }

      // Save employee_id and date before deleting
      const { employee_id, date } = attendance

      // 2. Soft delete the record
      await attendance.update({ deleted_at: new Date() }, { transaction: t })

      // 3. Get the employee's schedule for this date
      const empSchedule = await EmployeeSchedule.findOne({
        where: { employee_id, deleted_at: null },
      })

      if (!empSchedule) {
        await t.rollback()
        return res.status(400).json({
          success: false,
          message: 'No schedule found for this employee. Cannot mark as absent.',
        })
      }

      // 4. Insert a new "Absent" record for the same employee and date, with schedule_id and Rejected status
      await EmployeeAttendance.create(
        {
          employee_id,
          date,
          status: 'Absent',
          approval_status: 'Rejected',
          attendance_type: 'regular',
          hours_worked: 0,
          overtime_hours: 0,
          start_time: null,
          end_time: null,
          overtime_proof: null,
          created_at: new Date(),
          schedule_id: empSchedule.id,
        },
        { transaction: t },
      )

      await t.commit()
      res.json({
        success: true,
        message: 'Attendance record deleted and Absent record created with Rejected status.',
      })
    } catch (error) {
      await t.rollback()
      res.status(500).json({
        success: false,
        message: error.message,
      })
    }
  },

  // Add this method to attendanceController
  async updateAttendance(req, res) {
    const t = await sequelize.transaction()
    try {
      const { id } = req.params
      const {
        start_time,
        end_time,
        date,
        status,
        approval_status,
        employee_id,
        department,
        // ...any other fields you want to allow updating
      } = req.body

      // Find the attendance record
      const attendance = await EmployeeAttendance.findOne({
        where: { id, deleted_at: null },
        transaction: t,
      })

      if (!attendance) {
        await t.rollback()
        return res.status(404).json({ success: false, message: 'Attendance record not found' })
      }

      // Prepare update fields
      const updateFields = {}
      if (start_time !== undefined) updateFields.start_time = start_time
      if (end_time !== undefined) updateFields.end_time = end_time
      if (date !== undefined) updateFields.date = date
      if (status !== undefined) updateFields.status = status
      if (approval_status !== undefined) updateFields.approval_status = approval_status
      if (employee_id !== undefined) updateFields.employee_id = employee_id
      if (department !== undefined) updateFields.department = department

      // If OT proof image is uploaded
      if (req.file) {
        const filePath = `/uploads/overtime_proofs/${req.file.filename}`
        updateFields.overtime_proof = filePath
      }

      // Optionally, recalculate working_hours if start_time/end_time changed
      if (updateFields.start_time && updateFields.end_time) {
        // Fetch the attendance record's schedule
        const empSchedule = await EmployeeSchedule.findOne({
          where: { id: attendance.schedule_id, deleted_at: null },
          include: [{ model: AvailableSchedule, as: 'schedule' }],
          transaction: t,
        })
        const schedule = empSchedule?.schedule
        const scheduledOut = schedule?.time_out || '17:00:00'

        // Use the logic function for break deduction
        // Get the earlier of end_time and scheduledOut
        const actualOutForWork =
          updateFields.end_time < scheduledOut ? updateFields.end_time : scheduledOut

        updateFields.hours_worked = attendanceLogic.calculateHoursWorked(
          updateFields.start_time,
          actualOutForWork,
        )
      }

      await attendance.update(updateFields, { transaction: t })

      await t.commit()
      res.json({ success: true, data: attendance })
    } catch (error) {
      await t.rollback()
      res.status(500).json({ success: false, message: error.message })
    }
  },

  // Reject Overtime
  async rejectOvertime(req, res) {
    const t = await sequelize.transaction()
    try {
      const { id } = req.params
      const { remarks } = req.body

      const attendance = await EmployeeAttendance.findOne({
        where: { id, deleted_at: null },
        transaction: t,
      })

      if (!attendance) {
        await t.rollback()
        return res.status(404).json({ success: false, message: 'Attendance record not found' })
      }

      // Mark as rejected and clear OT fields, but DO NOT touch approval_status
      await attendance.update(
        {
          overtime_proof: null,
          overtime_hours: 0,
          ot_approval_status: 'Rejected',
          ot_approved_by: null,
          ot_approved_at: null,
          ot_remarks: remarks || null,
        },
        { transaction: t },
      )

      await t.commit()
      res.json({ success: true, data: attendance })
    } catch (error) {
      await t.rollback()
      res.status(500).json({ success: false, message: error.message })
    }
  },

  // Add this to your attendanceController
  async rejectAttendance(req, res) {
    const t = await sequelize.transaction()
    try {
      const { id } = req.params

      // Find the attendance record
      const attendance = await EmployeeAttendance.findOne({
        where: { id, deleted_at: null },
        transaction: t,
      })

      if (!attendance) {
        await t.rollback()
        return res.status(404).json({
          success: false,
          message: 'Attendance record not found',
        })
      }

      // Mark as rejected and clear all attendance fields
      await attendance.update(
        {
          status: 'Absent',
          approval_status: 'Rejected',
          start_time: null,
          end_time: null,
          hours_worked: 0,
          overtime_hours: 0,
          overtime_proof: null,
          late_minutes: 0,
          tardiness_deduction: 0,
          undertime: 0,
          holiday_pay: 0,
          special_holiday_pay: 0,
          rest_day_pay: 0,
          night_diff_hours: 0,
          night_diff_pay: 0,
        },
        { transaction: t },
      )

      await t.commit()
      res.json({ success: true, message: 'Attendance record rejected and reset.' })
    } catch (error) {
      await t.rollback()
      res.status(500).json({ success: false, message: error.message })
    }
  },

  // Add this function to your controller object
  async markAllAbsentForToday(req, res) {
    try {
      const today = dayjs().tz('Asia/Manila').format('YYYY-MM-DD')
      const dayOfWeek = dayjs(today).tz('Asia/Manila').format('dddd')
      const employees = await Employee.findAll({ where: { deleted_at: null } })

      let marked = 0
      for (const emp of employees) {
        const empSchedule = await EmployeeSchedule.findOne({
          where: { employee_id: emp.employee_id, deleted_at: null },
          include: [{ model: AvailableSchedule, as: 'schedule' }],
        })
        if (!empSchedule || !empSchedule.schedule) continue

        let workDays = empSchedule.schedule.work_days
        if (typeof workDays === 'string') {
          try {
            workDays = JSON.parse(workDays)
          } catch {
            workDays = []
          }
        }
        if (!Array.isArray(workDays)) workDays = []
        if (!workDays.includes(dayOfWeek)) {
          // Insert Day Off record if not exists
          const existing = await EmployeeAttendance.findOne({
            where: { employee_id: emp.employee_id, date: today, deleted_at: null },
          })
          if (!existing) {
            await EmployeeAttendance.create({
              employee_id: emp.employee_id,
              schedule_id: empSchedule.id,
              date: today,
              absent: false,
              status: 'Day Off',
              approval_status: '',
              hours_worked: 0,
              regular_hours: 0,
              overtime_hours: 0,
            })
          }
          continue
        }

        const existing = await EmployeeAttendance.findOne({
          where: { employee_id: emp.employee_id, date: today, deleted_at: null },
        })
        if (!existing) {
          await EmployeeAttendance.create({
            employee_id: emp.employee_id,
            schedule_id: empSchedule.id,
            date: today,
            absent: true,
            status: 'Absent',
            approval_status: 'Pending',
            hours_worked: 0,
            regular_hours: 0,
            overtime_hours: 0,
          })
          marked++
        }
      }
      return res.json({ success: true, message: `Marked ${marked} employees as absent for today.` })
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message })
    }
  },

  // Approve Overtime
  async approveOvertime(req, res) {
    const t = await sequelize.transaction()
    try {
      const { id } = req.params
      const { ot_approved_by } = req.body

      const attendance = await EmployeeAttendance.findOne({
        where: { id, deleted_at: null },
        transaction: t,
      })

      if (!attendance) {
        await t.rollback()
        return res.status(404).json({ success: false, message: 'Attendance record not found' })
      }

      if (attendance.ot_approval_status === 'Approved') {
        await t.rollback()
        return res.status(400).json({ success: false, message: 'OT already approved' })
      }

      // --- DYNAMIC OT CALCULATION ---
      let overtimeHours = 0
      if (attendance.end_time && attendance.schedule_id) {
        // Get the schedule for this attendance
        const empSchedule = await EmployeeSchedule.findOne({
          where: { id: attendance.schedule_id, deleted_at: null },
          include: [{ model: AvailableSchedule, as: 'schedule' }],
          transaction: t,
        })
        const scheduledOut = empSchedule?.schedule?.time_out // e.g. "17:00" or "18:00"
        if (scheduledOut) {
          // Convert both times to minutes
          const [schedH, schedM] = scheduledOut.split(':').map(Number)
          const [endH, endM] = attendance.end_time.split(':').map(Number)
          const schedMinutes = schedH * 60 + schedM
          const endMinutes = endH * 60 + endM
          overtimeHours =
            endMinutes > schedMinutes ? ((endMinutes - schedMinutes) / 60).toFixed(2) : 0
        }
      }

      await attendance.update(
        {
          ot_approval_status: 'Approved',
          ot_approved_by,
          ot_approved_at: new Date(),
          overtime_hours: overtimeHours,
        },
        { transaction: t },
      )

      await t.commit()
      res.json({ success: true, data: attendance })
    } catch (error) {
      await t.rollback()
      res.status(500).json({ success: false, message: error.message })
    }
  },

  // Bulk approve attendance records
  async bulkApproveAttendance(req, res) {
    const t = await sequelize.transaction()
    try {
      const { ids, approved_by } = req.body
      if (!Array.isArray(ids) || !approved_by) {
        await t.rollback()
        return res
          .status(400)
          .json({ success: false, message: 'ids (array) and approved_by are required.' })
      }

      // Fetch all records to approve (not already approved)
      const records = await EmployeeAttendance.findAll({
        where: {
          id: ids,
          deleted_at: null,
          approval_status: { [Op.ne]: 'Approved' },
        },
        transaction: t,
      })

      if (!records.length) {
        await t.rollback()
        return res.status(404).json({ success: false, message: 'No records found to approve.' })
      }

      // Bulk update
      await Promise.all(
        records.map((record) =>
          record.update(
            {
              approval_status: 'Approved',
              approved_by,
              approved_at: new Date(),
            },
            { transaction: t },
          ),
        ),
      )

      await t.commit()
      res.json({ success: true, message: `${records.length} attendance records approved.` })
    } catch (error) {
      await t.rollback()
      res.status(500).json({ success: false, message: error.message })
    }
  },
}

// Helper functions
async function getMonthData(employee_id, month, year) {
  const daysInMonth = new Date(year, month, 0).getDate()
  const workingDays = calculateWorkingDays(year, month)

  // First check if employee is not Super Admin
  const employee = await Employee.findOne({
    where: {
      employee_id,
      role_id: { [Op.ne]: 1 }, // Exclude Super Admin
    },
  })

  if (!employee) {
    throw new Error('Employee not found or is Super Admin')
  }

  const attendance = await EmployeeAttendance.findAll({
    where: {
      employee_id,
      date: {
        [Op.between]: [new Date(year, month - 1, 1), new Date(year, month - 1, daysInMonth)],
      },
      deleted_at: null,
    },
    include: [
      {
        model: Employee,
        as: 'employee',
        attributes: ['full_name', 'department', 'position_id'],
        where: {
          role_id: { [Op.ne]: 1 }, // Double-check Super Admin exclusion
        },
      },
    ],
    order: [['date', 'ASC']],
  })

  return {
    attendance,
    daysInMonth,
    workingDays,
    employee: attendance[0]?.employee,
    summary: calculateSummary(attendance, workingDays),
  }
}

async function getDepartmentAverages(department, month, year) {
  const employees = await Employee.findAll({
    where: {
      department,
      deleted_at: null,
    },
  })

  const departmentStats = await Promise.all(
    employees.map((emp) => getMonthData(emp.employee_id, month, year)),
  )

  // Filter out invalid stats
  const validStats = departmentStats.filter(
    (stat) => stat.attendance && stat.attendance.length > 0 && stat.workingDays > 0,
  )

  if (validStats.length === 0) {
    return {
      attendanceRate: 0,
      averageWorkingHours: 0,
      punctualityRate: 0,
    }
  }

  return {
    attendanceRate: average(
      validStats.map((stat) => stat.summary.presentDays / stat.workingDays || 0),
    ),
    averageWorkingHours: average(
      validStats.map((stat) => stat.summary.averageWorkingHoursPerDay || 0),
    ),
    punctualityRate: average(
      validStats.map((stat) => {
        const total = stat.attendance.length
        return total > 0 ? stat.summary.attendance.onTime / total : 0
      }),
    ),
  }
}

async function exportToExcel(res, report) {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Monthly Report')

  // Add headers and styling
  worksheet.addRow(['Monthly Attendance Report'])
  worksheet.addRow([`Employee: ${report.employee.full_name}`])
  worksheet.addRow([`Period: ${report.period.month}/${report.period.year}`])

  // Add statistics
  worksheet.addRow(['Attendance Summary'])
  worksheet.addRow(['Present', 'Late', 'Absent', 'Attendance Rate'])
  worksheet.addRow([
    report.currentMonth.attendance.present,
    report.currentMonth.attendance.late,
    report.currentMonth.attendance.absent,
    report.currentMonth.attendance.attendanceRate,
  ])

  // Add detailed records
  worksheet.addRow(['Date', 'Time In', 'Time Out', 'Status', 'Working Hours', 'Overtime'])
  report.details.forEach((record) => {
    worksheet.addRow([
      record.date,
      record.start_time,
      record.end_time,
      record.status,
      record.hours_worked,
      record.overtime_hours,
    ])
  })

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=monthly_report_${report.period.month}_${report.period.year}.xlsx`,
  )

  return workbook.xlsx.write(res)
}

async function exportToPDF(res, report) {
  const doc = new PDFDocument()

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=monthly_report_${report.period.month}_${report.period.year}.pdf`,
  )

  doc.pipe(res)

  // Add content to PDF
  doc.fontSize(16).text('Monthly Attendance Report', { align: 'center' })
  doc.fontSize(12).text(`Employee: ${report.employee.full_name}`)
  doc.text(`Period: ${report.period.month}/${report.period.year}`)

  // Add statistics
  doc.moveDown()
  doc.text('Attendance Summary')
  doc.text(`Present: ${report.currentMonth.attendance.present}`)
  doc.text(`Late: ${report.currentMonth.attendance.late}`)
  doc.text(`Absent: ${report.currentMonth.attendance.absent}`)
  doc.text(`Attendance Rate: ${report.currentMonth.attendance.attendanceRate}`)

  // Add detailed records
  doc.moveDown()
  doc.text('Detailed Records')
  report.details.forEach((record) => {
    doc.text(`${record.date}: ${record.start_time} - ${record.end_time} (${record.status})`)
  })

  doc.end()
}

// Utility functions
function calculateWorkingDays(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate()
  let workingDays = 0

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day)
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      // Skip weekends
      workingDays++
    }
  }

  return workingDays
}

function calculatePercentageChange(previous, current) {
  // Handle cases where previous value is 0 or undefined
  if (!previous || previous === 0) {
    return {
      value: current ? '100.00' : '0.00',
      trend: current ? 'increase' : 'same',
    }
  }

  const change = ((current - previous) / previous) * 100
  return {
    value: isFinite(change) ? change.toFixed(2) : '0.00',
    trend: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'same',
  }
}

function calculateAverageTime(timeArray) {
  if (!timeArray.length) return '00:00'

  const totalMinutes = timeArray.reduce((sum, time) => {
    const [hours, minutes] = time.split(':').map(Number)
    return sum + (hours * 60 + minutes)
  }, 0)

  const averageMinutes = Math.round(totalMinutes / timeArray.length)
  const hours = Math.floor(averageMinutes / 60)
  const minutes = averageMinutes % 60

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

function average(numbers) {
  return numbers.reduce((a, b) => a + b, 0) / numbers.length
}

function calculateSummary(attendance, workingDays) {
  return {
    presentDays: attendance.filter((a) => a.status === 'Present').length,
    lateDays: attendance.filter((a) => a.status === 'Late').length,
    absentDays: workingDays - attendance.length,
    totalWorkingHours: Number(
      attendance.reduce((sum, a) => sum + Number(a.hours_worked || 0), 0).toFixed(2),
    ),
    totalOvertimeHours: Number(
      attendance.reduce((sum, a) => sum + Number(a.overtime_hours || 0), 0).toFixed(2),
    ),
    averageWorkingHoursPerDay: Number(
      (
        attendance.reduce((sum, a) => sum + Number(a.hours_worked || 0), 0) /
        (attendance.length || 1)
      ).toFixed(2),
    ),
    attendance: {
      onTime: attendance.filter((a) => a.status === 'Present').length,
      late: attendance.filter((a) => a.status === 'Late').length,
    },
    approvalStatus: {
      approved: attendance.filter((a) => a.approval_status === 'Approved').length,
      pending: attendance.filter((a) => a.approval_status === 'Pending' || !a.approval_status)
        .length,
    },
  }
}

function calculateDuration(timeIn, timeOut) {
  if (!timeIn || !timeOut) return null

  const [inHours, inMinutes] = timeIn.split(':').map(Number)
  const [outHours, outMinutes] = timeOut.split(':').map(Number)

  // Convert to total minutes
  const startMinutes = inHours * 60 + inMinutes
  const endMinutes = outHours * 60 + outMinutes

  // Calculate difference in minutes
  const durationMinutes = endMinutes - startMinutes

  // Convert back to hours and minutes
  const hours = Math.floor(durationMinutes / 60)
  const minutes = durationMinutes % 60

  // Format as HH:mm
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

function getDateRangeArray(start, end) {
  const arr = []
  let dt = new Date(start)
  while (dt <= new Date(end)) {
    arr.push(dt.toISOString().split('T')[0])
    dt.setDate(dt.getDate() + 1)
  }
  return arr
}

module.exports = attendanceController
