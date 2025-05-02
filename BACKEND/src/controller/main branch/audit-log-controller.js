const { AuditLog } = require('../../model/Index.js')

async function getAuditLogs(req, res) {
  try {
    const { payroll_id } = req.query
    if (!payroll_id) {
      return res.status(400).json({ success: false, message: 'payroll_id is required' })
    }
    const logs = await AuditLog.findAll({
      where: { payroll_id },
      order: [['created_at', 'ASC']],
    })
    res.json({ success: true, data: logs })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

module.exports = { getAuditLogs }
