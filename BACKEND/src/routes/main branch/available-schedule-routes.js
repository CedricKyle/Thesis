const express = require('express')
const controller = require('../../controller/main branch/available-schedule-controller.js')
const { verifyToken } = require('../../middleware/auth-middleware.js')

const router = express.Router()

router.get('/', verifyToken, controller.getSchedules)
router.get('/:id', verifyToken, controller.getScheduleById)
router.post('/', verifyToken, controller.createSchedule)
router.put('/:id', verifyToken, controller.updateSchedule)
router.delete('/:id', verifyToken, controller.deleteSchedule)
router.post('/:id/restore', verifyToken, controller.restoreSchedule)

module.exports = router
