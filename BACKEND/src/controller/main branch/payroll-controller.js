const {
  Employee,
  EmployeeAttendance,
  Position,
  Payroll,
  EmployeeDeduction,
  AuditLog,
} = require('../../model/Index.js')
const { Op } = require('sequelize')

function getWeekNumber(dateString) {
  const date = new Date(dateString)
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
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
        // Attendance for period
        const attendance = await EmployeeAttendance.findAll({
          where: {
            employee_id: emp.employee_id,
            date: { [Op.between]: [start_date, end_date] },
            deleted_at: null,
          },
        })

        // Position/rate
        const position = await Position.findOne({ where: { id: emp.position_id } })
        const ratePerHour = position ? position.rate_per_hour : 0

        // Calculations
        const totalHours = attendance.reduce((sum, a) => sum + Number(a.hours_worked || 0), 0)
        const overtimeHours = attendance.reduce((sum, a) => sum + Number(a.overtime_hours || 0), 0)
        const tardiness = attendance.reduce((sum, a) => sum + Number(a.tardiness_deduction || 0), 0)
        const absences = attendance.filter((a) => a.absent).length
        const absentDeduction = attendance.reduce(
          (sum, a) => sum + Number(a.absent_deduction || 0),
          0,
        )
        const holidayPay = attendance.reduce((sum, a) => sum + Number(a.holiday_pay || 0), 0)
        const daysPresent = attendance.filter((a) => !a.absent).length

        const regularPay = totalHours * ratePerHour
        const overtimePay = overtimeHours * (ratePerHour * 1.25)
        const grossPay = regularPay + overtimePay + holidayPay

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

        // Sum employee shares
        let totalMandatoryDeduction = 0
        deductions.forEach((d) => {
          // Compute base contribution
          let contribution = grossPay * (d.percentage_rate / 100)
          // Apply min/max if set
          if (d.minimum_contribution && contribution < d.minimum_contribution)
            contribution = parseFloat(d.minimum_contribution)
          if (d.maximum_contribution && contribution > d.maximum_contribution)
            contribution = parseFloat(d.maximum_contribution)
          // Employee share
          const employeeShare = contribution * (d.employee_share / d.percentage_rate)
          totalMandatoryDeduction += employeeShare
        })

        // Add to other deductions
        const deduction = tardiness + absentDeduction + totalMandatoryDeduction
        const netPay = grossPay - deduction

        await Payroll.create({
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
          tardiness_deduction: tardiness,
          status: 0, // Draft
          allowance: 0,
          bonus: 0,
          paid_holiday: holidayPay,
          deduction,
          gross_pay: grossPay,
          salary_before_tax: grossPay,
          net_pay: netPay,
          tax_deduction: 0,
        })
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
        where: { start_date, end_date, deleted_at: null },
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
      const payroll = await Payroll.findByPk(id)
      if (!payroll) return res.status(404).json({ success: false, message: 'Payroll not found.' })
      if (payroll.status !== 0)
        return res
          .status(400)
          .json({ success: false, message: 'Only Draft payrolls can be submitted.' })
      await payroll.update({ status: 1 }) // For Review
      await AuditLog.create({
        payroll_id: payroll.id,
        user_id: req.user.id,
        action: 'submit',
        remarks: null,
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
      const payroll = await Payroll.findByPk(id)
      if (!payroll) return res.status(404).json({ success: false, message: 'Payroll not found.' })
      if (payroll.status !== 1)
        return res
          .status(400)
          .json({ success: false, message: 'Only payrolls For Review can be approved.' })
      await payroll.update({ status: 2 })
      await AuditLog.create({
        payroll_id: payroll.id,
        user_id: req.user.id,
        action: 'approve',
        remarks: null,
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
        user_id: req.user.id,
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
        user_id: req.user.id,
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

      await payroll.update(updates)

      // Log the edit
      await AuditLog.create({
        payroll_id: payroll.id,
        user_id: req.user.id,
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
