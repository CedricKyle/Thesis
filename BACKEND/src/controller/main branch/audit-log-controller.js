const { AuditLog, User, Employee, Payroll } = require('../../model/Index.js')

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

module.exports = { getAuditLogs }
