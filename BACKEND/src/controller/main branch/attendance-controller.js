const { Employee, EmployeeAttendance, sequelize } = require('../../model/Index.js')
const { Op } = require('sequelize')
const ExcelJS = require('exceljs')
const PDFDocument = require('pdfkit')
const moment = require('moment')

const attendanceController = {
  // Record time in
  async timeIn(req, res) {
    const t = await sequelize.transaction()
    try {
      const { employee_id, time_in, date } = req.body

      if (!employee_id || !time_in || !date) {
        await t.rollback()
        return res.status(400).json({
          success: false,
          message: 'Employee ID, time in, and date are required',
        })
      }

      // Find the existing "Absent" record for today
      const attendance = await EmployeeAttendance.findOne({
        where: {
          employee_id,
          date: date,
          deleted_at: null,
        },
        transaction: t,
      })

      if (!attendance) {
        await t.rollback()
        return res.status(404).json({
          success: false,
          message: 'No absent record found for today. Please run the absent cron job.',
        })
      }

      // Determine if late (9:00 AM is start time)
      const [hours, minutes] = time_in.split(':').map(Number)
      const status = hours > 9 || (hours === 9 && minutes > 0) ? 'Late' : 'Present'

      await attendance.update(
        {
          time_in: time_in,
          status,
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

  // Record time out
  async timeOut(req, res) {
    const t = await sequelize.transaction()
    try {
      const { employee_id, time_out, date } = req.body

      if (!employee_id || !time_out || !date) {
        await t.rollback()
        return res.status(400).json({
          success: false,
          message: 'Employee ID, time out, and date are required',
        })
      }

      const attendance = await EmployeeAttendance.findOne({
        where: {
          employee_id,
          date: date,
          deleted_at: null,
        },
        transaction: t,
      })

      if (!attendance || !attendance.time_in) {
        await t.rollback()
        return res.status(400).json({
          success: false,
          message: 'No time in record found for this date',
        })
      }

      if (attendance.time_out) {
        await t.rollback()
        return res.status(400).json({
          success: false,
          message: 'Already timed out for this date',
        })
      }

      // Parse time strings and convert to minutes since midnight
      const parseTimeToMinutes = (timeStr) => {
        const [hours, minutes, seconds] = timeStr.split(':').map(Number)
        return hours * 60 + minutes + (seconds || 0) / 60
      }

      const inMinutes = parseTimeToMinutes(attendance.time_in)
      const outMinutes = parseTimeToMinutes(time_out)

      // Calculate total working minutes
      const totalMinutes = outMinutes - inMinutes

      // Convert to hours with 2 decimal places
      const workingHours = (totalMinutes / 60).toFixed(2)

      // Calculate overtime (anything over 8 hours)
      const overtimeHours = Math.max(0, (totalMinutes - 480) / 60).toFixed(2) // 480 minutes = 8 hours

      await attendance.update(
        {
          time_out: time_out,
          working_hours: workingHours,
          overtime_hours: overtimeHours,
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
          approved_by: approved_by,
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

      if (!start_date || !end_date) {
        return res
          .status(400)
          .json({ success: false, message: 'start_date and end_date are required' })
      }

      // 1. Get employee info
      const employee = await Employee.findOne({
        where: { employee_id, deleted_at: null },
        attributes: ['employee_id', 'full_name', 'department'],
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
            time_in: null,
            time_out: null,
            working_hours: 0,
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
        return res
          .status(400)
          .json({ success: false, message: 'start_date and end_date are required' })
      }

      // 1. Get all employees (if ALL_DEPARTMENTS) or by department
      const whereClause = { deleted_at: null }
      if (department !== 'ALL_DEPARTMENTS') {
        whereClause.department = department
      }
      // Exclude Super Admins
      whereClause.role = { [Op.not]: 'Super Admin' }
      const employees = await Employee.findAll({
        where: whereClause,
        attributes: ['employee_id', 'full_name', 'department'],
      })

      // 2. Build date range array
      const dateRange = getDateRangeArray(start_date, end_date)

      // 3. Fetch all attendance records for these employees in the range
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
            attributes: ['employee_id', 'full_name', 'department'],
          },
        ],
      })

      // 4. Build a map for quick lookup
      const attendanceMap = {}
      attendanceRecords.forEach((rec) => {
        attendanceMap[`${rec.employee_id}_${rec.date}`] = rec
      })

      // 5. Build the complete attendance grid
      const completeAttendance = []
      for (const emp of employees) {
        for (const date of dateRange) {
          const key = `${emp.employee_id}_${date}`
          if (attendanceMap[key]) {
            completeAttendance.push(attendanceMap[key])
          } else {
            // Virtual "Absent" record
            completeAttendance.push({
              employee_id: emp.employee_id,
              date,
              status: 'Absent',
              employee: emp,
              time_in: null,
              time_out: null,
              working_hours: 0,
              overtime_hours: 0,
              approval_status: 'Pending',
              approved_by: null,
              approved_at: null,
              created_at: null,
              deleted_at: null,
            })
          }
        }
      }

      // 6. Sort by date, then employee
      completeAttendance.sort((a, b) => {
        if (a.date === b.date) {
          return a.employee_id.localeCompare(b.employee_id)
        }
        return new Date(a.date) - new Date(b.date)
      })

      res.json({
        success: true,
        department,
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
              currentMonthData.attendance.filter((a) => a.time_in).map((a) => a.time_in),
            ),
            averageDepartureTime: calculateAverageTime(
              currentMonthData.attendance.filter((a) => a.time_out).map((a) => a.time_out),
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
          duration: calculateDuration(record.time_in, record.time_out),
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
            attributes: ['full_name', 'department'],
          },
          {
            model: Employee,
            as: 'approver',
            attributes: ['full_name'],
            foreignKey: 'approved_by',
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

      // Find the attendance record
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

      // Soft delete the record by setting deleted_at
      await attendance.update(
        {
          deleted_at: new Date(),
        },
        { transaction: t },
      )

      await t.commit()
      res.json({
        success: true,
        message: 'Attendance record deleted successfully',
      })
    } catch (error) {
      await t.rollback()
      res.status(500).json({
        success: false,
        message: error.message,
      })
    }
  },
}

// Helper functions
async function getMonthData(employee_id, month, year) {
  const daysInMonth = new Date(year, month, 0).getDate()
  const workingDays = calculateWorkingDays(year, month)

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
        attributes: ['full_name', 'department', 'job_title'],
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
      record.time_in,
      record.time_out,
      record.status,
      record.working_hours,
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
    doc.text(`${record.date}: ${record.time_in} - ${record.time_out} (${record.status})`)
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
      attendance.reduce((sum, a) => sum + Number(a.working_hours || 0), 0).toFixed(2),
    ),
    totalOvertimeHours: Number(
      attendance.reduce((sum, a) => sum + Number(a.overtime_hours || 0), 0).toFixed(2),
    ),
    averageWorkingHoursPerDay: Number(
      (
        attendance.reduce((sum, a) => sum + Number(a.working_hours || 0), 0) /
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
