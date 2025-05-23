const express = require('express')
const router = express.Router()
const payrollController = require('../../controller/main branch/payroll-controller.js')
const { verifyToken } = require('../../middleware/auth-middleware.js')
const {
  getAuditLogs,
  getAllAuditLogs,
} = require('../../controller/main branch/audit-log-controller.js')

// Generate payrolls for a period
router.post('/generate', verifyToken, payrollController.generatePayrolls)

// Get payrolls for a period
router.get('/', verifyToken, payrollController.getPayrolls)

// HR: Submit payroll for review
router.post('/:id/submit', verifyToken, payrollController.submitPayroll)

// Finance: Approve payroll
router.post('/:id/approve', verifyToken, payrollController.approvePayroll)

// Finance: Reject payroll
router.post('/:id/reject', verifyToken, payrollController.rejectPayroll)

// HR/Finance: Mark as processed
router.post('/:id/process', verifyToken, payrollController.processPayroll)

// HR: Edit a rejected payroll
router.patch('/:id', verifyToken, payrollController.editPayroll)

// Get audit logs for a payroll
router.get('/audit-logs', verifyToken, getAuditLogs)

// Get all audit logs
router.get('/audit-logs/all', verifyToken, getAllAuditLogs)

// Add these routes
router.post('/bulk-submit', verifyToken, payrollController.bulkSubmitPayrolls)
router.post('/bulk-approve', verifyToken, payrollController.bulkApprovePayrolls)
router.post('/bulk-process', verifyToken, payrollController.bulkMarkAsPaid)

module.exports = router
