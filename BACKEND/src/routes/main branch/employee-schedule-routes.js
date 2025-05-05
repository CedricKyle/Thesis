const express = require('express')
const controller = require('../../controller/main branch/employee-schedule-controller.js')
const { verifyToken } = require('../../middleware/auth-middleware.js')

const router = express.Router()

router.get('/active', verifyToken, controller.getActiveEmployeeSchedules)
router.get('/', verifyToken, controller.getEmployeeSchedules)
router.post('/', verifyToken, controller.assignSchedule)
router.put('/:id', verifyToken, controller.updateEmployeeSchedule)
router.delete('/:id', verifyToken, controller.deleteEmployeeSchedule)
router.post('/:id/restore', verifyToken, controller.restoreEmployeeSchedule)
router.get('/:employee_id', verifyToken, controller.getEmployeeSchedule)

module.exports = router
