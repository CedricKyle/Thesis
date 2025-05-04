const express = require('express')
const router = express.Router()
const attendanceController = require('../../controller/main branch/attendance-controller.js')
const { verifyToken } = require('../../middleware/auth-middleware.js')
const multer = require('multer')
const path = require('path')
const { markAllAbsentForToday } = require('../../controller/main branch/attendance-controller')

// Configure storage for overtime proof images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/overtime_proofs/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  },
})
const uploadOvertime = multer({ storage })

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

// Overtime filing route
router.post(
  '/overtime',
  verifyToken,
  uploadOvertime.single('image'),
  attendanceController.fileOvertime,
)

// Update attendance route
router.put(
  '/:id',
  verifyToken,
  uploadOvertime.single('overtime_proof'),
  attendanceController.updateAttendance,
)

// Reject OT route
router.put('/attendance/:id/reject-ot', attendanceController.rejectOvertime)

// Add this new route for marking all employees absent for today
router.post('/attendance/mark-all-absent', markAllAbsentForToday)

module.exports = router
