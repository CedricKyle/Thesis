const { AuditLog, User, Employee, Payroll } = require('../../model/Index.js')
const { Op } = require('sequelize')

async function getAuditLogs(req, res) {
  try {
    const { payroll_id } = req.query
    if (!payroll_id) {
      return res.status(400).json({ success: false, message: 'payroll_id is required' })
    }
    const logs = await AuditLog.findAll({
      where: { payroll_id },
      order: [['created_at', 'ASC']],
      include: [
        { model: Employee, as: 'employee', attributes: ['full_name', 'employee_id'] },
        { model: Employee, as: 'actor', attributes: ['full_name', 'employee_id'] },
        { model: Payroll, as: 'payroll', attributes: ['start_date', 'end_date'] },
      ],
    })
    res.json({ success: true, data: logs })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

async function getAllAuditLogs(req, res) {
  try {
    const { start_date, end_date } = req.query
    const where = {}
    // Setup include for Payroll with where filter
    const include = [
      { model: Employee, as: 'employee', attributes: ['full_name', 'employee_id'] },
      { model: Employee, as: 'actor', attributes: ['full_name', 'employee_id'] },
      {
        model: Payroll,
        as: 'payroll',
        attributes: ['start_date', 'end_date'],
        where: {},
      },
    ]

    // Filter by payroll period (not log creation date)
    if (start_date && end_date) {
      include[2].where = {
        start_date: { [Op.gte]: start_date },
        end_date: { [Op.lte]: end_date },
      }
    } else {
      // Remove where if not filtering by period
      delete include[2].where
    }

    const logs = await AuditLog.findAll({
      where,
      order: [['created_at', 'DESC']],
      include,
    })
    res.json({ success: true, data: logs })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

module.exports = { getAuditLogs, getAllAuditLogs }
