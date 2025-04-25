const express = require('express')
const router = express.Router()
const attendanceController = require('../../controller/main branch/attendance-controller.js')
const { verifyToken } = require('../../middleware/auth-middleware.js')

// Time in/out routes
router.post('/time-in', verifyToken, attendanceController.timeIn)
router.post('/time-out', verifyToken, attendanceController.timeOut)

// Approval route (requires HR permission)
router.post('/:id/approve', verifyToken, attendanceController.approveAttendance)

// Get attendance info
router.get('/today', verifyToken, attendanceController.getTodayAttendance)

// New routes
router.get('/history/:employee_id', verifyToken, attendanceController.getAttendanceHistory)
router.get('/department/:department', verifyToken, attendanceController.getDepartmentAttendance)
router.get('/monthly/:employee_id', verifyToken, attendanceController.getMonthlyReport)

// Add this route at the top of your routes
router.get('/', verifyToken, attendanceController.getAllAttendance)

// Add this new route for deleting attendance
router.delete('/attendance/:id', attendanceController.deleteAttendance)

module.exports = router
