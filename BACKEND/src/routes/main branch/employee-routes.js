const express = require('express')
const employeeController = require('../../controller/main branch/employee-controller.js')
const { upload } = require('../../utils/main branch/fileHandler.js')
const { verifyToken } = require('../../middleware/auth-middleware.js')

const router = express.Router()

// Public routes (no authentication needed)
router.post('/login', employeeController.login)
router.post('/logout', employeeController.logout)

// Protected routes (require authentication)
// Employee routes
router.get('/verify', verifyToken, employeeController.verifyToken)

// Password change route
router.post('/change-password', verifyToken, employeeController.changePassword)

// New route for updating personal information without permission checks (just authentication)
router.put('/personal-info/update', verifyToken, employeeController.updatePersonalInfo)

// Use upload for profile image and resume uploads
router.post('/', verifyToken, upload, employeeController.createEmployee)

router.get('/', verifyToken, employeeController.getAllEmployees)
router.get('/:id', verifyToken, employeeController.getAllEmployeeById)

router.put('/:id', verifyToken, upload, employeeController.updateEmployee)

router.delete('/:id', verifyToken, employeeController.deleteEmployee)

// Add restore route
router.post('/:id/restore', verifyToken, employeeController.restoreEmployee)

// Add profile image update route
router.post('/update-profile-image', verifyToken, upload, employeeController.updateProfileImage)

// Add route for serving files - might want to protect this based on your requirements
router.get('/files/:type/:filename', verifyToken, employeeController.getFile)

// Emergency contact routes
router.get('/:id/emergency-contact', verifyToken, employeeController.checkEmergencyContact)
router.post(
  '/:id/emergency-contact/restore',
  verifyToken,
  employeeController.restoreEmergencyContact,
)

module.exports = router
