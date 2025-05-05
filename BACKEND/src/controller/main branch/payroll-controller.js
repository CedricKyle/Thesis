const {
  Employee,
  EmployeeAttendance,
  Position,
  Payroll,
  EmployeeDeduction,
  AuditLog,
  PayrollDeduction,
  EmployeeSchedule,
  AvailableSchedule,
} = require('../../model/Index.js')
const { Op } = require('sequelize')
const { computePHWithholdingTax } = require('../../utils/ph-tax-calculator')
const attendanceLogic = require('../../utils/attendance-logic-calculator.js')

function getWeekNumber(dateString) {
  const date = new Date(dateString)
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
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

function getEmployeeDayOffs(schedule) {
  if (!schedule || !schedule.day_off) return []
  try {
    const arr = JSON.parse(schedule.day_off)
    // If array of numbers, return as is. If array of strings, map to numbers.
    if (typeof arr[0] === 'number') return arr
    // Map string days to numbers
    const dayMap = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    }
    return arr.map((d) => dayMap[d] ?? Number(d))
  } catch {
    return []
  }
}

const payrollController = {
  // Generate payrolls for all employees for a given period
  async generatePayrolls(req, res) {
    try {
      const { start_date, end_date } = req.body
      if (!start_date || !end_date) {
        return res.status(400).json({ success: false, message: 'Start and end date required.' })
      }

      // Check if payrolls already exist for this period
      const existing = await Payroll.findOne({ where: { start_date, end_date, deleted_at: null } })
      if (existing) {
        return res
          .status(409)
          .json({ success: false, message: 'Payrolls already generated for this period.' })
      }

      const employees = await Employee.findAll({
        where: {
          deleted_at: null,
          role_id: { [Op.ne]: 1 }, // Exclude Super Admin
        },
      })
      if (!employees.length) {
        return res.status(404).json({ success: false, message: 'No employees found.' })
      }

      for (const emp of employees) {
        // 1. Get attendance records for the period
        const attendance = await EmployeeAttendance.findAll({
          where: {
            employee_id: emp.employee_id,
            date: { [Op.between]: [start_date, end_date] },
            deleted_at: null,
            approval_status: { [Op.ne]: 'Rejected' },
          },
        })

        // 2. Get employee's schedule (to get day_off)
        const employeeSchedule = await EmployeeSchedule.findOne({
          where: { employee_id: emp.employee_id, deleted_at: null },
          include: [{ model: AvailableSchedule, as: 'schedule' }],
        })

        // 3. Build date range and count present/absent
        const allDates = getDateRangeArray(start_date, end_date)
        const dayOffs = getEmployeeDayOffs(employeeSchedule?.schedule)
        let daysPresent = 0
        let daysAbsent = 0

        let restDayPay = 0
        let restDayHours = 0

        // Move this before the for-loop
        const position = await Position.findOne({ where: { id: emp.position_id } })
        const ratePerHour = position ? position.rate_per_hour : 0

        console.log(
          'EMPLOYEE:',
          emp.employee_id,
          'SCHEDULE:',
          employeeSchedule?.schedule?.day_off,
          'dayOffs:',
          dayOffs,
        )
        for (const date of allDates) {
          const dayOfWeek = new Date(date).getDay()
          const rec = attendance.find((a) => a.date === date)
          console.log(
            'DATE:',
            date,
            'dayOfWeek:',
            dayOfWeek,
            'isDayOff:',
            dayOffs.includes(dayOfWeek),
            'rec:',
            rec?.status,
          )

          if (dayOffs.includes(dayOfWeek)) {
            // Day off
            if (
              rec &&
              rec.approval_status === 'Approved' &&
              rec.status === 'Rest Day' &&
              rec.start_time &&
              rec.end_time
            ) {
              console.log('REST DAY PAY DEBUG:', {
                employee: emp.employee_id,
                date,
                hours_worked: rec.hours_worked,
                ratePerHour: position ? position.rate_per_hour : 0,
                calculated: attendanceLogic.calculateRestDayPay(
                  true,
                  false,
                  rec.hours_worked,
                  position ? position.rate_per_hour : 0,
                ),
              })
              restDayPay += Number(
                attendanceLogic.calculateRestDayPay(
                  true,
                  false,
                  rec.hours_worked,
                  position ? position.rate_per_hour : 0,
                ),
              )
              restDayHours += Number(rec.hours_worked)
            }
            // else: skip, walang attendance sa day off
            continue
          }

          // Regular workday
          if (rec && rec.approval_status === 'Approved' && !rec.absent) {
            daysPresent++
          } else {
            daysAbsent++
          }
        }

        const validAttendance = attendance.filter((a) => a.approval_status !== 'Rejected')
        const totalHours = validAttendance.reduce((sum, a) => sum + Number(a.hours_worked || 0), 0)
        const approvedOT = attendance.filter(
          (a) => a.overtime_hours > 0 && a.ot_approval_status === 'Approved',
        )
        const overtimeHours = approvedOT.reduce((sum, a) => sum + Number(a.overtime_hours || 0), 0)
        const overtimePay = overtimeHours * (ratePerHour * 1.25)
        const tardinessHours = Number(
          attendance
            .reduce(
              (sum, a) =>
                sum +
                (a.tardiness_hours !== undefined
                  ? Number(a.tardiness_hours)
                  : Number(a.late_minutes || 0) / 60),
              0,
            )
            .toFixed(2),
        )
        const absences = attendance.filter((a) => a.absent).length
        const absentDeduction = attendance.reduce(
          (sum, a) => sum + Number(a.absent_deduction || 0),
          0,
        )
        const holidayPay = attendance.reduce((sum, a) => sum + Number(a.holiday_pay || 0), 0)
        const tardinessDeduction = attendance.reduce(
          (sum, a) => sum + Number(a.tardiness_deduction || 0),
          0,
        )

        const regularPay = totalHours * ratePerHour
        const grossPay = regularPay + overtimePay + holidayPay + restDayPay

        // If semi-monthly, multiply grossPay by 2 to get monthly equivalent
        const monthlyTax = computePHWithholdingTax(grossPay * 2)
        const taxDeduction = monthlyTax / 2

        // Get all active deductions for this grossPay
        const deductions = await EmployeeDeduction.findAll({
          where: {
            salary_range_from: { [Op.lte]: grossPay },
            salary_range_to: { [Op.gte]: grossPay },
            effective_date: { [Op.lte]: new Date() },
            [Op.or]: [{ end_date: null }, { end_date: { [Op.gte]: new Date() } }],
            deleted_at: null,
          },
        })

        // Prepare deduction breakdown and total
        let totalMandatoryDeduction = 0
        let deductionBreakdown = []

        for (const d of deductions) {
          let contribution = grossPay * (d.percentage_rate / 100)
          if (d.minimum_contribution && contribution < d.minimum_contribution)
            contribution = parseFloat(d.minimum_contribution)
          if (d.maximum_contribution && contribution > d.maximum_contribution)
            contribution = parseFloat(d.maximum_contribution)
          const employeeShare = contribution * (d.employee_share / d.percentage_rate)
          const employerShare = contribution * (d.employer_share / d.percentage_rate)
          totalMandatoryDeduction += employeeShare

          deductionBreakdown.push({
            deduction_type: d.deduction_type,
            description: d.description,
            amount: employeeShare,
            employee_share: employeeShare,
            employer_share: employerShare,
          })
        }

        // Add to other deductions
        const deduction =
          tardinessDeduction + absentDeduction + totalMandatoryDeduction + taxDeduction
        const netPay = grossPay - deduction

        // Create payroll first
        const payroll = await Payroll.create({
          employee_id: emp.employee_id,
          month: new Date(start_date).getMonth() + 1,
          quarter: Math.floor((new Date(start_date).getMonth() + 3) / 3),
          week: getWeekNumber(start_date),
          start_date,
          end_date,
          payroll_date: new Date(),
          days_present: daysPresent,
          total_hours_worked: totalHours,
          regular_hour_pay: regularPay,
          days_absent: absences,
          absent_deduction: absentDeduction,
          overtime_pay: overtimePay,
          tardiness_hours: tardinessHours,
          status: 0, // Draft
          allowance: 0,
          bonus: 0,
          paid_holiday: holidayPay,
          deduction,
          gross_pay: grossPay,
          salary_before_tax: grossPay,
          net_pay: netPay,
          tax_deduction: taxDeduction,
          overtime_hours: overtimeHours,
          tardiness_deduction: tardinessDeduction,
          rest_day_pay: restDayPay,
          rest_day_hours: restDayHours,
        })

        // Now save deduction breakdowns
        for (const breakdown of deductionBreakdown) {
          await PayrollDeduction.create({
            payroll_id: payroll.id,
            deduction_type: breakdown.deduction_type,
            description: breakdown.description,
            amount: breakdown.amount,
            employee_share: breakdown.employee_share,
            employer_share: breakdown.employer_share,
          })
        }
      }

      res.json({ success: true, message: 'Payrolls generated!' })
    } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: error.message })
    }
  },

  // Get payrolls for a period
  async getPayrolls(req, res) {
    try {
      const { start_date, end_date } = req.query
      if (!start_date || !end_date) {
        return res.status(400).json({ success: false, message: 'Start and end date required.' })
      }
      const payrolls = await Payroll.findAll({
        where: {
          start_date: { [Op.lte]: end_date },
          end_date: { [Op.gte]: start_date },
          deleted_at: null,
        },
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['full_name'],
          },
          {
            model: PayrollDeduction,
            as: 'deductions',
          },
        ],
      })
      res.json({ success: true, data: payrolls })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  },

  // Submit payroll for review (HR)
  async submitPayroll(req, res) {
    try {
      const { id } = req.params
      const { remarks } = req.body
      const payroll = await Payroll.findByPk(id)
      if (!payroll) return res.status(404).json({ success: false, message: 'Payroll not found.' })
      if (payroll.status !== 0)
        return res
          .status(400)
          .json({ success: false, message: 'Only Draft payrolls can be submitted.' })
      await payroll.update({ status: 1 })
      await AuditLog.create({
        payroll_id: payroll.id,
        user_id: req.user.employee_id,
        employee_id: payroll.employee_id,
        action: 'submit',
        remarks: remarks || null,
      })
      res.json({ success: true, message: 'Payroll submitted for review.' })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  },

  // Approve payroll (Finance)
  async approvePayroll(req, res) {
    try {
      const { id } = req.params
      const { remarks } = req.body
      const payroll = await Payroll.findByPk(id)
      if (!payroll) return res.status(404).json({ success: false, message: 'Payroll not found.' })
      if (payroll.status !== 1)
        return res
          .status(400)
          .json({ success: false, message: 'Only payrolls For Review can be approved.' })
      await payroll.update({ status: 2 })
      await AuditLog.create({
        payroll_id: payroll.id,
        user_id: req.user.employee_id,
        employee_id: payroll.employee_id,
        action: 'approve',
        remarks: remarks || null,
      })
      res.json({ success: true, message: 'Payroll approved.' })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  },

  // Reject payroll (Finance)
  async rejectPayroll(req, res) {
    try {
      const { id } = req.params
      const { remarks } = req.body
      const payroll = await Payroll.findByPk(id)
      if (!payroll) return res.status(404).json({ success: false, message: 'Payroll not found.' })
      if (payroll.status !== 1)
        return res
          .status(400)
          .json({ success: false, message: 'Only payrolls For Review can be rejected.' })
      await payroll.update({ status: 3, remarks })
      await AuditLog.create({
        payroll_id: payroll.id,
        user_id: req.user.employee_id,
        employee_id: payroll.employee_id,
        action: 'reject',
        remarks: remarks,
      })
      res.json({ success: true, message: 'Payroll rejected.' })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  },

  // Mark as processed (HR/Finance)
  async processPayroll(req, res) {
    try {
      const { id } = req.params
      const payroll = await Payroll.findByPk(id)
      if (!payroll) return res.status(404).json({ success: false, message: 'Payroll not found.' })
      if (payroll.status !== 2)
        return res
          .status(400)
          .json({ success: false, message: 'Only approved payrolls can be processed.' })
      await payroll.update({ status: 9 })
      await AuditLog.create({
        payroll_id: payroll.id,
        user_id: req.user.employee_id,
        employee_id: payroll.employee_id,
        action: 'process',
        remarks: null,
      })
      res.json({ success: true, message: 'Payroll marked as processed.' })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  },

  // Edit a rejected payroll
  async editPayroll(req, res) {
    try {
      const { id } = req.params
      const updates = req.body
      const payroll = await Payroll.findByPk(id)

      if (!payroll) {
        return res.status(404).json({ success: false, message: 'Payroll not found.' })
      }
      if (payroll.status !== 3) {
        // 3 = Rejected
        return res
          .status(400)
          .json({ success: false, message: 'Only rejected payrolls can be edited.' })
      }

      // Always set status to Draft after edit
      await payroll.update({
        ...updates,
        status: 0,
      })

      // Log the edit
      await AuditLog.create({
        payroll_id: payroll.id,
        user_id: req.user.employee_id,
        employee_id: payroll.employee_id,
        action: 'edit',
        remarks: updates.remarks || null,
      })

      res.json({ success: true, message: 'Payroll updated. Please resubmit for review.' })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  },
}

module.exports = payrollController
