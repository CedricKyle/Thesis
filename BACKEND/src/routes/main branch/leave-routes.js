const express = require('express')
const router = express.Router()
const leaveController = require('../../controller/main branch/leave-controller')

// CRUD
router.get('/', leaveController.getAllLeaves)
router.get('/:id', leaveController.getLeaveById)
router.post('/', leaveController.createLeave)
router.put('/:id', leaveController.updateLeave)
router.delete('/:id', leaveController.deleteLeave)
router.patch('/:id/restore', leaveController.restoreLeave)

// Approval
router.patch('/:id/approve', leaveController.approveLeave)
router.patch('/:id/reject', leaveController.rejectLeave)

module.exports = router
